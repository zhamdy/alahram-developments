# Al-Ahram Developments | الأهرام للتطوير العقاري

A modern, bilingual (Arabic/English) real estate development company website built with Angular 21 and Server-Side Rendering. The application serves as the digital presence for Al-Ahram Developments, delivering a fast, SEO-friendly, and fully accessible experience in both RTL and LTR layouts.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Angular | 21.2 |
| Language | TypeScript (strict mode) | 5.9 |
| SSR | `@angular/ssr` + Express | 5.1 |
| State Management | NgRx Signal Store | 21.x |
| Internationalization | `@jsverse/transloco` | 8.x |
| Styling | Tailwind CSS (CSS-first config) | 4.2 |
| HTTP Client | Angular HttpClient with `fetch` backend | Built-in |
| Linting | ESLint + `@angular-eslint` | 21.x |
| Formatting | Prettier | 3.x |
| Package Manager | npm | 10.8+ |

---

## Architecture Overview

The project follows a **3-layer Domain-Driven Design** architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                    Features Layer                     │
│   Lazy-loaded feature modules (projects, units, ...) │
│   Each feature owns its routes, components, stores   │
├─────────────────────────────────────────────────────┤
│                    Shared Layer                       │
│   Reusable UI components, pipes, directives,         │
│   validators, helpers — no domain logic              │
├─────────────────────────────────────────────────────┤
│                     Core Layer                        │
│   Singleton services, guards, interceptors,          │
│   models, layout components, global state            │
│   Provided once at root — NEVER imported by Shared   │
└─────────────────────────────────────────────────────┘
```

**Dependency rules:**
- `Features` may import from `Core` and `Shared`.
- `Shared` may import from `Core` only (for services like `PlatformService`).
- `Core` does not import from `Features` or `Shared`.

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **npm** 10.8 or later (ships with Node 20)

### Installation

```bash
git clone https://github.com/your-org/alahram-developments.git
cd alahram-developments
npm install
```

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application reloads automatically when source files change. The dev server runs with SSR enabled by default.

### Production Build

```bash
npm run build
```

This compiles the application with production optimizations (AOT, tree-shaking, output hashing) and outputs both browser and server bundles to `dist/alahram-developments/`.

### Serve SSR (Production)

```bash
npm run build
npm run start:ssr
```

The Node/Express SSR server starts on `http://localhost:4000`. The port can be overridden via the `PORT` environment variable.

---

## Project Structure

