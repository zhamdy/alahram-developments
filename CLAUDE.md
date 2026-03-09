# Al-Ahram Developments — Project Instructions

## Workflow Rules

1. **Before writing any code, describe your approach and wait for approval.**
2. **If the requirements are ambiguous, ask clarifying questions before writing any code.**
3. **After finishing any code, list the edge cases and suggest test cases to cover them.**
4. **If a task requires changes to more than 3 files, stop and break it into smaller tasks first.**
5. **When there's a bug, start by writing a test that reproduces it, then fix it until the test passes.**
6. **Every time I correct you, reflect on what you did wrong and come up with a plan to never make the same mistake again.**

---

## Project Overview

- **Name:** Al-Ahram Developments (`alahram-developments`)
- **Framework:** Angular 21 with SSR (`@angular/ssr` + Express 5)
- **Language:** TypeScript 5.9 (strict mode)
- **Styling:** Tailwind CSS v4 (CSS-first config, OKLCH colors)
- **State Management:** NgRx Signal Store
- **i18n:** Transloco — Arabic (RTL, default) + English (LTR)
- **Default Locale:** `ar-EG`
- **Default Direction:** RTL
- **Component Prefix:** `ahram`

## Quick Commands

```bash
npm start             # Dev server (http://localhost:4200)
npm run build         # Production SSR build
npm run start:ssr     # Serve SSR (http://localhost:4000)
npm run build:staging # Staging build
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check
npm run docker:build  # Build Docker image
npm run docker:up     # Start containers
npm run docker:down   # Stop containers
```

## Architecture (3-Layer DDD)

```
src/app/
├── core/          # Singleton services, guards, interceptors, state, layout
├── shared/        # Reusable UI components, pipes, directives, helpers, validators
└── features/      # Lazy-loaded feature modules (home, projects, about, contact, gallery, blog, privacy, payment, updates, guide, investors, faq)
```

**Dependency Rules:**
- Features → can import Core and Shared
- Shared → can import Core only
- Core → cannot import Features or Shared
- Features → cannot import other Features

**Path Aliases:**
- `@core/*` → `src/app/core/*`
- `@shared/*` → `src/app/shared/*`
- `@features/*` → `src/app/features/*`
- `@env` → `src/environments/environment`

## Angular Conventions

- **All components:** standalone, `OnPush`, signal-based `input()`/`output()`/`model()`, `inject()`
- **Component files:** separate `.ts` / `.html` / `.scss` (templateUrl + styleUrl)
- **No NgModules** — everything standalone
- **Signals:** use `signal()` and `computed()` for local state, not BehaviorSubject
- **SSR-safe:** never use `window`/`document`/`localStorage` directly — use `PlatformService`
- **Templates:** use `@if`, `@for`, `@switch` control flow (not `*ngIf`/`*ngFor`)
- **Tailwind classes in templates** — component `.scss` only for animations/host styles

## Key Services (Core Layer)

| Service | Purpose |
|---------|---------|
| `ApiService` | Base HTTP client (get, post, put, patch, delete) |
| `AuthService` | Login, logout, token management |
| `I18nService` | Language switching, RTL/LTR direction, path-based locale routing |
| `SeoService` | Meta tags, Open Graph, canonical URLs |
| `PlatformService` | SSR vs Browser detection |
| `LoadingService` | Global loading state (signal-based) |
| `AppStore` | Global NgRx Signal Store (theme persisted to localStorage, sidebar) |

## Interceptor Chain

`authInterceptor` → `errorInterceptor` → `loadingInterceptor`

## Environments

| Config | API URL | Build |
|--------|---------|-------|
| `environment.ts` | `http://localhost:3000/api` | `npm start` |
| `environment.staging.ts` | `https://staging-api.alahram-developments.com/api` | `npm run build:staging` |
| `environment.prod.ts` | `https://api.alahram-developments.com/api` | `npm run build` |

## Documentation

Detailed docs are in the `docs/` folder:

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 3-layer DDD architecture, dependency rules, data flow, SSR architecture |
| [docs/STRUCTURE.md](docs/STRUCTURE.md) | Full annotated folder tree, naming conventions, how to add features |
| [docs/SSR-GUIDE.md](docs/SSR-GUIDE.md) | Hydration, Transfer State, platform detection, `@defer` blocks, SEO |
| [docs/STATE-MANAGEMENT.md](docs/STATE-MANAGEMENT.md) | NgRx Signal Store patterns, feature stores, SSR integration |
| [docs/STYLING-GUIDE.md](docs/STYLING-GUIDE.md) | Tailwind v4, OKLCH colors, RTL/LTR, dark mode, responsive design |
| [docs/I18N-GUIDE.md](docs/I18N-GUIDE.md) | Transloco setup, translations, language switching, Arabic UI best practices |
| [docs/CODING-CONVENTIONS.md](docs/CODING-CONVENTIONS.md) | TypeScript strict rules, Angular conventions, Git commit format |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker, nginx, CI/CD with GitHub Actions, SSL, scaling |
| [docs/API-PATTERNS.md](docs/API-PATTERNS.md) | ApiService usage, interceptors, error handling, pagination, file upload |

