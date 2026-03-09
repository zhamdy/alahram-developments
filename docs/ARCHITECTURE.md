# Al-Ahram Developments -- Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [3-Layer Architecture](#3-layer-architecture)
4. [DDD Principles](#ddd-principles)
5. [Smart vs Dumb Components](#smart-vs-dumb-components)
6. [Data Flow](#data-flow)
7. [Dependency Rules](#dependency-rules)
8. [SSR Architecture](#ssr-architecture)
9. [State Management](#state-management)
10. [Interceptor Chain](#interceptor-chain)
11. [Internationalization](#internationalization)
12. [Theming](#theming)
13. [Deployment Architecture](#deployment-architecture)
14. [Path Aliases](#path-aliases)
15. [Environment Configuration](#environment-configuration)

---

## Overview

Al-Ahram Developments is a real estate development company website built as an Angular 21 application with full Server-Side Rendering (SSR). The project follows a strict 3-layer architecture (Core, Shared, Features) combined with Domain-Driven Design principles at the feature level. All components use standalone APIs, OnPush change detection, and Angular signals for reactive state management.

**Component prefix:** `ahram`
**Default language:** Arabic (RTL)
**SSR engine:** Angular SSR with Express 5
**Styling:** Tailwind CSS v4 (CSS-first configuration)

---

## Technology Stack

| Concern              | Technology                          | Version   |
|----------------------|-------------------------------------|-----------|
| Framework            | Angular                             | 21.2      |
| Language             | TypeScript                          | 5.9       |
| SSR                  | @angular/ssr + Express              | 21.2 / 5  |
| State Management     | @ngrx/signals (Signal Store)        | 21.0      |
| Styling              | Tailwind CSS (CSS-first, PostCSS)   | 4.2       |
| i18n                 | @jsverse/transloco                  | 8.2       |
| Component Library    | Angular CDK                         | 21.2      |
| Reactive Primitives  | RxJS                                | 7.8       |
| Linting              | ESLint + @angular-eslint            | 21.3      |
| Formatting           | Prettier                            | 3.8       |
| Containerization     | Docker (multi-stage) + Nginx        | --        |

---

## 3-Layer Architecture

The application is organized into three clearly separated layers, each with a specific responsibility and strict import rules.

```
src/app/
 +-- core/                  # Layer 1: Core (Singleton)
 |    +-- models/           #   TypeScript interfaces & types
 |    +-- services/         #   Singleton services (API, Auth, SEO, i18n, Platform)
 |    +-- guards/           #   Route guards (auth, guest, role)
 |    +-- interceptors/     #   HTTP interceptors (auth, error, loading)
 |    +-- state/            #   Global state (AppStore, LoadingService)
 |    +-- layout/           #   App shell components (Header, Footer, NotFound)
 |
 +-- shared/                # Layer 2: Shared (Reusable)
 |    +-- ui/               #   Presentational components (Button, Card, Input, Spinner, ContactForm, Calculator, Newsletter)
 |    +-- pipes/            #   Transform pipes (localizeRoute, translateNumber, relativeTime, formatDate)
 |    +-- directives/       #   Attribute directives (clickOutside, lazyImage, imageFallback)
 |    +-- helpers/          #   Utility classes & functions (storage, SEO schema)
 |    +-- validators/       #   Custom form validators (phone, national ID, etc.)
 |
 +-- features/              # Layer 3: Features (Lazy-loaded)
      +-- <feature-name>/   #   Self-contained feature modules
           +-- routes.ts    #     Feature route definitions
           +-- pages/       #     Smart (container) components
           +-- components/  #     Feature-specific presentational components
           +-- services/    #     Feature-specific data services
           +-- stores/      #     Feature-specific NgRx Signal Stores
           +-- models/      #     Feature-specific interfaces
```

### Layer 1: Core

The Core layer contains everything that must exist as a **single instance** across the entire application. All services here are `providedIn: 'root'` singletons. This layer is loaded eagerly at application startup and is never duplicated.

**What belongs in Core:**
- **Models** -- Application-wide TypeScript interfaces (`User`, `ApiResponse`, `PaginatedResponse`, `Environment`)
- **Services** -- Singleton services that manage cross-cutting concerns:
  - `ApiService` -- Generic HTTP client wrapper with typed methods (get, post, put, patch, delete)
  - `AuthService` -- Authentication state, login/logout, token management with signal-based reactivity
  - `SeoService` -- Dynamic meta tags, Open Graph, canonical URLs for SSR
  - `I18nService` -- Locale switching, RTL/LTR direction, document attribute management
  - `PlatformService` -- SSR-safe browser/server detection, `runInBrowser()` guard
  - `TranslocoHttpLoader` -- Translation file loader for Transloco
- **Guards** -- Route-level access control:
  - `authGuard` -- Redirects unauthenticated users to `/login`
  - `guestGuard` -- Redirects authenticated users away from login
  - `localeGuard` -- Validates `:locale` URL parameter (`'ar'` or `'en'`), initializes `I18nService` from URL
  - `roleGuard(...roles)` -- Factory function that creates guards for specific `UserRole` values (`admin`, `editor`, `viewer`)
- **Interceptors** -- HTTP pipeline middleware (see [Interceptor Chain](#interceptor-chain))
- **State** -- Global application state via `AppStore` (theme, sidebar) and `LoadingService` (request counting)
- **Layout** -- The application shell: `HeaderComponent`, `FooterComponent`, `NotFoundComponent`

### Layer 2: Shared

The Shared layer contains **reusable, stateless building blocks** that any feature can import. Nothing in Shared has knowledge of business logic or specific features.

**What belongs in Shared:**
- **UI Components** -- Dumb/presentational components with signal-based inputs and outputs:
  - `ButtonComponent` -- Variant-driven button (primary, secondary, outline, ghost, destructive) with loading state
  - `CardComponent` -- Content card with optional title and description
  - `InputComponent` -- Form input with label, validation error display, and type variants
  - `LoadingSpinnerComponent` -- Configurable spinner (sm/md/lg, optional fullscreen)
  - `WhatsappButtonComponent` -- Floating WhatsApp FAB with bounce animation, RTL-aware
  - `ContactFormComponent` -- Reusable contact/inquiry form (name, phone, email, project interest, message)
  - `InstallmentCalculatorComponent` -- Interactive payment calculator with monthly payment output
  - `NewsletterComponent` -- Email signup form with validation and success state
- **Pipes** -- Pure/impure transform pipes:
  - `LocalizeRoutePipe` -- Prepends `/${locale}` to routerLink values (pure: false)
  - `TranslateNumberPipe` -- Locale-aware number formatting (decimal, currency in EGP, percent) using `Intl.NumberFormat`
  - `RelativeTimePipe` -- Human-readable relative timestamps using `Intl.RelativeTimeFormat`
  - `FormatDatePipe` -- Locale-aware date formatting
- **Directives** -- Reusable attribute directives:
  - `ClickOutsideDirective` -- Emits when a click occurs outside the host element (SSR-safe)
  - `LazyImageDirective` -- IntersectionObserver-based lazy image loading with placeholder fallback
  - `ImageFallbackDirective` -- Provides fallback image on load error
- **Helpers** -- Utility functions and classes:
  - `StorageHelper` -- SSR-safe localStorage wrapper with JSON serialization
  - `buildOrganizationSchema()` / `buildProjectSchema()` / `buildBreadcrumbSchema()` -- Structured data helpers for SEO
- **Validators** -- Reusable Angular form validators:
  - `CustomValidators.egyptianPhone` -- Egyptian phone number validation
  - `CustomValidators.egyptianNationalId` -- 14-digit national ID validation
  - `CustomValidators.matchField(field)` -- Cross-field matching (e.g., password confirmation)
  - `CustomValidators.minAge(n)` -- Date-of-birth age verification
  - `CustomValidators.noWhitespace` -- Whitespace-only rejection

Every shared artifact is exported through barrel `index.ts` files for clean imports.

### Layer 3: Features

Features are **self-contained vertical slices** of the application, each representing a bounded context in the domain. Features are always lazy-loaded via `loadChildren` in the router.

```typescript
// app.routes.ts — all feature routes are nested under :locale
{
  path: ':locale',
  canActivate: [localeGuard],
  children: [
    {
      path: 'projects',
      loadChildren: () => import('./features/projects/projects.routes')
        .then(m => m.PROJECTS_ROUTES),
    },
    // ... other feature routes
  ],
},
```

Each feature is a mini-application with its own routes, pages, components, services, and stores. Features do not depend on each other; they only reach upward to Core and Shared. All routes are wrapped under the `:locale` parameter for path-based locale routing.

---

## DDD Principles

Each feature module follows Domain-Driven Design principles, keeping its domain logic self-contained within its directory boundary.

### Feature Structure

```
features/
 +-- projects/
 |    +-- projects.routes.ts        # Route definitions for /projects/**
 |    +-- pages/
 |    |    +-- project-list/        # Smart component: project listing page
 |    |    +-- project-detail/      # Smart component: single project page
 |    +-- components/
 |    |    +-- project-card/        # Dumb component: project preview card
 |    |    +-- project-gallery/     # Dumb component: image gallery
 |    |    +-- project-filter/      # Dumb component: filter controls
 |    +-- services/
 |    |    +-- projects.service.ts  # Data access via ApiService
 |    +-- stores/
 |    |    +-- projects.store.ts    # NgRx Signal Store for project state
 |    +-- models/
 |         +-- project.model.ts     # Feature-specific interfaces
 |
 +-- auth/
 |    +-- auth.routes.ts
 |    +-- pages/
 |    |    +-- login/
 |    |    +-- register/
 |    +-- ...
 |
 +-- contact/
      +-- contact.routes.ts
      +-- pages/
      |    +-- contact-page/
      +-- ...
```

### DDD Boundaries

1. **Ubiquitous Language** -- Each feature uses domain-specific terminology in its models, services, and components. A "project" in the `projects` feature has a precise interface that does not leak into other features.

2. **Encapsulation** -- Feature services call `ApiService` from Core but expose feature-specific typed methods. For example, a `ProjectsService` would expose `getProjects()`, `getProjectById(id)`, etc., rather than raw HTTP calls.

3. **Aggregate Roots** -- Each feature's store manages the state for its aggregate root. The store is the single source of truth for that feature's data, and components never bypass the store to fetch data directly.

4. **Anti-Corruption Layer** -- Feature services map API responses to feature-specific domain models, ensuring that backend API changes do not ripple into component templates.

---

## Smart vs Dumb Components

The project enforces a strict separation between Smart (container) and Dumb (presentational) components.

### Smart Components (Pages)

Smart components live in `features/<feature>/pages/`. They are responsible for:

- Injecting services and stores
- Orchestrating data fetching
- Managing page-level state
- Handling user actions by delegating to stores/services
- Setting SEO metadata via `SeoService`
- Applying route guards via `canActivate`

**Characteristics:**
- Inject `Store`, `Service`, `SeoService`, `I18nService`, etc.
- Contain minimal template logic
- Delegate rendering to dumb child components
- Connected to the router as page-level route components

```typescript
// Example: Smart component in a feature
@Component({
  selector: 'ahram-project-list-page',
  standalone: true,
  imports: [ProjectCardComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.isLoading()) {
      <ahram-loading-spinner />
    } @else {
      @for (project of store.projects(); track project.id) {
        <ahram-project-card
          [project]="project"
          (viewDetails)="onViewDetails($event)"
        />
      }
    }
  `,
})
export class ProjectListPageComponent implements OnInit {
  protected readonly store = inject(ProjectsStore);
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.store.loadProjects();
    this.seo.updateSeo({ title: 'Our Projects' });
  }

  protected onViewDetails(id: string): void {
    // Navigate to detail page
  }
}
```

### Dumb Components (Presentational)

Dumb components live in `shared/ui/` (application-wide) or `features/<feature>/components/` (feature-specific). They are responsible for:

- Rendering UI based on inputs
- Emitting user interactions through outputs
- Having zero knowledge of services, stores, or routing

**Characteristics:**
- Use `input()` and `output()` signal APIs exclusively
- No injected services (except possibly `I18nService` for display-only localization)
- No side effects
- Fully testable in isolation
- `ChangeDetectionStrategy.OnPush` enforced

```typescript
// Example: Dumb component (already exists in shared/ui)
@Component({
  selector: 'ahram-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button [disabled]="disabled() || loading()" (click)="handleClick()">
      @if (loading()) { <svg class="animate-spin ...">...</svg> }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly clicked = output<void>();
}
```

### Component Placement Summary

| Component Type | Location                          | Injects Services? | Has Inputs/Outputs? |
|----------------|-----------------------------------|--------------------|---------------------|
| Smart (Page)   | `features/<name>/pages/`          | Yes                | Rarely              |
| Dumb (Feature) | `features/<name>/components/`     | No                 | Always              |
| Dumb (Global)  | `shared/ui/`                      | No                 | Always              |
| Layout         | `core/layout/`                    | Minimal (i18n, store) | No               |

---

## Data Flow

### Request/Response Flow Diagram

```
+------------------------------------------------------------------+
|                        BROWSER / SSR                              |
|                                                                   |
|  +------------------+      +------------------+                   |
|  | Smart Component  |----->| Feature Store    |                   |
|  | (Page)           |<-----| (signalStore)    |                   |
|  +------------------+      +--------+---------+                   |
|         |                           |                             |
|         | renders                   | calls                      |
|         v                           v                             |
|  +------------------+      +------------------+                   |
|  | Dumb Components  |      | Feature Service  |                   |
|  | (Presentational) |      +--------+---------+                   |
|  +------------------+               |                             |
|                                     | delegates                  |
|                                     v                             |
|                            +------------------+                   |
|                            | ApiService       |                   |
|                            | (Core singleton) |                   |
|                            +--------+---------+                   |
|                                     |                             |
|                                     | HttpClient.get/post/...    |
|                                     v                             |
|                            +------------------+                   |
|                            | Interceptor      |                   |
|                            | Chain            |                   |
|                            | (auth -> error   |                   |
|                            |  -> loading)     |                   |
|                            +--------+---------+                   |
|                                     |                             |
+------------------------------------------------------------------+
                                      |
                                      | HTTPS
                                      v
                             +------------------+
                             | Backend API      |
                             | (REST)           |
                             +------------------+
```

### Detailed Data Flow Sequence

```
 Component          Store            Service          ApiService       Interceptors       Backend
     |                |                  |                 |                 |                |
     |  ngOnInit()    |                  |                 |                 |                |
     |--------------->|                  |                 |                 |                |
     |                | loadProjects()   |                 |                 |                |
     |                |----------------->|                 |                 |                |
     |                |                  | getProjects()   |                 |                |
     |                |                  |---------------->|                 |                |
     |                |                  |                 | GET /projects   |                |
     |                |                  |                 |---------------->|                |
     |                |                  |                 |                 |  +Bearer token |
     |                |                  |                 |                 |  +loading.start|
     |                |                  |                 |                 |--------------->|
     |                |                  |                 |                 |                |
     |                |                  |                 |                 |<---------------|
     |                |                  |                 |                 |  loading.stop  |
     |                |                  |                 |                 |  error check   |
     |                |                  |                 |<----------------|                |
     |                |                  |<----------------|                 |                |
     |                |  patchState()    |  map to models  |                 |                |
     |                |<-----------------|                 |                 |                |
     |  signal update |                  |                 |                 |                |
     |<---------------|                  |                 |                 |                |
     | re-render      |                  |                 |                 |                |
     |                |                  |                 |                 |                |
```

### Key Data Flow Principles

1. **Unidirectional** -- Data flows downward from stores to components. Events flow upward from components to stores.
2. **Single source of truth** -- Feature stores own all state for their domain. Components read state from stores via computed signals.
3. **Service isolation** -- Feature services transform raw API responses into domain models before handing them to stores.
4. **Interceptor transparency** -- Components and services are unaware of auth token attachment, error normalization, or loading state tracking. The interceptor chain handles these concerns automatically.

---

## Dependency Rules

The dependency graph is strictly hierarchical. Violations are prevented by convention and enforced through code review.

```
                    +--------------------+
                    |     FEATURES       |
                    | (Lazy-loaded,      |
                    |  self-contained)   |
                    +---------+----------+
                              |
                    can import|  cannot import
                    Core &    |  other Features
                    Shared    |
                              v
          +-------------------+-------------------+
          |                                       |
+---------+----------+              +-------------+--------+
|      SHARED        |              |        CORE          |
| (Reusable UI,      |              | (Singletons,         |
|  pipes, directives, |  can import  |  guards, interceptors,|
|  validators,        |------------>|  state, layout,       |
|  helpers)           |   Core only  |  models)              |
+--------------------+              +-----------------------+
                                              |
                                    cannot import
                                    Features or Shared
                                              |
                                              v
                                    +-------------------+
                                    | Angular Framework  |
                                    | (HttpClient,       |
                                    |  Router, etc.)     |
                                    +-------------------+
```

### Rules in Detail

| From \ To      | Core | Shared | Features | Other Feature |
|----------------|------|--------|----------|---------------|
| **Core**       | --   | NO     | NO       | NO            |
| **Shared**     | YES  | --     | NO       | NO            |
| **Feature A**  | YES  | YES    | --       | NO            |
| **Feature B**  | YES  | YES    | NO       | --            |

### Why These Rules Matter

- **Core cannot import Shared or Features** -- Core is the foundation. If it depended on higher layers, any change in Shared or Features could break the entire application.
- **Shared cannot import Features** -- Shared components must be generic and reusable. If a shared component depended on a feature, it would create a circular dependency and defeat the purpose of reusability.
- **Features cannot import other Features** -- This enforces bounded contexts. If Feature A needs data from Feature B, they communicate through Core services or a shared event bus, never through direct imports.
- **Barrel exports** -- Each layer uses `index.ts` barrel files to control its public API. Internal implementation files should not be imported directly from outside the layer.

### Import Path Convention

```typescript
// Feature importing from Core (allowed)
import { ApiService, AuthService } from '@core/services';
import { User, ApiResponse } from '@core/models';
import { authGuard } from '@core/guards';

// Feature importing from Shared (allowed)
import { ButtonComponent, CardComponent } from '@shared/ui';
import { TranslateNumberPipe } from '@shared/pipes';
import { CustomValidators } from '@shared/validators';

// Feature importing from another Feature (FORBIDDEN)
// import { ProjectsService } from '@features/projects/services';  // NEVER DO THIS
```

---

## SSR Architecture

The application uses Angular 21's built-in SSR with Express 5 for server-side rendering. This is critical for SEO (real estate content must be crawlable) and perceived performance.

### SSR Flow

```
+----------+       +-----------+       +------------------+       +------------------+
|  Browser |------>|   Nginx   |------>| Express (Node)   |------>| Angular SSR      |
|  Request |       | (Reverse  |       | src/server.ts    |       | Engine           |
|          |       |  Proxy)   |       |                  |       | (AngularNodeApp  |
|          |       |           |       |                  |       |  Engine)         |
+----------+       +-----------+       +------------------+       +------------------+
                                              |                          |
                                              |  Static files            |  Render to HTML
                                              |  served from             |  (full DOM with
                                              |  /browser dist           |   data)
                                              v                          v
                                       +------------------+       +------------------+
                                       | Cached assets    |       | HTML Response    |
                                       | (1y max-age)     |       | (Transfer State  |
                                       +------------------+       |  embedded)       |
                                                                  +--------+---------+
                                                                           |
                                                                           v
                                                                  +------------------+
                                                                  | Client Hydration |
                                                                  | (bootstrapApp    |
                                                                  |  + event replay) |
                                                                  +------------------+
```

### Entry Points

| File                 | Purpose                                              |
|----------------------|------------------------------------------------------|
| `src/main.ts`        | Browser bootstrap: `bootstrapApplication(AppComponent, appConfig)` |
| `src/main.server.ts` | Server bootstrap: merges `appConfig` + `serverConfig`, exports bootstrap function |
| `src/server.ts`      | Express server: static file serving + Angular SSR request handler |

### Server Configuration (`src/server.ts`)

The Express server performs three functions:

1. **Static file serving** -- Files in `/browser` (the compiled client assets) are served with a 1-year cache max-age. This includes JavaScript bundles, CSS, images, and fonts.

2. **SSR rendering** -- All non-static requests are passed to `AngularNodeAppEngine.handle(req)`, which renders the Angular application to HTML on the server.

3. **Request handler export** -- `createNodeRequestHandler(app)` is exported for use by the Angular CLI dev server and build tools.

### Server Route Configuration (`src/app/app.routes.server.ts`)

```typescript
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },

  // Legacy redirects
  { path: 'projects', renderMode: RenderMode.Server },
  // ...

  // Locale-prefixed static routes — prerender both ar and en
  {
    path: ':locale',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [{ locale: 'ar' }, { locale: 'en' }],
  },
  {
    path: ':locale/projects',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [{ locale: 'ar' }, { locale: 'en' }],
  },
  // ... same pattern for about, contact, gallery, blog, privacy

  // Dynamic routes — SSR on each request
  { path: ':locale/projects/:slug', renderMode: RenderMode.Server },
  { path: ':locale/blog/:slug', renderMode: RenderMode.Server },

  // Catch-all
  { path: '**', renderMode: RenderMode.Server },
];
```

Static routes use `RenderMode.Prerender` with `getPrerenderParams` to generate both locale variants at build time (25 prerendered routes total: root + 12 routes x 2 locales). Dynamic routes (project/blog detail pages) use `RenderMode.Server` for on-demand SSR.

### Client Hydration

The client-side configuration (`app.config.ts`) enables hydration with two important features:

```typescript
provideClientHydration(
  withEventReplay(),                                    // Replay user events during hydration
  withHttpTransferCacheOptions({ includePostRequests: true })  // Transfer HTTP cache state
)
```

- **Event Replay** -- If a user clicks a button before hydration completes, Angular records the event and replays it once the application is fully interactive. This prevents "dead clicks" during the hydration window.

- **HTTP Transfer State** -- API responses fetched during server rendering are serialized into the HTML payload as a transfer state. When the client bootstraps, it reads this cached data instead of making duplicate HTTP requests. This eliminates the "flash of empty content" and reduces API load. The `includePostRequests: true` option extends this to POST requests as well.

### SSR-Safe Code Patterns

Because code runs on both server and browser, all browser API access is gated through `PlatformService`:

```typescript
// SSR-safe localStorage access
@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly platformId = inject(PLATFORM_ID);

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  runInBrowser(fn: () => void): void {
    if (this.isBrowser) { fn(); }
  }
}

// Usage in AuthService
getAccessToken(): string | null {
  if (!this.platform.isBrowser) return null;  // Return null on server
  return localStorage.getItem(TOKEN_KEY);
}
```

The `LazyImageDirective` also demonstrates SSR safety: on the server, it sets the image `src` directly (for crawlers); on the browser, it uses `IntersectionObserver` for lazy loading.

---

## State Management

The project uses **@ngrx/signals** (NgRx Signal Store) for state management, embracing Angular's signal-based reactivity model. There is no use of traditional NgRx Store/Effects/Reducers.

### Global State: AppStore

The `AppStore` is a root-level signal store that manages application-wide UI state:

```typescript
export const AppStore = signalStore(
  { providedIn: 'root' },              // Singleton, available everywhere
  withState<AppState>({                 // Initial state
    theme: 'light',
    sidebarOpen: false,
  }),
  withComputed(store => ({              // Derived state
    isDarkMode: computed(() => store.theme() === 'dark'),
  })),
  withMethods(store => ({               // State mutations
    toggleTheme(): void {
      patchState(store, state => ({
        theme: state.theme === 'light' ? 'dark' : 'light',
      }));
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

### Global State: LoadingService

The `LoadingService` uses raw Angular signals (not NgRx) to track the count of in-flight HTTP requests:

```typescript
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _activeRequests = signal(0);
  readonly isLoading = computed(() => this._activeRequests() > 0);

  start(): void { this._activeRequests.update(count => count + 1); }
  stop(): void { this._activeRequests.update(count => Math.max(0, count - 1)); }
}
```

This service is incremented/decremented by the `loadingInterceptor` and can be consumed by any component (e.g., showing a global loading bar).

### Feature-Level Stores (Pattern)

Each feature defines its own signal store. Feature stores are **not** `providedIn: 'root'`; they are provided at the feature route level to ensure proper lifecycle management and tree-shaking.

```typescript
// Pattern for a feature store
export const ProjectsStore = signalStore(
  withState<ProjectsState>({
    projects: [],
    selectedProject: null,
    isLoading: false,
    error: null,
  }),
  withComputed(store => ({
    projectCount: computed(() => store.projects().length),
    hasError: computed(() => store.error() !== null),
  })),
  withMethods((store, projectsService = inject(ProjectsService)) => ({
    loadProjects(): void {
      patchState(store, { isLoading: true });
      projectsService.getAll().subscribe({
        next: (projects) => patchState(store, { projects, isLoading: false }),
        error: (error) => patchState(store, { error: error.message, isLoading: false }),
      });
    },
  }))
);
```

### Signal Store API Reference

| Function        | Purpose                                        |
|-----------------|------------------------------------------------|
| `signalStore()` | Creates a new store with composable features   |
| `withState()`   | Declares the initial state shape               |
| `withComputed()`| Declares derived/computed signals              |
| `withMethods()` | Declares methods that mutate state             |
| `patchState()`  | Immutably patches a subset of the state        |

### Why Signal Store over Classic NgRx?

1. **Less boilerplate** -- No actions, reducers, effects, or selectors. State mutations are plain methods.
2. **Signal-native** -- State properties are Angular signals, which integrate directly with OnPush change detection without `async` pipes.
3. **Type-safe** -- Full TypeScript inference without generic parameter juggling.
4. **Composable** -- `withState`, `withComputed`, `withMethods` can be composed and reused as custom features.

---

## Interceptor Chain

HTTP interceptors are registered as functional interceptors in the application config and execute in registration order for requests and reverse order for responses.

```typescript
// app.config.ts
provideHttpClient(
  withFetch(),
  withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])
)
```

### Chain Execution Order

```
                         REQUEST FLOW
                         ============

  HttpClient.get()
       |
       v
  +-----------------------+
  | 1. authInterceptor    |  Attaches Bearer token from AuthService
  |    (auth.interceptor) |  if a token exists in localStorage
  +-----------+-----------+
              |
              v
  +-----------------------+
  | 2. errorInterceptor   |  Passes request through unchanged
  |    (error.interceptor)|  (acts only on responses)
  +-----------+-----------+
              |
              v
  +-----------------------+
  | 3. loadingInterceptor |  Calls LoadingService.start()
  |    (loading.interceptor)| to increment active request count
  +-----------+-----------+
              |
              v
       [ HTTP Request ]
              |
              v

                         RESPONSE FLOW
                         =============

       [ HTTP Response ]
              |
              v
  +-----------------------+
  | 3. loadingInterceptor |  Calls LoadingService.stop()
  |    (finalize)         |  on complete/error via finalize()
  +-----------+-----------+
              |
              v
  +-----------------------+
  | 2. errorInterceptor   |  Catches HttpErrorResponse:
  |    (catchError)       |  - Maps status codes to Arabic messages
  |                       |  - Normalizes error shape
  |                       |  - Logs to console
  +-----------+-----------+
              |
              v
  +-----------------------+
  | 1. authInterceptor    |  On 401 (not from /auth/refresh):
  |    (catchError)       |  - Calls AuthService.refreshToken()
  |                       |  - Retries original request with new token
  |                       |  - On refresh failure: calls logout()
  +-----------+-----------+
              |
              v
       Component receives
       Observable result
```

### Interceptor 1: `authInterceptor`

**Purpose:** Attach JWT access tokens to outgoing requests and handle token expiration.

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  // Clone request with Authorization header if token exists
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // On 401, attempt token refresh (but not for the refresh endpoint itself)
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        return auth.refreshToken().pipe(
          switchMap(response => {
            if (response?.success) {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${response.data.accessToken}` },
              });
              return next(retryReq);  // Retry with new token
            }
            auth.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
```

**Key behaviors:**
- Reads the access token from `AuthService.getAccessToken()` (which reads from `localStorage` via `PlatformService`, returning `null` on server)
- On 401 errors, automatically attempts a token refresh and retries the failed request
- Prevents infinite refresh loops by checking `!req.url.includes('/auth/refresh')`
- Falls back to `auth.logout()` if the refresh fails

### Interceptor 2: `errorInterceptor`

**Purpose:** Normalize HTTP errors into a consistent shape with user-friendly Arabic messages.

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'حدث خطأ غير متوقع';  // "An unexpected error occurred"

      switch (error.status) {
        case 0:   errorMessage = 'لا يمكن الاتصال بالخادم'; break;   // Cannot connect
        case 400: errorMessage = error.error?.error ?? 'طلب غير صالح'; break;  // Bad request
        case 403: errorMessage = 'غير مصرح لك بالوصول'; break;       // Forbidden
        case 404: errorMessage = 'المورد غير موجود'; break;          // Not found
        case 500: errorMessage = 'خطأ في الخادم الداخلي'; break;     // Server error
      }

      console.error(`[API Error] ${req.method} ${req.url}:`, errorMessage);

      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error,
      }));
    })
  );
};
```

**Key behaviors:**
- Maps HTTP status codes to localized Arabic error messages
- Preserves the original error for debugging
- Logs all API errors to the console with method and URL context
- For 400 errors, uses the server-provided error message if available

### Interceptor 3: `loadingInterceptor`

**Purpose:** Track in-flight HTTP requests to power global loading indicators.

```typescript
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.start();
  return next(req).pipe(
    finalize(() => loading.stop())
  );
};
```

**Key behaviors:**
- Increments `LoadingService._activeRequests` when a request starts
- Decrements on completion, error, or cancellation (via `finalize`)
- `LoadingService.isLoading` signal becomes `true` when any request is in flight
- Components can bind to `isLoading()` to show/hide loading indicators without any manual tracking

---

## Internationalization

The project uses **@jsverse/transloco** for internationalization with Arabic as the default language.

### Configuration

```typescript
provideTransloco({
  config: {
    availableLangs: ['ar', 'en'],
    defaultLang: environment.defaultLocale,  // 'ar'
    reRenderOnLangChange: true,
    fallbackLang: 'ar',
  },
  loader: TranslocoHttpLoader,  // Loads /assets/i18n/{lang}.json
})
```

### Locale Management & Path-Based Routing

The site uses **path-based locale routing** (`/ar/...`, `/en/...`). All routes are wrapped under a `:locale` parameter. The `localeGuard` validates the locale and calls `I18nService.initializeFromUrl()`.

The `I18nService` manages the active locale and synchronizes it across:
- The Transloco library (`setActiveLang`)
- The HTML document (`<html lang="ar" dir="rtl">`)
- Local storage persistence (`ahram-locale`)

Key methods:
- `initializeFromUrl(locale)` — Sets locale from URL (called by `localeGuard`)
- `switchLocaleUrl(currentUrl)` — Returns URL with locale swapped (`/ar/projects` → `/en/projects`)

The `LocalizeRoutePipe` (`localizeRoute`) prepends `/${locale}` to all `routerLink` values in templates.

Locale switching automatically updates the document direction (`rtl`/`ltr`), which propagates through Tailwind's logical property utilities (e.g., `ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`).

### Translation Files

- `src/assets/i18n/ar.json` -- Arabic translations (default, ~700+ keys)
- `src/assets/i18n/en.json` -- English translations (~700+ keys)

Translations use `{{param}}` interpolation syntax and are organized by feature namespace (`app`, `header`, `footer`, `home`, `projects`, `about`, `contact`, `gallery`, `blog`, `payment`, `updates`, `guide`, `investors`, `faq`, `newsletter`, `seo`, `common`, `validation`, `notFound`).

---

## Theming

The application supports light and dark themes using Tailwind CSS v4's CSS-first configuration.

### Theme Variables

Theme colors are defined as OKLCH values in `src/styles.css` using the `@theme` directive:

```css
@theme {
  --color-primary: oklch(0.35 0.08 250);
  --color-background: oklch(0.99 0 0);
  /* ... */
}

.dark {
  --color-primary: oklch(0.65 0.08 250);
  --color-background: oklch(0.12 0.02 250);
  /* ... */
}
```

### Theme Switching

The `AppStore.toggleTheme()` method toggles between `'light'` and `'dark'` in state. The `HeaderComponent` provides a theme toggle button. The `.dark` class is applied to the `<html>` element to activate dark mode CSS variables.

### Fonts

| Usage   | Font Family         | Fallback           |
|---------|---------------------|--------------------|
| Display | Cairo               | Inter, system-ui   |
| Body    | Cairo               | Inter, system-ui   |
| Mono    | JetBrains Mono      | Fira Code          |

Cairo is the primary font, chosen for its excellent Arabic and Latin character support.

---

## Deployment Architecture

### Docker Multi-Stage Build

```
+------------------+        +------------------+
| Stage 1: Build   |        | Stage 2: Prod    |
| node:20-alpine   |------->| node:20-alpine   |
|                  |        |                  |
| npm ci           |  COPY  | dist/ only       |
| ng build         |------->| prod deps only   |
| (SSR + Browser)  |        | non-root user    |
+------------------+        +------------------+
                                    |
                                    | Port 4000
                                    v
                            +------------------+
                            | Nginx            |
                            | (Reverse Proxy)  |
                            |                  |
                            | Gzip, Caching,   |
                            | Security Headers,|
                            | Rate Limiting    |
                            +------------------+
                                    |
                                    | Ports 80/443
                                    v
                              [ Internet ]
```

### Docker Compose Services

| Service | Image           | Port | Purpose                          |
|---------|-----------------|------|----------------------------------|
| `app`   | Custom (built)  | 4000 | Angular SSR Node.js server       |
| `nginx` | nginx:alpine    | 80, 443 | Reverse proxy, static caching, security |

### Nginx Features

- **Gzip compression** for text, CSS, JSON, JS, SVG, and XML
- **Static asset caching** with 1-year `Cache-Control: public, immutable`
- **Security headers**: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`
- **Rate limiting**: 10 requests/second per IP with burst allowance of 20
- **Upstream keepalive**: 32 persistent connections to the Node.js backend

---

## Path Aliases

Defined in `tsconfig.json` for clean imports:

| Alias          | Maps To                              | Usage                                |
|----------------|--------------------------------------|--------------------------------------|
| `@core/*`      | `src/app/core/*`                     | `import { ApiService } from '@core/services'` |
| `@shared/*`    | `src/app/shared/*`                   | `import { ButtonComponent } from '@shared/ui'` |
| `@features/*`  | `src/app/features/*`                 | `import { ProjectsStore } from '@features/projects/stores'` |
| `@env`         | `src/environments/environment`       | `import { environment } from '@env'` |

---

## Environment Configuration

Three environment configurations are available, switched via Angular CLI `--configuration` flag:

| Environment | File                          | API URL                                    | Production |
|-------------|-------------------------------|--------------------------------------------|------------|
| Development | `environment.ts`              | `http://localhost:3000/api`                | No         |
| Staging     | `environment.staging.ts`      | `https://staging-api.alahram-developments.com/api` | No         |
| Production  | `environment.prod.ts`         | `https://api.alahram-developments.com/api` | Yes        |

Build commands:
- `npm run build` -- Production build (default)
- `npm run build:staging` -- Staging build
- `npm run build:dev` -- Development build

All environments share the `Environment` interface:

```typescript
export interface Environment {
  production: boolean;
  apiUrl: string;
  appName: string;
  defaultLocale: 'ar' | 'en';
  supportedLocales: readonly string[];
}
```

The `production` flag controls Transloco's `prodMode` (disables missing key logging) and the `apiUrl` determines the base URL for all `ApiService` requests.
