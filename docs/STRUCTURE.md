# Al-Ahram Developments - Project Structure

> Angular 21 SSR application with Tailwind CSS v4, NgRx Signal Store, and Transloco i18n.
> Component prefix: `ahram-` | Default locale: Arabic (RTL) | SSR via `@angular/ssr`

---

## 1. Full Annotated Folder Tree

```
alahram-developments/
├── docs/                                 # Project documentation
│   └── STRUCTURE.md                      # This file — project structure reference
├── public/                               # Static assets served at root (not fingerprinted)
│   └── favicon.ico                       # Browser favicon
├── src/                                  # Application source code
│   ├── app/                              # Angular application root
│   │   ├── core/                         # Singleton services, guards, interceptors, state, layout
│   │   │   ├── guards/                   # Route guards (functional CanActivateFn)
│   │   │   │   ├── auth.guard.ts         # authGuard (requires login) + guestGuard (requires no login)
│   │   │   │   ├── locale.guard.ts       # localeGuard — validates :locale param, sets I18nService
│   │   │   │   ├── role.guard.ts         # roleGuard(...roles) — restricts by UserRole
│   │   │   │   └── index.ts             # Barrel export for all guards
│   │   │   ├── interceptors/             # HTTP interceptors (functional HttpInterceptorFn)
│   │   │   │   ├── auth.interceptor.ts   # Attaches Bearer token, auto-refreshes on 401
│   │   │   │   ├── error.interceptor.ts  # Normalizes HTTP errors with Arabic messages
│   │   │   │   ├── loading.interceptor.ts# Increments/decrements LoadingService counter
│   │   │   │   └── index.ts             # Barrel export for all interceptors
│   │   │   ├── layout/                   # App-shell layout components
│   │   │   │   ├── header/               # Sticky header: logo, 5 nav links, mobile menu, lang/theme toggle
│   │   │   │   │   ├── header.component.ts
│   │   │   │   │   ├── header.component.html
│   │   │   │   │   └── header.component.scss
│   │   │   │   ├── footer/               # 4-column footer: company, links, resources, contact + social
│   │   │   │   │   ├── footer.component.ts
│   │   │   │   │   ├── footer.component.html
│   │   │   │   │   └── footer.component.scss
│   │   │   │   └── not-found/            # 404 page with "back to home" link
│   │   │   │       └── not-found.component.ts
│   │   │   ├── models/                   # TypeScript interfaces and types
│   │   │   │   ├── api-response.model.ts # ApiResponse<T>, PaginatedResponse<T>, ApiError
│   │   │   │   ├── user.model.ts         # User, UserRole, AuthTokens, LoginRequest, LoginResponse
│   │   │   │   ├── environment.model.ts  # Environment interface for env config typing
│   │   │   │   └── index.ts             # Barrel export for all models
│   │   │   ├── services/                 # Application-wide singleton services
│   │   │   │   ├── api.service.ts        # Generic HTTP wrapper (get, post, put, patch, delete)
│   │   │   │   ├── auth.service.ts       # Login, logout, token refresh, signal-based auth state
│   │   │   │   ├── i18n.service.ts       # Locale management (ar/en), RTL detection, doc dir/lang
│   │   │   │   ├── seo.service.ts        # Meta tags, OG tags, canonical URL, title management
│   │   │   │   ├── platform.service.ts   # SSR-safe browser/server detection, runInBrowser()
│   │   │   │   ├── transloco-config.ts   # Transloco provider factory (provideTranslocoConfig)
│   │   │   │   ├── transloco-loader.ts   # TranslocoHttpLoader — loads /assets/i18n/{lang}.json
│   │   │   │   └── index.ts             # Barrel export for all services
│   │   │   └── state/                    # Global state management
│   │   │       ├── app.store.ts          # NgRx Signal Store — theme (light/dark), sidebar state
│   │   │       ├── loading.service.ts    # Signal-based loading counter for HTTP requests
│   │   │       └── index.ts             # Barrel export for state
│   │   ├── shared/                       # Reusable components, pipes, directives, helpers
│   │   │   ├── ui/                       # Shared UI components (design system primitives)
│   │   │   │   ├── button/               # <ahram-button> — variant, size, loading, disabled
│   │   │   │   │   └── button.component.ts
│   │   │   │   ├── card/                 # <ahram-card> — title, description, content projection
│   │   │   │   │   └── card.component.ts
│   │   │   │   ├── input/                # <ahram-input> — label, validation error, types
│   │   │   │   │   └── input.component.ts
│   │   │   │   ├── loading-spinner/      # <ahram-loading-spinner> — sm/md/lg, fullScreen mode
│   │   │   │   │   └── loading-spinner.component.ts
│   │   │   │   ├── whatsapp-button/     # <ahram-whatsapp-button> — floating WhatsApp FAB
│   │   │   │   │   ├── whatsapp-button.component.ts
│   │   │   │   │   ├── whatsapp-button.component.html
│   │   │   │   │   └── whatsapp-button.component.scss
│   │   │   │   └── index.ts             # Barrel export for all UI components
│   │   │   ├── pipes/                    # Reusable transform pipes
│   │   │   │   ├── localize-route.pipe.ts    # Prepends /:locale to routerLink values
│   │   │   │   ├── translate-number.pipe.ts  # Locale-aware number/currency/percent formatting
│   │   │   │   ├── relative-time.pipe.ts     # "3 hours ago" via Intl.RelativeTimeFormat
│   │   │   │   └── index.ts             # Barrel export for all pipes
│   │   │   ├── directives/               # Reusable attribute directives
│   │   │   │   ├── click-outside.directive.ts # [ahramClickOutside] — emits on outside click
│   │   │   │   ├── lazy-image.directive.ts    # [ahramLazyImage] — IntersectionObserver lazy load
│   │   │   │   └── index.ts             # Barrel export for all directives
│   │   │   ├── helpers/                  # Pure utility functions and helper classes
│   │   │   │   ├── storage.helper.ts     # SSR-safe localStorage wrapper (get/set/remove JSON)
│   │   │   │   ├── seo.helper.ts         # JSON-LD structured data (createJsonLd, buildOrganizationSchema)
│   │   │   │   └── index.ts             # Barrel export for all helpers
│   │   │   └── validators/               # Custom Angular form validators
│   │   │       ├── custom-validators.ts  # Egyptian phone, national ID, matchField, minAge, noWhitespace
│   │   │       └── index.ts             # Barrel export for validators
│   │   ├── features/                     # Feature modules (lazy-loaded bounded contexts)
│   │   │   └── .gitkeep                  # Placeholder — features added as project grows
│   │   ├── app.component.ts              # Root component — header + router-outlet + footer + WhatsApp FAB
│   │   ├── app.component.html            # Root template
│   │   ├── app.component.scss            # Root host styles
│   │   ├── app.config.ts                 # Browser app config — router, hydration, HTTP, Transloco
│   │   ├── app.config.server.ts          # SSR app config — merges browser config + server rendering
│   │   ├── app.routes.ts                 # Client-side route definitions
│   │   └── app.routes.server.ts          # Server route config — RenderMode.Server for all paths
│   ├── assets/                           # Fingerprinted static assets (copied to /assets/ in dist)
│   │   ├── i18n/                         # Translation files
│   │   │   ├── ar.json                   # Arabic translations
│   │   │   └── en.json                   # English translations
│   │   └── images/                       # Image assets
│   │       └── .gitkeep                  # Placeholder for future images
│   ├── environments/                     # Build-time environment configurations
│   │   ├── environment.ts                # Development (default) — localhost:3000
│   │   ├── environment.staging.ts        # Staging — staging-api.alahram-developments.com
│   │   └── environment.prod.ts           # Production — api.alahram-developments.com
│   ├── index.html                        # HTML shell (single entry point)
│   ├── main.ts                           # Browser bootstrap entry point
│   ├── main.server.ts                    # Server bootstrap entry point (SSR)
│   ├── server.ts                         # Express SSR server (serves static + Angular SSR)
│   └── styles.css                        # Global styles — Tailwind v4 theme, dark mode, base
├── angular.json                          # Angular CLI workspace configuration
├── docker-compose.yml                    # Docker Compose — app (Node SSR) + nginx (reverse proxy)
├── Dockerfile                            # Multi-stage build — build + production (node:20-alpine)
├── nginx.conf                            # Nginx reverse proxy — gzip, security headers, rate limit
├── package.json                          # Dependencies and npm scripts
├── package-lock.json                     # Dependency lock file
├── .postcssrc.json                       # PostCSS config (Tailwind v4 plugin) — MUST be JSON format
├── tsconfig.json                         # Root TypeScript config — path aliases, strict mode
├── tsconfig.app.json                     # App-specific TypeScript config
├── tsconfig.spec.json                    # Test-specific TypeScript config
└── README.md                             # Project README
```