## PostCSS Configuration (Critical)

- **Must use `.postcssrc.json`** (JSON format) — Angular's `@angular/build` ignores `postcss.config.js`
- Config: `{ "plugins": { "@tailwindcss/postcss": {} } }`
- Without this, Tailwind utility classes are NOT generated (only theme variables work)

## State Persistence

| Key | Service | Storage |
|-----|---------|---------|
| `ahram-theme` | AppStore | localStorage (light/dark, applies `.dark` class to `<html>`) |
| `ahram-locale` | I18nService | localStorage (ar/en, applies `lang`/`dir` to `<html>`) |
| `ahram-access-token` | AuthService | localStorage |
| `ahram-refresh-token` | AuthService | localStorage |

All storage access is SSR-safe via `PlatformService.runInBrowser()`.

## SEO & Performance

- `robots.txt` and `sitemap.xml` in `public/` (served at root)
- Sitemap covers ~32 URLs (16 routes x 2 locales) with `xhtml:link` hreflang alternates
- Generate sitemap: `node scripts/generate-sitemap.js` (runs automatically via `prebuild`)
- `SeoService` sets per-page meta tags, Open Graph, Twitter cards, canonical URLs, and hreflang alternates
- Canonical URLs include locale: `https://alahram-developments.com/${lang}/projects`
- Hreflang: 3 entries per page (`ar`, `en`, `x-default` → Arabic)
- Schema.org JSON-LD via `SeoService.addJsonLd()` on project detail pages (`RealEstateListing` + `BreadcrumbList`)
- Helpers in `shared/helpers/seo.helper.ts`: `buildProjectSchema()`, `buildBreadcrumbSchema()`, `buildOrganizationSchema()`
- Google Analytics 4 in `index.html` (replace `G-XXXXXXXXXX` with real measurement ID)
- SPA page view tracking via Router `NavigationEnd` events in `app.component.ts`

## Locale Routing

- All routes wrapped under `/:locale` param (`/ar/...`, `/en/...`)
- `localeGuard` validates `:locale` param and calls `i18n.initializeFromUrl()`
- `LocalizeRoutePipe` (`localizeRoute`) prepends locale to all `routerLink` values (`pure: false`)
- Language toggle uses `i18n.switchLocaleUrl(router.url)` + `router.navigateByUrl()`
- Legacy URLs (`/projects`, `/about`, etc.) redirect to `/ar/...`
- Root `/` redirects to `/ar`

## Prerendering

- Static routes prerendered at build time (configured in `app.routes.server.ts`)
- 25 prerendered routes: root + 12 static routes x 2 locales (ar/en)
- Uses `getPrerenderParams` to generate both locale variants
- `RenderMode.Prerender`: `:locale`, `:locale/about`, `:locale/contact`, `:locale/gallery`, `:locale/privacy`, `:locale/projects`, `:locale/blog`, `:locale/payment-plans`, `:locale/updates`, `:locale/sadat-guide`, `:locale/investors`, `:locale/faq`
- `RenderMode.Server`: `:locale/projects/:slug`, `:locale/blog/:slug` (dynamic)
- `RenderMode.Server`: `**` (catch-all)

## Image Optimization

- All images use `NgOptimizedImage` (`ngSrc`, `fill`, `sizes`)
- Hero/above-the-fold images have `priority` attribute for preloading
- Project images in `src/assets/images/projects/` (hero + gallery per project)

## Animations (GSAP + ScrollTrigger)

- `ScrollAnimateDirective` (`[ahramAnimate]`) in `@shared/directives/scroll-animate.directive.ts`
- Uses static `import { gsap } from 'gsap'` — never dynamic `import('gsap')` (causes render delay)
- `afterNextRender()` in constructor (injection context) — NOT in `ngOnInit()`
- GSAP `from()` handles initial state — don't manually set `opacity:0`/`visibility:hidden`
- ScrollTrigger plugin registered once via module-level flag
- Animation types: `fade-up`, `fade-down`, `fade-left`, `fade-right`, `fade-in`, `scale-in`, `slide-up`, `slide-left`, `slide-right`
- Stagger pattern: `[animateDelay]="i * 0.15"` with `let i = $index` in `@for` loops
- Micro-interaction CSS classes in `styles.css`: `card-hover`, `btn-glow`, `link-underline`, `img-zoom`, `icon-float`
- All animations respect `prefers-reduced-motion` media query
- Applied across all 21 feature page components (home sub-components + all feature pages)

## Known Build Notes

- Production initial bundle: ~397 KB (106 KB transferred) — well under budget
- Prerendered 42 static routes at build time (root + 12 per locale x 2)
- Zero build errors, zero warnings
- Tailwind v4 uses CSS-first config via `@theme` in `src/styles.css`
- Brand colors: orange/amber primary (`oklch(0.72 0.15 55)`), dark brown secondary
- GSAP bundled as ~115 KB lazy chunk (shared across all pages using ScrollAnimateDirective)