```
alahram-developments/
├── src/
│   ├── app/
│   │   ├── core/                        # Singleton layer (provided in root)
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts        # authGuard & guestGuard (CanActivateFn)
│   │   │   │   └── role.guard.ts        # roleGuard factory (role-based access)
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts  # Bearer token + 401 refresh logic
│   │   │   │   ├── error.interceptor.ts # HTTP error normalization
│   │   │   │   └── loading.interceptor.ts # Global loading state tracking
│   │   │   ├── layout/
│   │   │   │   ├── header/              # <ahram-header> site header
│   │   │   │   ├── footer/              # <ahram-footer> site footer
│   │   │   │   └── not-found/           # 404 page
│   │   │   ├── models/
│   │   │   │   ├── api-response.model.ts  # ApiResponse<T>, PaginatedResponse<T>
│   │   │   │   ├── environment.model.ts   # Environment interface
│   │   │   │   └── user.model.ts          # User & UserRole types
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts       # Generic HTTP wrapper (get/post/put/patch/delete)
│   │   │   │   ├── auth.service.ts      # Authentication (login, refresh, logout)
│   │   │   │   ├── i18n.service.ts      # Locale management (ar/en, RTL/LTR)
│   │   │   │   ├── platform.service.ts  # SSR-safe platform detection (browser/server)
│   │   │   │   ├── seo.service.ts       # Meta tags, OG tags, canonical URLs
│   │   │   │   ├── transloco-config.ts  # Transloco provider factory
│   │   │   │   └── transloco-loader.ts  # HTTP-based translation file loader
│   │   │   └── state/
│   │   │       ├── app.store.ts         # AppStore (theme, sidebar) — NgRx Signal Store
│   │   │       └── loading.service.ts   # LoadingService (signal-based request counter)
│   │   │
│   │   ├── shared/                      # Reusable, stateless building blocks
│   │   │   ├── ui/
│   │   │   │   ├── button/              # <ahram-button>
│   │   │   │   ├── card/                # <ahram-card>
│   │   │   │   ├── input/               # <ahram-input>
│   │   │   │   └── loading-spinner/     # <ahram-loading-spinner>
│   │   │   ├── pipes/
│   │   │   │   ├── translate-number.pipe.ts  # Locale-aware number formatting
│   │   │   │   └── relative-time.pipe.ts     # Relative date display
│   │   │   ├── directives/
│   │   │   │   ├── click-outside.directive.ts # Detect clicks outside an element
│   │   │   │   └── lazy-image.directive.ts    # IntersectionObserver lazy loading
│   │   │   ├── validators/
│   │   │   │   └── custom-validators.ts       # Reusable form validators
│   │   │   └── helpers/
│   │   │       ├── storage.helper.ts    # SSR-safe localStorage/sessionStorage
│   │   │       └── seo.helper.ts        # SEO utility functions
│   │   │
│   │   ├── features/                    # Lazy-loaded feature modules
│   │   │   └── .gitkeep                 # Placeholder — features added as needed
│   │   │
│   │   ├── app.component.ts             # Root component (<ahram-root>)
│   │   ├── app.config.ts                # Browser application config (providers)
│   │   ├── app.config.server.ts         # Server application config (SSR providers)
│   │   ├── app.routes.ts                # Client-side route definitions
│   │   └── app.routes.server.ts         # Server-side render mode configuration
│   │
│   ├── assets/
│   │   └── i18n/
│   │       ├── ar.json                  # Arabic translations (default)
│   │       └── en.json                  # English translations
│   │
│   ├── environments/
│   │   ├── environment.ts               # Development (localhost:3000)
│   │   ├── environment.staging.ts       # Staging (staging-api.alahram-developments.com)
│   │   └── environment.prod.ts          # Production (api.alahram-developments.com)
│   │
│   ├── main.ts                          # Browser bootstrap entry
│   ├── main.server.ts                   # Server bootstrap entry
│   ├── server.ts                        # Express SSR server (port 4000)
│   ├── styles.css                       # Global styles + Tailwind theme
│   └── index.html                       # HTML shell
│
├── public/                              # Static assets (favicon, robots.txt, etc.)
├── angular.json                         # Angular CLI workspace config
├── tsconfig.json                        # TypeScript config (strict mode)
├── Dockerfile                           # Multi-stage Docker build
├── docker-compose.yml                   # App + Nginx reverse proxy
└── package.json                         # Dependencies & scripts
```

### Path Aliases

Defined in `tsconfig.json` for clean imports:

| Alias | Maps To |
|-------|---------|
| `@core/*` | `src/app/core/*` |
| `@shared/*` | `src/app/shared/*` |
| `@features/*` | `src/app/features/*` |
| `@env` | `src/environments/environment` |

---

## Environments

Three environment configurations are available, each replaced at build time via Angular's `fileReplacements`:

| Environment | File | API Base URL | Production |
|-------------|------|-------------|------------|
| **Development** | `environment.ts` | `http://localhost:3000/api` | `false` |
| **Staging** | `environment.staging.ts` | `https://staging-api.alahram-developments.com/api` | `false` |
| **Production** | `environment.prod.ts` | `https://api.alahram-developments.com/api` | `true` |

All environments share these defaults:
- `appName`: `'Al-Ahram Developments'`
- `defaultLocale`: `'ar'`
- `supportedLocales`: `['ar', 'en']`

Build for a specific environment:

```bash
npm run build              # Production (default)
npm run build:staging      # Staging
npm run build:dev          # Development
```

---

## i18n (Internationalization)

The application uses **@jsverse/transloco** for runtime language switching without a full page reload.

| Property | Value |
|----------|-------|
| Default locale | `ar` (Arabic) |
| Default direction | `rtl` (Right-to-Left) |
| Supported locales | `ar`, `en` |
| Fallback language | `ar` |
| Translation files | `src/assets/i18n/ar.json`, `src/assets/i18n/en.json` |
| Locale persistence | `localStorage` (`ahram-locale` key) |

### How It Works

1. **`I18nService`** initializes on app start, reads the stored locale (defaults to `ar`), and sets `lang` and `dir` attributes on the `<html>` element.
2. **`TranslocoHttpLoader`** fetches translation JSON files from `/assets/i18n/{lang}.json`.
3. Switching languages is instant — Transloco re-renders all `transloco` pipes and directives without navigation.
4. On the server (SSR), localStorage is unavailable, so the default locale (`ar`) is used for the initial render.