---

## 2. Purpose of Every Folder

### `src/app/core/` -- Singleton Services, Guards, Interceptors, State, Layout

The `core/` folder contains everything that should be instantiated **exactly once** in the application. These are singleton services provided in root, functional guards, HTTP interceptors, the global NgRx Signal Store, and the app-shell layout components (header, footer, 404 page). Nothing in `core/` should be imported by other `core/` siblings at the same level unless absolutely necessary (e.g., guards using services).

---

#### `src/app/core/services/` -- API, Auth, SEO, Platform Detection, i18n, Transloco Config

| File | Purpose |
|------|---------|
| `api.service.ts` | Generic HTTP client wrapping Angular `HttpClient`. Provides typed `get<T>`, `getPaginated<T>`, `post<T>`, `put<T>`, `patch<T>`, `delete<T>` methods. Prepends `environment.apiUrl` to all requests. All feature services should use this instead of `HttpClient` directly. |
| `auth.service.ts` | Handles login, logout, and JWT token refresh. Stores access/refresh tokens in localStorage (SSR-safe via `PlatformService`). Exposes signal-based reactive state: `user()`, `isAuthenticated()`, `isLoading()`. |
| `i18n.service.ts` | Manages locale switching (Arabic/English). Sets `<html>` `lang` and `dir` attributes. Persists locale choice to localStorage. Provides `locale()`, `direction()`, and `isRtl()` computed signals. Coordinates with Transloco for translation loading. |
| `seo.service.ts` | Server-side rendering friendly SEO management. Updates `<title>`, meta description, keywords, Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`), robots, and canonical URL. Default title: "Al-Ahram Developments". |
| `platform.service.ts` | SSR-safe platform detection. Exposes `isBrowser` and `isServer` getters, plus `runInBrowser(fn)` for safely executing browser-only code. Used by auth, i18n, storage, and directives to avoid SSR errors. |
| `transloco-config.ts` | Factory function `provideTranslocoConfig()` that configures the Transloco translation library. Sets available languages (`ar`, `en`), default language from environment, fallback to Arabic, and re-render on language change. |
| `transloco-loader.ts` | `TranslocoHttpLoader` class implementing `TranslocoLoader`. Fetches translation JSON files from `/assets/i18n/{lang}.json` via `HttpClient`. |

---

#### `src/app/core/guards/` -- Auth Guard, Guest Guard, Role Guard, Locale Guard

| File | Purpose |
|------|---------|
| `auth.guard.ts` | Exports two functional guards: **`authGuard`** redirects unauthenticated users to `/login`; **`guestGuard`** redirects authenticated users to `/` (prevents logged-in users from visiting login page). Both use `AuthService.isAuthenticated()` signal. |
| `locale.guard.ts` | Exports **`localeGuard`** (`CanActivateFn`). Validates the `:locale` route parameter is `'ar'` or `'en'`. If valid, calls `I18nService.initializeFromUrl(locale)` and returns `true`. If invalid, redirects to `/ar`. Applied to all `:locale`-prefixed routes. |
| `role.guard.ts` | Exports **`roleGuard(...allowedRoles)`** factory function. Returns a `CanActivateFn` that checks the current user's role against the allowed roles list. Redirects unauthorized users to `/`. Accepts `UserRole` values: `'admin'`, `'editor'`, `'viewer'`. |

---

#### `src/app/core/interceptors/` -- Auth, Error, Loading Interceptors

| File | Purpose |
|------|---------|
| `auth.interceptor.ts` | Attaches `Authorization: Bearer <token>` header to every outgoing request. On 401 responses (except refresh endpoint), automatically calls `auth.refreshToken()` and retries the failed request with the new token. Logs user out if refresh fails. |
| `error.interceptor.ts` | Catches `HttpErrorResponse` and normalizes error messages. Maps HTTP status codes (0, 400, 403, 404, 500) to Arabic error messages. Logs errors to console. Re-throws a structured error object with `status`, `message`, and `originalError`. |
| `loading.interceptor.ts` | Calls `LoadingService.start()` when a request begins and `LoadingService.stop()` when it completes (via `finalize`). Enables global loading indicator without per-request boilerplate. |

**Registration order** in `app.config.ts`: `authInterceptor` -> `errorInterceptor` -> `loadingInterceptor`

---

#### `src/app/core/state/` -- NgRx Signal Store (AppStore), LoadingService

| File | Purpose |
|------|---------|
| `app.store.ts` | Global application state using **NgRx Signal Store**. Manages `theme` (`'light'` or `'dark'`) and `sidebarOpen` (boolean). Provides computed `isDarkMode()` signal. Methods: `toggleTheme()`, `setTheme()`, `toggleSidebar()`, `setSidebar()`. Provided in root. |
| `loading.service.ts` | Signal-based loading counter. Tracks concurrent HTTP requests via `_activeRequests` signal. Exposes `isLoading` computed signal (true when any request is in-flight). Used by the loading interceptor and can be consumed by UI components for global spinners. |

---

#### `src/app/core/layout/` -- Header, Footer, Not-Found Components

| Component | Selector | Purpose |
|-----------|----------|---------|
| `HeaderComponent` | `<ahram-header>` | Sticky header with logo image, 5 desktop nav links (home, projects, about, gallery, contact CTA), language/theme toggles, mobile hamburger menu with full-screen overlay. Uses `I18nService`, `AppStore`, `ClickOutsideDirective`, `routerLinkActive`. |
| `FooterComponent` | `<ahram-footer>` | 4-column responsive footer (1→2→4 columns): company info + social links, quick links, resources, contact info with icons. Dark brown `bg-secondary` background. Bottom bar with copyright. |
| `NotFoundComponent` | `<ahram-not-found>` | 404 error page with large "404" heading, descriptive text, and "back to home" link. Used as the wildcard route and temporary home page. |

---

#### `src/app/shared/ui/` -- Button, Card, Input, Loading Spinner Components

Reusable UI primitives that form the project's design system. All use `OnPush` change detection, standalone architecture, and signal-based inputs/outputs.

| Component | Selector | Key Inputs | Notes |
|-----------|----------|------------|-------|
| `ButtonComponent` | `<ahram-button>` | `variant` (primary/secondary/outline/ghost/destructive), `size` (sm/md/lg/icon), `loading`, `disabled`, `type` | Shows spinner when loading. Emits `clicked` output. Tailwind-based variant classes. |
| `CardComponent` | `<ahram-card>` | `title`, `description`, `className` | Content projection via `<ng-content>`. Optional header with title and description. |
| `InputComponent` | `<ahram-input>` | `inputId`, `type`, `label`, `placeholder`, `disabled`, `required`, `error`, `value` | Shows validation error below input. Emits `valueChange` and `blurred` outputs. Red border on error state. |
| `LoadingSpinnerComponent` | `<ahram-loading-spinner>` | `size` (sm/md/lg), `fullScreen` | Animated SVG spinner. Full-screen mode takes `min-h-screen`. |
| `WhatsappButtonComponent` | `<ahram-whatsapp-button>` | — | Fixed-position floating WhatsApp button. Opens `wa.me` with pre-filled Arabic message. Bounce-in animation. RTL-aware positioning (`end-6`). Rendered via `@defer` in `AppComponent`. |

---

#### `src/app/shared/pipes/` -- LocalizeRoute, Translate Number, Relative Time Pipes

| Pipe | Usage | Purpose |
|------|-------|---------|
| `LocalizeRoutePipe` | `'\| localizeRoute'` on routerLink | Prepends `/${locale}` to routerLink values. Accepts `string` or `string[]`. `pure: false` (depends on `I18nService.locale()` signal). E.g., `'/projects' \| localizeRoute` → `['/', 'ar', 'projects']`. Must be imported in every component that has navigation links. |
| `TranslateNumberPipe` | `{{ value \| translateNumber:'currency' }}` | Locale-aware number formatting using `Intl.NumberFormat`. Supports `'decimal'` (default), `'currency'` (EGP), and `'percent'` formats. Switches between `ar-EG` and `en-US` based on current locale. |
| `RelativeTimePipe` | `{{ date \| relativeTime }}` | Displays relative time ("3 hours ago", "yesterday") using `Intl.RelativeTimeFormat`. Falls back to full date format for dates older than 30 days. Locale-aware (ar-EG/en-US). |

---

#### `src/app/shared/directives/` -- Click Outside, Lazy Image Directives

| Directive | Selector | Purpose |
|-----------|----------|---------|
| `ClickOutsideDirective` | `[ahramClickOutside]` | Emits an event when user clicks outside the host element. Useful for closing dropdowns, modals, and popovers. SSR-safe (no-op on server). |
| `LazyImageDirective` | `img[ahramLazyImage]` | Lazy-loads images using `IntersectionObserver`. Shows a placeholder image until the element enters the viewport. Falls back to eager loading if `IntersectionObserver` is unavailable. SSR-safe (sets src directly on server). |

---

#### `src/app/shared/helpers/` -- Storage Helper (SSR-Safe), SEO Helper

| Helper | Purpose |
|--------|---------|
| `StorageHelper` | SSR-safe `localStorage` wrapper. Methods: `getItem`, `setItem`, `removeItem`, `getJson<T>`, `setJson<T>`. All operations are wrapped in try/catch and guarded by `PlatformService.isBrowser`. |
| `seo.helper.ts` | Functions for structured data: `createJsonLd(data)` injects a `<script type="application/ld+json">` tag into `<head>`; `buildOrganizationSchema()` returns a Schema.org `RealEstateAgent` object for Al-Ahram Developments. |

---

#### `src/app/shared/validators/` -- Egyptian Phone, National ID, Custom Validators

| Validator | Pattern/Logic | Error Key |
|-----------|---------------|-----------|
| `egyptianPhone` | `/^(\+20\|0)?1[0125]\d{8}$/` | `{ egyptianPhone: true }` |
| `egyptianNationalId` | `/^\d{14}$/` | `{ egyptianNationalId: true }` |
| `matchField(fieldName)` | Compares value to sibling form control | `{ mismatch: true }` |
| `minAge(years)` | Calculates age from date value | `{ minAge: { required, actual } }` |
| `noWhitespace` | Rejects whitespace-only strings | `{ whitespace: true }` |

All validators are static methods on the `CustomValidators` class and work with Angular Reactive Forms.

---

#### `src/app/features/` -- Feature Modules (Empty, Added Later)

Currently contains only `.gitkeep`. This is where bounded-context feature modules will be added as the project grows. Each feature should be a self-contained lazy-loaded module with its own routes, components, services, and state.

---

#### `src/environments/` -- Dev, Staging, Prod Configs

All environment files implement the `Environment` interface.

| File | `production` | `apiUrl` |
|------|-------------|----------|
| `environment.ts` (dev) | `false` | `http://localhost:3000/api` |
| `environment.staging.ts` | `false` | `https://staging-api.alahram-developments.com/api` |
| `environment.prod.ts` | `true` | `https://api.alahram-developments.com/api` |

