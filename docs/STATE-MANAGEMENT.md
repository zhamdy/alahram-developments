# State Management Guide

This guide covers state management in the Al-Ahram Developments project using NgRx Signal Store, Angular Signals, and RxJS. The project uses NgRx Signal Store (`@ngrx/signals`) for shared/global state and Angular Signals for local component state.

---

## Table of Contents

1. [Overview](#overview)
2. [NgRx Signal Store Fundamentals](#ngrx-signal-store-fundamentals)
3. [The AppStore (Global Store)](#the-appstore-global-store)
4. [Feature-Level Stores](#feature-level-stores)
5. [SSR Integration](#ssr-integration)
6. [When to Use What](#when-to-use-what)
7. [Patterns and Recipes](#patterns-and-recipes)
8. [Testing Stores](#testing-stores)

---

## Overview

The state management strategy is layered:

| Layer | Tool | Scope | Examples |
|-------|------|-------|----------|
| Global app state | NgRx Signal Store | App-wide singleton | Theme, sidebar, user preferences |
| Feature state | NgRx Signal Store | Feature module | Projects list, filters, pagination |
| Service state | Angular Signals | Injected service | Auth state, loading counter |
| Component state | Angular Signals | Single component | Form state, toggle flags |
| Async data | RxJS Observables | HTTP pipeline | API calls, interceptors |

---

## NgRx Signal Store Fundamentals

NgRx Signal Store is a lightweight, signal-based state management solution. It uses `signalStore()` to create injectable stores with typed state, computed properties, and methods.

### Core Building Blocks

```typescript
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';
```

| Function | Purpose |
|----------|---------|
| `signalStore()` | Creates the store class |
| `withState(initialState)` | Defines the state shape and initial values |
| `withComputed(store => ({}))` | Adds derived/computed signals |
| `withMethods(store => ({}))` | Adds methods that can read and update state |
| `withHooks({ onInit, onDestroy })` | Lifecycle hooks for the store |
| `patchState(store, partialState)` | Updates state immutably |

### Basic Store Example

```typescript
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';

interface CounterState {
  count: number;
}

const initialState: CounterState = {
  count: 0,
};

export const CounterStore = signalStore(
  withState(initialState),
  withComputed(store => ({
    doubleCount: computed(() => store.count() * 2),
    isPositive: computed(() => store.count() > 0),
  })),
  withMethods(store => ({
    increment(): void {
      patchState(store, state => ({ count: state.count + 1 }));
    },
    decrement(): void {
      patchState(store, state => ({ count: state.count - 1 }));
    },
    reset(): void {
      patchState(store, { count: 0 });
    },
    setCount(count: number): void {
      patchState(store, { count });
    },
  }))
);
```

---

## The AppStore (Global Store)

The project has a global `AppStore` defined in `src/app/core/state/app.store.ts`:

```typescript
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';

export interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

const initialState: AppState = {
  theme: 'light',
  sidebarOpen: false,
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(store => ({
    isDarkMode: computed(() => store.theme() === 'dark'),
  })),
  withMethods(store => ({
    toggleTheme(): void {
      const next: 'light' | 'dark' = store.theme() === 'light' ? 'dark' : 'light';
      patchState(store, { theme: next });
    },
    setTheme(theme: 'light' | 'dark'): void {
      patchState(store, { theme });
    },
    toggleSidebar(): void {
      patchState(store, state => ({ sidebarOpen: !state.sidebarOpen }));
    },
    setSidebar(open: boolean): void {
      patchState(store, { sidebarOpen: open });
    },
  }))
);
```

### Key Design Decisions

- **`providedIn: 'root'`**: The store is a singleton available throughout the application. It does not need to be provided in any module or component.
- **Typed state interface**: `AppState` is explicitly defined for type safety.
- **Computed signals**: `isDarkMode` is derived from `theme` and automatically updates when `theme` changes.
- **patchState with updater function**: `toggleSidebar` uses the function form `state => ({...})` to read the current state before updating.

### Usage in Components

```typescript
@Component({
  selector: 'ahram-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button (click)="appStore.toggleTheme()">
      @if (appStore.isDarkMode()) {
        Light Mode
      } @else {
        Dark Mode
      }
    </button>
  `,
})
export class HeaderComponent {
  protected readonly appStore = inject(AppStore);
}
```

Signal Store properties are signals, so they work natively with Angular's change detection. You call them as functions in templates: `appStore.isDarkMode()`, `appStore.theme()`.

---

## Feature-Level Stores

Feature stores manage state for specific features (projects, contacts, etc.) and are typically provided at the feature route level or in the component that needs them.

### Example: Projects Feature Store

```typescript
// src/app/features/projects/state/projects.store.ts
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { ApiService } from '@core/services/api.service';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  location: string;
  price: number;
  coverImage: string;
}

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
  filter: {
    status: string;
    search: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: ProjectsState = {
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  filter: {
    status: '',
    search: '',
  },
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
  },
};

export const ProjectsStore = signalStore(
  withState(initialState),

  withComputed(store => ({
    filteredProjects: computed(() => {
      let projects = store.projects();
      const status = store.filter().status;
      const search = store.filter().search.toLowerCase();

      if (status) {
        projects = projects.filter(p => p.status === status);
      }
      if (search) {
        projects = projects.filter(p =>
          p.name.toLowerCase().includes(search) ||
          p.location.toLowerCase().includes(search)
        );
      }
      return projects;
    }),

    totalPages: computed(() =>
      Math.ceil(store.pagination().total / store.pagination().limit)
    ),

    hasProjects: computed(() => store.projects().length > 0),
  })),

  withMethods((store, api = inject(ApiService)) => ({
    loadProjects: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          const { page, limit } = store.pagination();
          const { status, search } = store.filter();
          return api.getPaginated<Project>('/projects', { page, limit, status, search }).pipe(
            tapResponse({
              next: response => {
                patchState(store, {
                  projects: response.data,
                  pagination: {
                    ...store.pagination(),
                    total: response.meta.total,
                  },
                  isLoading: false,
                });
              },
              error: (error: { message: string }) => {
                patchState(store, { error: error.message, isLoading: false });
              },
            })
          );
        })
      )
    ),

    setFilter(filter: Partial<ProjectsState['filter']>): void {
      patchState(store, state => ({
        filter: { ...state.filter, ...filter },
        pagination: { ...state.pagination, page: 1 },
      }));
    },

    setPage(page: number): void {
      patchState(store, state => ({
        pagination: { ...state.pagination, page },
      }));
    },

    selectProject(project: Project | null): void {
      patchState(store, { selectedProject: project });
    },

    clearError(): void {
      patchState(store, { error: null });
    },
  })),

  withHooks({
    onInit(store) {
      // Automatically load projects when the store is initialized
      store.loadProjects();
    },
  })
);
```

### Providing Feature Stores

Feature stores are **not** `providedIn: 'root'`. They are provided at the route or component level:

**Option 1: Route-level provider**

```typescript
// src/app/features/projects/projects.routes.ts
export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    providers: [ProjectsStore],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/project-list/project-list.component')
          .then(m => m.ProjectListComponent),
      },
      {
        path: ':slug',
        loadComponent: () => import('./pages/project-detail/project-detail.component')
          .then(m => m.ProjectDetailComponent),
      },
    ],
  },
];
```

**Option 2: Component-level provider**

```typescript
@Component({
  selector: 'ahram-project-list',
  providers: [ProjectsStore],
  template: `...`,
})
export class ProjectListComponent {
  readonly store = inject(ProjectsStore);
}
```

The difference: route-level providers share the store instance across all child routes. Component-level providers create a new instance per component instance.

---

## SSR Integration

### State Transfer

NgRx Signal Store state is **not** automatically serialized in the HTTP Transfer State. The key principle is: **fetch data through `HttpClient`**, and Angular's Transfer State will handle the caching.

When a store uses `rxMethod` with `ApiService` (which uses `HttpClient`), the HTTP responses are automatically cached in the Transfer State. On the client, the same API calls return instantly from the cache, and the store is populated with the same data as the server.

### Avoiding Server-Side Issues

Stores that access browser APIs must guard those calls:

```typescript
withHooks({
  onInit(store) {
    const platform = inject(PlatformService);

    // Load from API (works on both server and client)
    store.loadProjects();

    // Load user preferences from localStorage (browser only)
    platform.runInBrowser(() => {
      const savedFilter = localStorage.getItem('project-filter');
      if (savedFilter) {
        store.setFilter(JSON.parse(savedFilter));
      }
    });
  },
})
```

### Hydration-Safe Patterns

Ensure the server and client render the same initial UI by initializing stores with the same default state:

```typescript
// Good: Default state is consistent between server and client
const initialState: ProjectsState = {
  projects: [],
  isLoading: false,  // NOT true -- server renders with isLoading: false
  error: null,
};
```

If you set `isLoading: true` in the initial state, the server renders a loading spinner, but the client (after Transfer State resolves) renders the actual content, causing a hydration mismatch.

---

## When to Use What

### NgRx Signal Store

Use when:
- State is shared across multiple components.
- State needs computed derived values.
- State changes are complex (async flows, side effects).
- You need a clear separation of state logic from UI logic.

Examples: Theme/layout state, feature data (projects, users), shopping cart, filter state.

```typescript
// Shared feature state with computed values and async methods
export const ProjectsStore = signalStore(
  withState(initialState),
  withComputed(store => ({ /* derived state */ })),
  withMethods(store => ({ /* state mutations + async */ })),
);
```

### Plain Angular Signals

Use when:
- State is local to a single component.
- State is simple (a flag, a counter, a form value).
- No derived state or async operations needed.

Examples: Toggle visibility, form field tracking, local UI state.

```typescript
@Component({
  template: `
    <div>
      <button (click)="showFilters.set(!showFilters())">Toggle Filters</button>
      @if (showFilters()) {
        <ahram-filter-panel />
      }
    </div>
  `,
})
export class SomeComponent {
  readonly showFilters = signal(false);
  readonly selectedTab = signal<'details' | 'gallery' | 'map'>('details');
}
```

### Signal-Based Services

Use when:
- State is shared but does not need the full store machinery.
- The state is reactive but with simple update patterns.

Examples: `LoadingService`, `AuthService` state signals.

```typescript
// src/app/core/state/loading.service.ts
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _activeRequests = signal(0);
  readonly isLoading = computed(() => this._activeRequests() > 0);

  start(): void {
    this._activeRequests.update(count => count + 1);
  }

  stop(): void {
    this._activeRequests.update(count => Math.max(0, count - 1));
  }
}
```

### RxJS Observables

Use when:
- Working with the HTTP pipeline (interceptors, API calls).
- You need operators like `switchMap`, `debounceTime`, `retry`.
- Integrating with libraries that return Observables.

Examples: API calls, WebSocket streams, complex async workflows.

```typescript
// HTTP calls remain Observable-based
getProjects(): Observable<ApiResponse<Project[]>> {
  return this.api.get<Project[]>('/projects');
}
```

### Decision Flowchart

```
Is the state local to one component?
  YES --> Use signal() or signal-based component state
  NO  --> Is it simple shared state (just a value, no computed)?
           YES --> Use a signal-based service (@Injectable + signal())
           NO  --> Use NgRx Signal Store (signalStore + withState + withMethods)
