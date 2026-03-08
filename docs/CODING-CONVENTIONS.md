# Coding Conventions

This document defines the coding conventions for the Al-Ahram Developments project. All contributors must follow these conventions to maintain a consistent, maintainable codebase.

---

## Table of Contents

1. [TypeScript Configuration](#typescript-configuration)
2. [Angular Conventions](#angular-conventions)
3. [File Naming and Organization](#file-naming-and-organization)
4. [Import Ordering](#import-ordering)
5. [Component Patterns](#component-patterns)
6. [Services and Dependency Injection](#services-and-dependency-injection)
7. [State Management](#state-management)
8. [Error Handling](#error-handling)
9. [Git Conventions](#git-conventions)
10. [Code Quality Tools](#code-quality-tools)

---

## TypeScript Configuration

The project uses TypeScript strict mode with additional strictness flags:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "isolatedModules": true,
    "target": "ES2022",
    "module": "preserve"
  },
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true
  }
}
```

### What This Means in Practice

| Flag | Enforcement |
|------|-------------|
| `strict: true` | Enables `strictNullChecks`, `strictFunctionTypes`, `noImplicitAny`, etc. |
| `noImplicitOverride` | Must use `override` keyword when overriding a base class method |
| `noPropertyAccessFromIndexSignature` | Must use bracket notation for index signature access |
| `noImplicitReturns` | Every code path in a function must return a value |
| `noFallthroughCasesInSwitch` | Every `case` must end with `break`, `return`, or `throw` |
| `noUnusedLocals` | No unused local variables allowed |
| `noUnusedParameters` | No unused function parameters (prefix with `_` if intentionally unused) |
| `strictTemplates` | Full type checking in Angular templates |

### Path Aliases

```json
{
  "paths": {
    "@core/*": ["src/app/core/*"],
    "@shared/*": ["src/app/shared/*"],
    "@features/*": ["src/app/features/*"],
    "@env": ["src/environments/environment"]
  }
}
```

Usage:

```typescript
// Good: use path aliases
import { ApiService } from '@core/services/api.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { environment } from '@env';

// Avoid: relative paths across feature boundaries
import { ApiService } from '../../../core/services/api.service';
```

Use relative paths only within the same feature or module.

---

## Angular Conventions

### Standalone Components

All components, directives, and pipes must be standalone. The project does not use `NgModule`.

```typescript
// angular.json schematic defaults enforce this:
"@schematics/angular:component": {
  "standalone": true,
  "changeDetection": "OnPush",
  "skipTests": true,
  "prefix": "ahram",
  "style": "scss"
}
```

### Component Selector Prefix

All components and directives use the `ahram` prefix:

```typescript
// Components
@Component({ selector: 'ahram-button' })
@Component({ selector: 'ahram-project-card' })
@Component({ selector: 'ahram-header' })

// Directives
@Directive({ selector: '[ahramClickOutside]' })
@Directive({ selector: 'img[ahramLazyImage]' })
```

### Change Detection

All components use `OnPush` change detection:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

This means components only re-render when:
- An `input()` signal changes.
- A signal read in the template changes.
- An event handler fires within the component.
- `markForCheck()` is called (avoid this; prefer signals).

### Signals

Use Angular Signals for all reactive state:

```typescript
// Component inputs
readonly title = input<string>();              // Optional input
readonly items = input.required<Item[]>();      // Required input
readonly size = input<'sm' | 'md' | 'lg'>('md');  // Input with default

// Component outputs
readonly clicked = output<void>();
readonly selected = output<Item>();

// Two-way binding
readonly value = model<string>('');

// Internal state
private readonly _count = signal(0);
readonly count = this._count.asReadonly();

// Computed values
readonly isEnabled = computed(() => this._count() > 0);
```

### inject() Function

Use the `inject()` function instead of constructor injection:

```typescript
// Good: inject() function
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly platform = inject(PlatformService);
}

// Avoid: constructor injection
export class ProjectService {
  constructor(
    private readonly http: HttpClient,
    private readonly api: ApiService,
  ) {}
}
```

Exceptions: class-based components that require `constructor` for `afterNextRender()` or `effect()` can still use `inject()` in the constructor body.

### input(), output(), model()

Use the signal-based input/output API:

```typescript
// Good: signal-based API
readonly variant = input<ButtonVariant>('primary');
readonly disabled = input(false);
readonly items = input.required<Item[]>();
readonly clicked = output<void>();
readonly valueChange = output<string>();
readonly value = model<string>('');

// Avoid: decorator-based API
@Input() variant: ButtonVariant = 'primary';
@Input({ required: true }) items!: Item[];
@Output() clicked = new EventEmitter<void>();
```

### Template Syntax

Use the modern control flow syntax:

```html
<!-- Good: @if / @else -->
@if (isLoading()) {
  <ahram-loading-spinner />
} @else if (error()) {
  <p class="text-destructive">{{ error() }}</p>
} @else {
  <div>Content</div>
}

<!-- Good: @for with track -->
@for (project of projects(); track project.id) {
  <ahram-project-card [project]="project" />
} @empty {
  <p>No projects found</p>
}

<!-- Good: @switch -->
@switch (status()) {
  @case ('pending') {
    <span class="text-amber-500">Pending</span>
  }
  @case ('active') {
    <span class="text-green-500">Active</span>
  }
  @default {
    <span class="text-muted-foreground">Unknown</span>
  }
}

<!-- Avoid: *ngIf, *ngFor, [ngSwitch] -->
```

### Component File Convention

Components use separate `.ts`, `.html`, and `.scss` files:

```
button/
  button.component.ts       # Component class
  button.component.html     # Template
  button.component.scss     # Styles (host display, animations, CSS custom properties)
```

```typescript
@Component({
  selector: 'ahram-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
```

- **Templates** use Tailwind classes directly — most styling goes in the `.html` file.
- **SCSS files** are for `:host` display, keyframe animations, and CSS custom properties that Tailwind cannot express. Keep them minimal.
- The `angular.json` schematics default is `"style": "scss"`.

---

## File Naming and Organization

### File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Component (class) | `kebab-case.component.ts` | `project-card.component.ts` |
| Component (template) | `kebab-case.component.html` | `project-card.component.html` |
| Component (styles) | `kebab-case.component.scss` | `project-card.component.scss` |
| Service | `kebab-case.service.ts` | `api.service.ts` |
| Guard | `kebab-case.guard.ts` | `auth.guard.ts` |
| Interceptor | `kebab-case.interceptor.ts` | `error.interceptor.ts` |
| Pipe | `kebab-case.pipe.ts` | `translate-number.pipe.ts` |
| Directive | `kebab-case.directive.ts` | `click-outside.directive.ts` |
| Model/Interface | `kebab-case.model.ts` | `api-response.model.ts` |
| Store | `kebab-case.store.ts` | `app.store.ts` |
| Helper | `kebab-case.helper.ts` | `storage.helper.ts` |
| Validator | `kebab-case.ts` (in validators/) | `custom-validators.ts` |
| Route config | `kebab-case.routes.ts` | `projects.routes.ts` |
| Barrel export | `index.ts` | `index.ts` |

### Directory Structure

```
src/app/
  core/                    # Singleton services, layout, guards, interceptors
    guards/
      auth.guard.ts
      role.guard.ts
      index.ts             # Barrel export
    interceptors/
      auth.interceptor.ts
      error.interceptor.ts
      loading.interceptor.ts
      index.ts
    layout/
      header/
        header.component.ts
        header.component.html
        header.component.scss
      footer/
        footer.component.ts
        footer.component.html
        footer.component.scss
      not-found/
        not-found.component.ts
        not-found.component.html
        not-found.component.scss
    models/
      api-response.model.ts
      user.model.ts
      environment.model.ts
      index.ts
    services/
      api.service.ts
      auth.service.ts
      i18n.service.ts
      platform.service.ts
      seo.service.ts
      transloco-config.ts
      transloco-loader.ts
      index.ts
    state/
      app.store.ts
      loading.service.ts
      index.ts

  shared/                  # Reusable components, pipes, directives
    ui/
      button/
        button.component.ts
        button.component.html
        button.component.scss
      card/
        card.component.ts
        card.component.html
        card.component.scss
      input/
        input.component.ts
        input.component.html
        input.component.scss
      loading-spinner/
        loading-spinner.component.ts
        loading-spinner.component.html
        loading-spinner.component.scss
      whatsapp-button/
        whatsapp-button.component.ts
        whatsapp-button.component.html
        whatsapp-button.component.scss
      index.ts
    pipes/
      translate-number.pipe.ts
      relative-time.pipe.ts
      index.ts
    directives/
      click-outside.directive.ts
      lazy-image.directive.ts
      index.ts
    helpers/
      storage.helper.ts
      seo.helper.ts
      index.ts
    validators/
      custom-validators.ts
      index.ts

  features/                # Lazy-loaded feature modules
    projects/
      pages/
        project-list/
          project-list.component.ts
          project-list.component.html
          project-list.component.scss
        project-detail/
          project-detail.component.ts
          project-detail.component.html
          project-detail.component.scss
      components/
        project-card/
          project-card.component.ts
          project-card.component.html
          project-card.component.scss
        project-filter/
          project-filter.component.ts
          project-filter.component.html
          project-filter.component.scss
      state/
        projects.store.ts
      services/
        project.service.ts
      models/
        project.model.ts
      projects.routes.ts
```

### Barrel Exports

Each directory that contains multiple related exports should have an `index.ts` barrel file:

```typescript
// src/app/core/services/index.ts
export { ApiService } from './api.service';
export { AuthService } from './auth.service';
export { I18nService, type AppLocale, type AppDirection } from './i18n.service';
export { PlatformService } from './platform.service';
export { SeoService, type SeoData } from './seo.service';
```

Import from the barrel:

```typescript
import { ApiService, AuthService, PlatformService } from '@core/services';
```

---

## Import Ordering

Organize imports in this order, with a blank line between each group:

1. Angular framework (`@angular/*`)
2. Third-party libraries (`@ngrx/*`, `@jsverse/*`, `rxjs`, etc.)
3. Project aliases (`@core/*`, `@shared/*`, `@features/*`, `@env`)
4. Relative imports (`./`, `../`)

```typescript
// 1. Angular
import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

// 2. Third-party
import { TranslocoDirective } from '@jsverse/transloco';
import { Observable } from 'rxjs';

// 3. Project aliases
import { ApiService, AuthService } from '@core/services';
import { ButtonComponent, CardComponent } from '@shared/ui';

// 4. Relative
import { ProjectCardComponent } from './components/project-card/project-card.component';
import { Project } from './models/project.model';
```

---

## Component Patterns

### Complete Component Example

**`project-card.component.ts`**
```typescript
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'ahram-project-card',
  standalone: true,
  imports: [NgClass, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
})
export class ProjectCardComponent {
  // Inputs
  readonly project = input.required<Project>();
  readonly featured = input(false);

  // Outputs
  readonly selected = output<Project>();

  // Computed
  protected readonly statusClasses = computed(() => {
    const base = 'rounded-full px-2 py-0.5 text-xs font-medium';
    switch (this.project().status) {
      case 'upcoming':
        return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300`;
      case 'in-progress':
        return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300`;
      case 'completed':
        return `${base} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`;
      default:
        return `${base} bg-muted text-muted-foreground`;
    }
  });
}
```

### Conventions Checklist for Components

- [ ] `standalone: true`
- [ ] `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] Selector uses `ahram-` prefix
- [ ] Separate `.ts` / `.html` / `.scss` files with `templateUrl` / `styleUrl`
- [ ] Inputs use `input()` / `input.required()`
- [ ] Outputs use `output()`
- [ ] Dependencies use `inject()`
- [ ] Template uses `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)
- [ ] Styling via Tailwind classes in template; SCSS only for `:host`, animations, CSS vars
- [ ] Logical properties for RTL support (`ps-`, `me-`, `start-`, `end-`)
- [ ] Translated strings use Transloco (`*transloco` or pipe)
- [ ] Protected/readonly for template-bound properties

---

## Services and Dependency Injection

### Service Pattern

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly api = inject(ApiService);

  // State as private signals, exposed as readonly
  private readonly _projects = signal<Project[]>([]);
  private readonly _isLoading = signal(false);

  readonly projects = this._projects.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly projectCount = computed(() => this._projects().length);
}
```

### Providability

| Scope | When |
|-------|------|
| `providedIn: 'root'` | Global singleton services (API, auth, i18n, platform) |
| Route-level provider | Feature services shared across a route tree |
| Component-level provider | Per-instance services, feature stores |

---

## State Management

### Signal State (Local)

```typescript
// Simple local state in a component
readonly isOpen = signal(false);
readonly selectedTab = signal<'info' | 'gallery'>('info');
```

### Signal Store (Shared)

```typescript
// Feature-level state
export const ProjectsStore = signalStore(
  withState(initialState),
  withComputed(store => ({ /* derived values */ })),
  withMethods(store => ({ /* mutations and effects */ })),
);
```

See `docs/STATE-MANAGEMENT.md` for detailed patterns.

---

## Error Handling

### HTTP Errors

The `errorInterceptor` catches all HTTP errors and normalizes them:

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'حدث خطأ غير متوقع';
      // Map status codes to messages
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error,
      }));
    })
  );
};
```

### Component-Level Error Handling

```typescript
@Component({
  template: `
    @if (error()) {
      <div class="rounded-md border border-destructive bg-destructive/10 p-4">
        <p class="text-sm text-destructive">{{ error() }}</p>
        <ahram-button variant="outline" size="sm" (clicked)="retry()">
          {{ 'common.retry' | transloco }}
        </ahram-button>
      </div>
    }
  `,
})
export class SomeComponent {
  readonly error = signal<string | null>(null);

  loadData(): void {
    this.api.get<Data>('/endpoint').subscribe({
      next: response => { /* handle success */ },
      error: err => this.error.set(err.message),
    });
  }

  retry(): void {
    this.error.set(null);
    this.loadData();
  }
}
```

### Async Errors in Stores

```typescript
withMethods((store, api = inject(ApiService)) => ({
  loadData: rxMethod<void>(
    pipe(
      tap(() => patchState(store, { isLoading: true, error: null })),
      switchMap(() =>
        api.get<Data>('/endpoint').pipe(
          tapResponse({
            next: response => patchState(store, { data: response.data, isLoading: false }),
            error: (err: { message: string }) => patchState(store, { error: err.message, isLoading: false }),
          })
        )
      )
    )
  ),
}))
```

---

## Git Conventions

### Commit Messages

Use Conventional Commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance tasks (deps, config, build) |
| `docs` | Documentation changes |
| `style` | Code style (formatting, semicolons, no logic change) |
| `refactor` | Code refactor (no feature or fix) |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `ci` | CI/CD changes |
| `revert` | Reverting a previous commit |

#### Scope (optional)

Use the feature or area affected:

```
feat(projects): add project detail page with gallery
fix(i18n): correct Arabic translation for validation messages
chore(deps): update @angular/core to 21.3.0
docs(ssr): add SSR troubleshooting section
style(header): fix inconsistent button spacing
refactor(auth): extract token management to separate service
perf(images): implement lazy loading with IntersectionObserver
```

#### Description Rules

- Use imperative mood ("add", "fix", "update", not "added", "fixes", "updated").
- Start with lowercase.
- No period at the end.
- Keep under 72 characters.

#### Examples

```
feat(projects): add project listing page with filter and pagination
fix(auth): prevent double token refresh on concurrent 401 responses
chore(deps): update tailwindcss to 4.3.0
docs(api): document new project endpoints
refactor(i18n): replace manual locale management with I18nService
perf(ssr): defer gallery component to reduce initial render time
```

### Branch Naming

```
<type>/<short-description>
```

| Type | Example |
|------|---------|
| `feature/` | `feature/project-listing-page` |
| `fix/` | `fix/rtl-sidebar-alignment` |
| `chore/` | `chore/update-angular-21.3` |
| `docs/` | `docs/add-api-patterns-guide` |
| `refactor/` | `refactor/auth-service-signals` |

Rules:
- Use lowercase.
- Use hyphens to separate words.
- Keep it short but descriptive.
- Branch from `main`.

### Pull Request Guidelines

- PR title follows the same format as commit messages.
- PR description includes a summary of changes and a test plan.
- Each PR should address a single concern (feature, fix, or refactor).
- Rebase on `main` before merging. No merge commits.

---

## Code Quality Tools

### ESLint

```bash
npm run lint        # Check for lint errors
npm run lint:fix    # Auto-fix lint errors
```

ESLint is configured with `@angular-eslint` for Angular-specific rules and `@typescript-eslint` for TypeScript rules.

### Prettier

```bash
npm run format        # Format all files
npm run format:check  # Check formatting without changing files
```

Prettier handles code formatting. ESLint handles code quality. They do not overlap.

### Recommended Workflow

1. Write code following these conventions.
2. Run `npm run lint:fix` to auto-fix lint issues.
3. Run `npm run format` to format code.
4. Verify no errors with `npm run lint` and `npm run format:check`.
5. Commit with a conventional commit message.