All share: `appName: 'Al-Ahram Developments'`, `defaultLocale: 'ar'`, `supportedLocales: ['ar', 'en']`.

File replacement is configured in `angular.json` under `build.configurations.production` and `build.configurations.staging`.

---

#### `src/assets/i18n/` -- ar.json, en.json Translations

Translation JSON files loaded by `TranslocoHttpLoader` at runtime. Keys are namespaced (e.g., `app.name`, `header.toggleTheme`, `footer.rights`, `notFound.title`). Arabic is the primary/fallback language.

---

## 3. Naming Conventions

| Artifact | File Suffix | Class/Function Suffix | Example |
|----------|-------------|----------------------|---------|
| Component | `.component.ts` | `Component` | `header.component.ts` -> `HeaderComponent` |
| Service | `.service.ts` | `Service` | `auth.service.ts` -> `AuthService` |
| Guard | `.guard.ts` | `Guard` (or camelCase function) | `auth.guard.ts` -> `authGuard`, `guestGuard` |
| Pipe | `.pipe.ts` | `Pipe` | `translate-number.pipe.ts` -> `TranslateNumberPipe` |
| Directive | `.directive.ts` | `Directive` | `click-outside.directive.ts` -> `ClickOutsideDirective` |
| Store | `.store.ts` | `Store` | `app.store.ts` -> `AppStore` |
| Model/Interface | `.model.ts` | (PascalCase interface) | `user.model.ts` -> `User`, `UserRole` |
| Interceptor | `.interceptor.ts` | `Interceptor` (camelCase function) | `auth.interceptor.ts` -> `authInterceptor` |
| Helper | `.helper.ts` | `Helper` (class) or named exports | `storage.helper.ts` -> `StorageHelper` |
| Validator | (varies) | `Validators` (static class) | `custom-validators.ts` -> `CustomValidators` |
| Config | (varies, e.g., `-config.ts`) | (function or const) | `transloco-config.ts` -> `provideTranslocoConfig()` |
| Loader | (varies, e.g., `-loader.ts`) | `Loader` | `transloco-loader.ts` -> `TranslocoHttpLoader` |
| Barrel export | `index.ts` | N/A | Re-exports all public API from a folder |
| Environment | `environment.ts` / `environment.*.ts` | N/A | `environment.prod.ts` |