```

---

## Patterns and Recipes

### Pattern 1: Store with Entity Collection

For managing lists of entities with CRUD operations:

```typescript
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ContactsState {
  contacts: Contact[];
  selectedId: string | null;
  isLoading: boolean;
}

export const ContactsStore = signalStore(
  withState<ContactsState>({
    contacts: [],
    selectedId: null,
    isLoading: false,
  }),
  withComputed(store => ({
    selectedContact: computed(() => {
      const id = store.selectedId();
      return id ? store.contacts().find(c => c.id === id) ?? null : null;
    }),
  })),
  withMethods(store => ({
    addContact(contact: Contact): void {
      patchState(store, state => ({
        contacts: [...state.contacts, contact],
      }));
    },
    updateContact(id: string, changes: Partial<Contact>): void {
      patchState(store, state => ({
        contacts: state.contacts.map(c =>
          c.id === id ? { ...c, ...changes } : c
        ),
      }));
    },
    removeContact(id: string): void {
      patchState(store, state => ({
        contacts: state.contacts.filter(c => c.id !== id),
      }));
    },
    select(id: string | null): void {
      patchState(store, { selectedId: id });
    },
  }))
);
```

### Pattern 2: Store with RxJS Side Effects (rxMethod)

```typescript
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

export const SearchStore = signalStore(
  withState({
    query: '',
    results: [] as SearchResult[],
    isSearching: false,
  }),
  withMethods((store, api = inject(ApiService)) => ({
    search: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(query => patchState(store, { query, isSearching: true })),
        switchMap(query =>
          api.get<SearchResult[]>('/search', { q: query }).pipe(
            tapResponse({
              next: response => patchState(store, {
                results: response.data,
                isSearching: false,
              }),
              error: () => patchState(store, { isSearching: false }),
            })
          )
        )
      )
    ),
  }))
);
```

Usage in a component:

```typescript
@Component({
  template: `
    <input
      type="text"
      (input)="onSearch($event)"
      [placeholder]="'common.search' | transloco"
    />
    @if (store.isSearching()) {
      <ahram-loading-spinner size="sm" />
    }
    @for (result of store.results(); track result.id) {
      <div>{{ result.title }}</div>
    }
  `,
})
export class SearchComponent {
  readonly store = inject(SearchStore);

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.store.search(query);  // Pass the value; rxMethod handles debounce
  }
}
```

### Pattern 3: Persisting Store State to localStorage

```typescript
import { effect, inject } from '@angular/core';
import { PlatformService } from '@core/services/platform.service';