### Usage in Templates

```html
<!-- Using the transloco directive -->
<h1 *transloco="let t">{{ t('home.title') }}</h1>

<!-- Using the transloco pipe -->
<p>{{ 'home.subtitle' | transloco }}</p>
```

### RTL Support

- The `dir` attribute on `<html>` is set dynamically by `I18nService`.
- Tailwind CSS logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`) are used throughout for bidirectional layout support.
- The `[dir="rtl"]` selector in `styles.css` applies base RTL styles.

---

## SSR Notes

The application uses Angular's built-in SSR with `@angular/ssr` and Express 5. All routes default to `RenderMode.Server`.

### Hydration

Client hydration is configured in `app.config.ts` with:
- **`withEventReplay()`** — Replays user events that occur before hydration completes.
- **`withHttpTransferCacheOptions({ includePostRequests: true })`** — Transfers HTTP responses from server to client to avoid duplicate requests, including POST requests.

### Transfer State

Angular's Transfer State mechanism (part of `provideClientHydration`) automatically serializes HTTP responses made during SSR into the HTML payload. The client reuses these responses instead of making duplicate API calls.

### Platform Detection

Use `PlatformService` to safely guard browser-only code:

```typescript
import { PlatformService } from '@core/services';

export class MyComponent {
  private readonly platform = inject(PlatformService);

  ngOnInit(): void {
    // Safe — only runs in the browser
    this.platform.runInBrowser(() => {
      window.scrollTo(0, 0);
    });

    // Conditional check
    if (this.platform.isBrowser) {
      // Access window, document, localStorage, etc.
    }
  }
}
```

### Browser-Only Code

Never access `window`, `document`, `localStorage`, or other browser APIs directly. Always use:
- **`PlatformService.isBrowser`** / **`PlatformService.isServer`** — Boolean checks.
- **`PlatformService.runInBrowser(fn)`** — Execute a callback only in the browser.
- **`PlatformService.getWindow()`** / **`PlatformService.getDocument()`** — Nullable accessors.

---

## State Management

The application uses **NgRx Signal Store** for reactive, signal-based state management.

### AppStore

The global `AppStore` (provided in root) manages application-level UI state:

```typescript
import { AppStore } from '@core/state';

export class MyComponent {
  private readonly appStore = inject(AppStore);

  // Read state as signals
  theme = this.appStore.theme;           // Signal<'light' | 'dark'>
  isDark = this.appStore.isDarkMode;     // Signal<boolean>
  sidebarOpen = this.appStore.sidebarOpen; // Signal<boolean>

  // Mutate state
  toggleTheme(): void { this.appStore.toggleTheme(); }
  toggleSidebar(): void { this.appStore.toggleSidebar(); }
}
```

### LoadingService

A signal-based loading tracker that counts active HTTP requests:

```typescript
import { LoadingService } from '@core/state';

export class MyComponent {
  readonly loading = inject(LoadingService);