### Additional Conventions

- **Component prefix**: `ahram-` (configured in `angular.json` schematics)
- **Directive prefix**: `ahram` (e.g., `[ahramClickOutside]`, `[ahramLazyImage]`)
- **File naming**: kebab-case for all files (e.g., `click-outside.directive.ts`)
- **Folder naming**: kebab-case for multi-word folders, singular for category folders (e.g., `guards/`, `pipes/`)
- **All components**: standalone, `OnPush` change detection, signal-based `input()` / `output()`
- **Separate template/style files**: Components use `.ts` + `.html` + `.scss` (configured via schematics: `style: "scss"`)
- **No test files**: Tests are skipped in schematics (`skipTests: true`); add when testing strategy is established

---

## 4. How to Add a New Feature

Follow these steps to add a new feature (e.g., "Projects"):

### Step 1: Create the Feature Folder Structure

```
src/app/features/projects/
├── components/                    # Feature-specific components
│   ├── project-list/
│   │   └── project-list.component.ts
│   └── project-detail/
│       └── project-detail.component.ts
├── models/                        # Feature-specific interfaces
│   └── project.model.ts
├── services/                      # Feature-specific services
│   └── projects.service.ts
├── state/                         # Feature-specific state (if needed)
│   └── projects.store.ts
└── projects.routes.ts             # Feature route definitions
```