export const PreferencesStore = signalStore(
  { providedIn: 'root' },
  withState({
    currency: 'EGP' as string,
    measurementUnit: 'sqm' as 'sqm' | 'sqft',
  }),
  withMethods(store => ({
    setCurrency(currency: string): void {
      patchState(store, { currency });
    },
    setUnit(unit: 'sqm' | 'sqft'): void {
      patchState(store, { measurementUnit: unit });
    },
  })),
  withHooks({
    onInit(store) {
      const platform = inject(PlatformService);

      // Restore from localStorage
      platform.runInBrowser(() => {
        const saved = localStorage.getItem('ahram-preferences');
        if (saved) {
          const parsed = JSON.parse(saved);
          patchState(store, parsed);
        }
      });

      // Auto-save on changes
      effect(() => {
        const state = {
          currency: store.currency(),
          measurementUnit: store.measurementUnit(),
        };
        platform.runInBrowser(() => {
          localStorage.setItem('ahram-preferences', JSON.stringify(state));
        });
      });
    },
  })
);
```

### Pattern 4: Connecting Signal Store to Template with Computed Signals

```typescript
@Component({
  selector: 'ahram-project-list',
  providers: [ProjectsStore],
  template: `
    <ahram-card>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold font-display">{{ 'projects.title' | transloco }}</h2>
        <span class="text-sm text-muted-foreground">
          {{ store.pagination().total | translateNumber }} {{ 'projects.count' | transloco }}
        </span>
      </div>

      @if (store.isLoading()) {
        <ahram-loading-spinner />
      } @else if (store.error()) {
        <p class="text-destructive">{{ store.error() }}</p>
        <ahram-button variant="outline" (clicked)="store.loadProjects()">
          {{ 'common.retry' | transloco }}
        </ahram-button>
      } @else {
        @for (project of store.filteredProjects(); track project.id) {
          <ahram-project-card [project]="project" />
        } @empty {
          <p class="text-muted-foreground">{{ 'common.noResults' | transloco }}</p>
        }
      }
    </ahram-card>
  `,
})
export class ProjectListComponent {
  readonly store = inject(ProjectsStore);
}
```

---

## Testing Stores

### Unit Testing a Signal Store

```typescript
import { TestBed } from '@angular/core/testing';
import { AppStore } from './app.store';

describe('AppStore', () => {
  let store: InstanceType<typeof AppStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppStore],
    });
    store = TestBed.inject(AppStore);
  });

  it('should initialize with light theme', () => {
    expect(store.theme()).toBe('light');
    expect(store.isDarkMode()).toBe(false);
  });

  it('should toggle theme', () => {
    store.toggleTheme();
    expect(store.theme()).toBe('dark');
    expect(store.isDarkMode()).toBe(true);

    store.toggleTheme();
    expect(store.theme()).toBe('light');
  });

  it('should set theme directly', () => {
    store.setTheme('dark');
    expect(store.theme()).toBe('dark');
  });

  it('should toggle sidebar', () => {
    expect(store.sidebarOpen()).toBe(false);
    store.toggleSidebar();
    expect(store.sidebarOpen()).toBe(true);
  });
});
```

### Testing Components That Use Stores

```typescript
describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let appStore: InstanceType<typeof AppStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [AppStore],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    appStore = TestBed.inject(AppStore);
    fixture.detectChanges();
  });

  it('should toggle theme when button is clicked', () => {
    const button = fixture.nativeElement.querySelector('[data-testid="theme-toggle"]');
    button.click();
    expect(appStore.isDarkMode()).toBe(true);
  });
});
```