  // Use in template
  // @if (loading.isLoading()) { <ahram-loading-spinner /> }
}
```

The `loadingInterceptor` automatically increments/decrements the counter on every HTTP request.

### Feature Stores

Feature modules should define their own Signal Stores following this pattern:

```typescript
export const ProjectsStore = signalStore(
  withState({ projects: [], loading: false }),
  withComputed(/* derived state */),
  withMethods(/* actions */)
);
```

---

## Styling

### Tailwind CSS v4 (CSS-First Configuration)

Tailwind is configured directly in `src/styles.css` using the CSS-first `@theme` directive -- no `tailwind.config.js` file required.

### Color System

All colors use the **OKLCH** color space for perceptually uniform color manipulation:

| Token | Light Mode | Purpose |
|-------|-----------|---------|
| `primary` | `oklch(0.35 0.08 250)` | Brand blue |
| `secondary` | `oklch(0.85 0.04 80)` | Warm neutral |
| `accent` | `oklch(0.55 0.15 45)` | Gold/amber highlight |
| `destructive` | `oklch(0.55 0.2 25)` | Error/danger red |
| `background` | `oklch(0.99 0 0)` | Page background |
| `foreground` | `oklch(0.15 0.02 250)` | Primary text |
| `muted` | `oklch(0.95 0.01 250)` | Muted surfaces |
| `border` | `oklch(0.88 0.01 250)` | Border color |

Dark mode overrides are defined under the `.dark` class selector.

### Fonts

| Token | Font Stack |
|-------|-----------|
| `font-display` | Cairo, Inter, system-ui, sans-serif |
| `font-body` | Cairo, Inter, system-ui, sans-serif |
| `font-mono` | JetBrains Mono, Fira Code, monospace |

**Cairo** is the primary font, providing excellent Arabic and Latin glyph coverage. **Inter** serves as the Latin fallback.

### Custom Breakpoint

A custom `xs` breakpoint is defined at `475px` in addition to Tailwind's defaults.

---

## Docker

### Build the Image

```bash
npm run docker:build
# or directly:
docker build -t alahram-developments .
```

The Dockerfile uses a **multi-stage build**:
1. **Stage 1 (build):** Installs dependencies and runs `npm run build` on `node:20-alpine`.
2. **Stage 2 (production):** Copies only the built artifacts and production dependencies. Runs as a non-root `angular` user on port `4000`.

### Run with Docker Compose

```bash
npm run docker:up     # Start in detached mode
npm run docker:down   # Stop and remove containers
```

The `docker-compose.yml` defines two services:

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| `app` | `alahram-app` | `4000` | Angular SSR server (Node/Express) |
| `nginx` | `alahram-nginx` | `80`, `443` | Reverse proxy (requires `nginx.conf`) |

The Nginx service waits for the app's health check to pass before starting.

---

## Contributing

### Branch Naming

Use the following prefixes:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New feature | `feature/project-listing-page` |
| `fix/` | Bug fix | `fix/rtl-header-alignment` |
| `chore/` | Maintenance, tooling, deps | `chore/update-angular-21.3` |

### Conventional Commits

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add project gallery component
fix: correct RTL padding on property cards
chore: upgrade tailwindcss to 4.3
docs: update SSR deployment guide
refactor: extract shared validators to @shared/validators
```

### PR Process

1. Create a branch from `main` using the naming convention above.
2. Make your changes. Ensure `npm run lint` and `npm run build` pass.
3. Run `npm run format` to auto-format code with Prettier.
4. Open a Pull Request against `main`.
5. Fill in the PR description with a summary of changes and a test plan.
6. Request a code review from at least one team member.
7. Squash and merge after approval.

---

## Scripts

All available npm scripts defined in `package.json`:

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `ng serve` | Start dev server on `http://localhost:4200` (SSR + HMR) |
| `npm run start:ssr` | `node dist/alahram-developments/server/server.mjs` | Serve the production SSR build on port `4000` |
| `npm run build` | `ng build` | Production build (AOT, tree-shaking, output hashing) |
| `npm run build:staging` | `ng build --configuration staging` | Staging build with staging environment |
| `npm run build:dev` | `ng build --configuration development` | Development build (source maps, no optimization) |
| `npm run watch` | `ng build --watch --configuration development` | Rebuild on file changes (development config) |
| `npm run lint` | `ng lint` | Run ESLint on all `.ts` and `.html` files |
| `npm run lint:fix` | `ng lint --fix` | Run ESLint and auto-fix issues |
| `npm run format` | `prettier --write "src/**/*.{ts,html,css,json}"` | Format all source files with Prettier |
| `npm run format:check` | `prettier --check "src/**/*.{ts,html,css,json}"` | Check formatting without modifying files |
| `npm run docker:build` | `docker build -t alahram-developments .` | Build the Docker image |
| `npm run docker:up` | `docker compose up -d` | Start containers in detached mode |
| `npm run docker:down` | `docker compose down` | Stop and remove containers |
| `npx ng generate` | `ng generate <schematic>` | Scaffold components, directives, pipes, etc. |

### Schematic Defaults

The Angular CLI is configured in `angular.json` with these defaults for code generation:

- **Component prefix:** `ahram`
- **Change detection:** `OnPush`
- **Components:** standalone, no separate style file, no test file
- **Directives/Pipes:** standalone, no test file

```bash
# Generate a new standalone component with OnPush
npx ng generate component features/projects/components/project-card

# Generate a new service
npx ng generate service features/projects/services/projects
```

---

## License

Proprietary. All rights reserved.