### Step 2: Define Feature Routes

```typescript
// src/app/features/projects/projects.routes.ts
import { Routes } from '@angular/router';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/project-list/project-list.component')
        .then(m => m.ProjectListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/project-detail/project-detail.component')
        .then(m => m.ProjectDetailComponent),
  },
];
```

### Step 3: Register in App Routes

All feature routes live inside the `:locale` wrapper in `app.routes.ts`:

```typescript
// src/app/app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'ar', pathMatch: 'full' },

  // Legacy redirects (for old bookmarks/links without locale prefix)
  { path: 'projects', redirectTo: 'ar/projects', pathMatch: 'prefix' },

  // All locale-prefixed routes
  {
    path: ':locale',
    canActivate: [localeGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/projects.routes').then(m => m.PROJECTS_ROUTES),
      },
      // ... other feature routes
    ],
  },

  { path: '**', component: NotFoundComponent },
];
```

### Step 4: Create the Feature Service

```typescript
// src/app/features/projects/services/projects.service.ts
import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/services';
import { Project } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly api = inject(ApiService);

  getAll() {
    return this.api.getPaginated<Project>('/projects');
  }

  getById(id: string) {
    return this.api.get<Project>(`/projects/${id}`);
  }
}
```

### Step 5: Create Components

```typescript
// src/app/features/projects/components/project-list/project-list.component.ts
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { CardComponent, LoadingSpinnerComponent } from '@shared/ui';
import { ProjectsService } from '../../services/projects.service';
import { Project } from '../../models/project.model';

@Component({
  selector: 'ahram-project-list',
  standalone: true,
  imports: [TranslocoDirective, CardComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section *transloco="let t">
      <h1>{{ t('projects.title') }}</h1>
      <!-- component template -->
    </section>
  `,
})
export class ProjectListComponent implements OnInit {
  private readonly projectsService = inject(ProjectsService);
  // ...
}
```

### Step 6: Add Translations

Add keys to both `src/assets/i18n/ar.json` and `src/assets/i18n/en.json`:

```json
{
  "projects": {
    "title": "المشاريع",
    "description": "استعرض مشاريعنا العقارية"
  }
}
```

### Step 7: Add SEO (Optional)

```typescript
import { SeoService } from '@core/services';

// In your component's ngOnInit:
this.seo.updateSeo({
  title: 'Projects',
  description: 'Browse our real estate projects',
});
```

### Step 8: Protect Routes (If Needed)

```typescript
import { authGuard, roleGuard } from '@core/guards';

{
  path: 'admin/projects',
  canActivate: [authGuard, roleGuard('admin')],
  loadChildren: () => import('./features/projects/projects.routes').then(m => m.PROJECTS_ROUTES),
}
```

---

## 5. File Organization Rules

### Rule 1: Core vs Shared vs Features

| Folder | Contents | Scope | Instantiation |
|--------|----------|-------|---------------|
| `core/` | Services, guards, interceptors, state, layout | App-wide singletons | Once (providedIn: root) |
| `shared/` | UI components, pipes, directives, helpers, validators | Reused across features | Multiple (imported per component) |
| `features/` | Feature pages, feature services, feature state | Scoped to one feature | Lazy-loaded per route |

### Rule 2: Barrel Exports

Every folder that contains multiple related files must have an `index.ts` barrel file re-exporting its public API. Import from the barrel, never from individual files:

```typescript
// Correct
import { AuthService, ApiService } from '@core/services';

// Incorrect
import { AuthService } from '@core/services/auth.service';
```

### Rule 3: Path Aliases

Always use TypeScript path aliases defined in `tsconfig.json`:

| Alias | Maps To | Usage |
|-------|---------|-------|
| `@core/*` | `src/app/core/*` | `import { AuthService } from '@core/services'` |
| `@shared/*` | `src/app/shared/*` | `import { ButtonComponent } from '@shared/ui'` |
| `@features/*` | `src/app/features/*` | `import { ProjectsService } from '@features/projects/services/projects.service'` |
| `@env` | `src/environments/environment` | `import { environment } from '@env'` |

### Rule 4: Component Architecture

- All components must be **standalone** (no NgModules)
- All components must use **`OnPush` change detection**
- Use **signal-based `input()` and `output()`** (not `@Input` / `@Output` decorators)
- Use **`inject()`** function (not constructor injection)
- Use **separate `.html` template files** (`templateUrl`)
- Use **separate `.scss` style files** (`styleUrl`) — for host styles/animations; layout via Tailwind classes

### Rule 5: Dependency Direction

Dependencies flow inward. Features may depend on core and shared. Shared may depend on core. Core should not depend on shared or features.

```
features/ --depends-on--> shared/ --depends-on--> core/
features/ --depends-on--> core/
```

Never create circular dependencies.

### Rule 6: SSR Safety

All code that accesses browser APIs (`window`, `document`, `localStorage`, `IntersectionObserver`, etc.) must be guarded with `PlatformService`:

```typescript
private readonly platform = inject(PlatformService);

ngOnInit() {
  this.platform.runInBrowser(() => {
    // Safe to use window, document, localStorage here
  });
}
```

### Rule 7: i18n

- All user-facing text must use Transloco translation keys, never hardcoded strings
- Use `*transloco="let t"` structural directive in templates
- Add keys to both `ar.json` and `en.json`
- Arabic is the primary and fallback language

### Rule 8: State Management

- **Global state**: Use `AppStore` (NgRx Signal Store) in `core/state/`
- **Auth state**: Use `AuthService` signal-based state (not duplicated in store)
- **Feature state**: Create feature-specific signal stores in `features/{name}/state/`
- **Component state**: Use local signals for UI-only state
- **Server state**: Use services with `HttpClient` (consider adding TanStack Query in the future)

### Rule 9: File Placement Decision Tree

```
Is it used by the whole app (once)?
  └── Yes → core/
      ├── Is it a service?          → core/services/
      ├── Is it a guard?            → core/guards/
      ├── Is it an interceptor?     → core/interceptors/
      ├── Is it global state?       → core/state/
      ├── Is it a layout component? → core/layout/
      └── Is it a type/interface?   → core/models/

Is it reused across multiple features?
  └── Yes → shared/
      ├── Is it a UI component?     → shared/ui/
      ├── Is it a pipe?             → shared/pipes/
      ├── Is it a directive?        → shared/directives/
      ├── Is it a utility function? → shared/helpers/
      └── Is it a form validator?   → shared/validators/

Is it specific to one feature?
  └── Yes → features/{feature-name}/
      ├── components/
      ├── services/
      ├── models/
      └── state/
```
