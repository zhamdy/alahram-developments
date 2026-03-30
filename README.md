# Al-Ahram Developments | الأهرام للتطوير العقاري

A modern, bilingual (Arabic/English) real estate development company website built with Angular 21 and Server-Side Rendering. Deployed on Cloudflare Pages with a serverless API backend, Turso database, and R2 storage.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Angular | 21.2 |
| Language | TypeScript (strict mode) | 5.9 |
| SSR | `@angular/ssr` + Express | 5.1 |
| State Management | NgRx Signal Store | 21.x |
| Internationalization | `@jsverse/transloco` | 8.x |
| Styling | Tailwind CSS (CSS-first config, OKLCH) | 4.2 |
| Animations | GSAP + ScrollTrigger | 3.14 |
| Icons | `@lucide/angular` | 1.7 |
| Carousels | Swiper | 12.x |
| API (Serverless) | Hono | 4.12 |
| Database | Turso (serverless SQLite) | — |
| Storage | Cloudflare R2 | — |
| Deployment | Cloudflare Pages | — |
| CI/CD | GitHub Actions | — |

---

## Architecture Overview

The project follows a **3-layer Domain-Driven Design** architecture:

```
┌─────────────────────────────────────────────────────┐
│                    Features Layer                    │
│   Lazy-loaded feature modules (projects, admin, …)  │
│   Each feature owns its routes, components, stores  │
├─────────────────────────────────────────────────────┤
│                    Shared Layer                      │
│   Reusable UI components, pipes, directives,        │
│   validators, helpers — no domain logic             │
├─────────────────────────────────────────────────────┤
│                     Core Layer                       │
│   Singleton services, guards, interceptors,         │
│   models, layout components, global state           │
│   Provided once at root — NEVER imported by Shared  │
└─────────────────────────────────────────────────────┘
```

**Dependency rules:**
- `Features` may import from `Core` and `Shared`.
- `Shared` may import from `Core` only.
- `Core` does not import from `Features` or `Shared`.
- `Features` do not import from other `Features`.

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **npm** 10.8 or later

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

Navigate to `http://localhost:4200/`. The dev server runs with SSR and HMR enabled.

### Production Build

```bash
npm run build
```

Compiles with production optimizations (AOT, tree-shaking, output hashing) and outputs browser + server bundles to `dist/alahram-developments/`.

### Serve SSR Locally

```bash
npm run build
npm run start:ssr
```

The SSR server starts on `http://localhost:4000`.

---

## Project Structure

```
alahram-developments/
├── src/
│   ├── app/
│   │   ├── core/                        # Singleton layer (provided in root)
│   │   │   ├── guards/
│   │   │   │   └── locale.guard.ts      # Validates :locale param, initializes i18n
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts  # Bearer token + 401 refresh logic
│   │   │   │   ├── error.interceptor.ts # HTTP error normalization
│   │   │   │   └── loading.interceptor.ts # Global loading state tracking
│   │   │   ├── layout/
│   │   │   │   ├── header/              # <ahram-header> site header
│   │   │   │   ├── footer/              # <ahram-footer> site footer
│   │   │   │   └── not-found/           # 404 page
│   │   │   ├── models/                  # TypeScript interfaces
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts       # Generic HTTP wrapper
│   │   │   │   ├── auth.service.ts      # Authentication (login, refresh, logout)
│   │   │   │   ├── i18n.service.ts      # Locale management (ar/en, RTL/LTR)
│   │   │   │   ├── platform.service.ts  # SSR-safe platform detection
│   │   │   │   └── seo.service.ts       # Meta tags, OG, canonical, JSON-LD
│   │   │   └── state/
│   │   │       ├── app.store.ts         # AppStore — NgRx Signal Store
│   │   │       └── loading.service.ts   # Signal-based request counter
│   │   │
│   │   ├── shared/                      # Reusable, stateless building blocks
│   │   │   ├── ui/                      # 8 shared components
│   │   │   │   ├── button/
│   │   │   │   ├── card/
│   │   │   │   ├── contact-form/
│   │   │   │   ├── input/
│   │   │   │   ├── installment-calculator/
│   │   │   │   ├── loading-spinner/
│   │   │   │   ├── newsletter/
│   │   │   │   └── whatsapp-button/
│   │   │   ├── pipes/                   # LocalizeRoute, FormatDate, TranslateNumber, RelativeTime
│   │   │   ├── directives/              # ScrollAnimate, LazyImage, ImageFallback, ClickOutside
│   │   │   ├── validators/
│   │   │   └── helpers/
│   │   │       └── seo.helper.ts        # Schema.org JSON-LD generators
│   │   │
│   │   ├── features/                    # 13 lazy-loaded feature modules
│   │   │   ├── home/                    # Landing page (11 sub-components)
│   │   │   ├── projects/                # Project listing, zone browsing, detail pages
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   ├── gallery/
│   │   │   ├── blog/                    # Blog list + detail (6 posts)
│   │   │   ├── privacy/
│   │   │   ├── payment/                 # Payment plans
│   │   │   ├── updates/                 # Construction updates
│   │   │   ├── guide/                   # Sadat City guide
│   │   │   ├── investors/
│   │   │   ├── faq/
│   │   │   └── admin/                   # Admin panel (CRUD for projects, gallery, contacts)
│   │   │       ├── dashboard/
│   │   │       ├── projects/
│   │   │       ├── gallery/
│   │   │       ├── contacts/
│   │   │       ├── login/
│   │   │       ├── layout/              # Admin header + sidebar
│   │   │       ├── guards/              # Admin auth guard
│   │   │       └── services/            # Admin API service
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.config.ts                # Browser providers
│   │   ├── app.config.server.ts         # Server providers
│   │   ├── app.routes.ts                # Client-side routes
│   │   └── app.routes.server.ts         # Prerender / SSR route config
│   │
│   ├── assets/i18n/                     # ar.json, en.json translations
│   ├── environments/                    # dev, staging, prod configs
│   ├── styles.css                       # Tailwind theme + global utilities
│   ├── index.html
│   ├── server.ts                        # Express SSR server
│   └── main.ts / main.server.ts         # Bootstrap entries
│
├── functions/                           # Cloudflare Pages Functions (API)
│   ├── api/[[route]].ts                 # Hono entry point
│   └── lib/
│       ├── routes/                      # API route handlers
│       ├── middleware/                   # Auth middleware
│       ├── db.ts                        # Turso database connection
│       └── crypto.ts                    # Password hashing utilities
│
├── data/                                # Local SQLite database + uploads
├── public/                              # Static assets, robots.txt, sitemap.xml
├── scripts/                             # Sitemap generator, Turso seeder
├── docs/                                # Architecture & guide documentation
├── .github/workflows/deploy.yml         # CI/CD pipeline
├── wrangler.toml                        # Cloudflare Pages config
├── angular.json
├── Dockerfile                           # Multi-stage Docker build (fallback)
├── docker-compose.yml
└── package.json
```

### Path Aliases

| Alias | Maps To |
|-------|---------|
| `@core/*` | `src/app/core/*` |
| `@shared/*` | `src/app/shared/*` |
| `@features/*` | `src/app/features/*` |
| `@env` | `src/environments/environment` |

---

## Content & Routing

### Locale Routing

All routes are wrapped under a `/:locale` parameter (`/ar/...`, `/en/...`):

- `localeGuard` validates the `:locale` param and initializes i18n
- `LocalizeRoutePipe` prepends the active locale to all `routerLink` values
- Language toggle switches locale in the URL via `router.navigateByUrl()`
- Root `/` redirects to `/ar`
- Legacy URLs (`/projects`, `/about`, etc.) redirect to `/ar/...`

### Project Hierarchy

Projects are organized in a 3-level URL structure:

```
/:locale/projects                        → All projects
/:locale/projects/:zoneSlug              → Projects in a zone
/:locale/projects/:zoneSlug/:slug        → Project detail
```

- **8 zones** (zone-7-strip, zone-7-homeland, zone-14, zone-21, zone-22, zone-29, al-rawda, zone-35)
- **20 projects** across all zones
- **6 blog posts** with individual detail pages

### Prerendering

**88 routes** are statically prerendered at build time (each route x 2 locales):

| Route Pattern | Count |
|---------------|-------|
| Home, about, contact, gallery, privacy, blog, payment, updates, guide, investors, faq | 22 |
| Project zones (8) | 16 |
| Individual projects (20) | 40 |
| Blog posts (6) | 12 |
| **Total** | **88** |

Server-rendered (on demand): project detail by slug, blog detail by slug, catch-all 404.

Client-rendered only: admin panel (`/admin/**`).

---

## API Backend

The API runs as **Cloudflare Pages Functions** using the [Hono](https://hono.dev) framework.

### Endpoints

```
GET    /api/health                # Health check

# Public
GET    /api/projects              # List all projects
GET    /api/projects/:id          # Project detail
GET    /api/gallery               # Gallery images
GET    /api/blog                  # Blog posts
POST   /api/contact              # Submit contact form

# Auth
POST   /api/auth/login           # Admin login → JWT
POST   /api/auth/logout          # Revoke token

# Admin (JWT required)
GET    /api/admin/projects       # List projects
POST   /api/admin/projects       # Create project
PUT    /api/admin/projects/:id   # Update project
DELETE /api/admin/projects/:id   # Delete project
POST   /api/admin/upload         # Upload image to R2
GET    /api/admin/gallery        # List gallery items
POST   /api/admin/gallery        # Add gallery item
DELETE /api/admin/gallery/:id    # Remove gallery item
GET    /api/admin/contacts       # List contact submissions
DELETE /api/admin/contacts/:id   # Delete contact submission
```

### Infrastructure

| Service | Technology |
|---------|------------|
| API Runtime | Cloudflare Pages Functions (Workers) |
| Database | Turso (serverless SQLite on the edge) |
| File Storage | Cloudflare R2 (S3-compatible) |
| Auth | JWT via `@tsndr/cloudflare-worker-jwt` |
| Password Hashing | bcryptjs |

---

## i18n (Internationalization)

| Property | Value |
|----------|-------|
| Default locale | `ar` (Arabic) |
| Default direction | `rtl` (Right-to-Left) |
| Supported locales | `ar`, `en` |
| Translation files | `src/assets/i18n/ar.json`, `src/assets/i18n/en.json` |
| Locale persistence | `localStorage` (`ahram-locale` key) |

### Usage in Templates

```html
<h1 *transloco="let t">{{ t('home.title') }}</h1>
<p>{{ 'home.subtitle' | transloco }}</p>
```

### RTL Support

- `dir` attribute on `<html>` set dynamically by `I18nService`
- Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`) used throughout
- `[dir="rtl"]` selector in `styles.css` for base RTL styles

---

## SSR Notes

### Hydration

Configured in `app.config.ts` with:
- **`withEventReplay()`** — replays user events before hydration completes
- **`withHttpTransferCacheOptions()`** — transfers HTTP responses from server to client (API routes excluded)

### Platform Detection

Use `PlatformService` for SSR-safe browser API access:

```typescript
private readonly platform = inject(PlatformService);

// Safe — only runs in browser
this.platform.runInBrowser(() => {
  window.scrollTo(0, 0);
});
```

Never access `window`, `document`, or `localStorage` directly.

---

## Styling

### Tailwind CSS v4 (CSS-First)

Configured via `@theme` in `src/styles.css` — no `tailwind.config.js`.

### Color System (OKLCH)

| Token | Purpose |
|-------|---------|
| `primary` | Brand blue |
| `secondary` | Warm neutral |
| `accent` | Gold/amber highlight |
| `destructive` | Error/danger red |
| `background` / `foreground` | Page background / text |
| `muted` | Muted surfaces |
| `border` | Border color |

Dark mode overrides under `.dark` class.

### Fonts

**Cairo** (primary, Arabic + Latin) with **Inter** fallback.

### Animations

- **GSAP + ScrollTrigger** for scroll-triggered animations via `ScrollAnimateDirective`
- Animation types: `fade-up`, `fade-down`, `fade-left`, `fade-right`, `scale-in`, `slide-up`
- Micro-interaction CSS classes: `card-hover`, `btn-glow`, `link-underline`, `img-zoom`, `icon-float`
- All animations respect `prefers-reduced-motion`

---

## SEO

- **Sitemap** auto-generated at build time (`scripts/generate-sitemap.js`), 96 URLs with `xhtml:link` hreflang alternates
- **Canonical URLs** include locale: `https://alahram-developments.com/${lang}/projects`
- **Hreflang**: 3 entries per page (`ar`, `en`, `x-default` → `ar`)
- **Schema.org JSON-LD** on project detail pages (`RealEstateListing` + `BreadcrumbList`)
- **`SeoService`** sets per-page title, meta description, Open Graph, Twitter cards

---

## Deployment

### Primary: Cloudflare Pages

The site deploys automatically on push to `main` via GitHub Actions:

1. `npm ci` + `npm run build` (includes sitemap generation)
2. `wrangler pages deploy` pushes browser output to Cloudflare Pages
3. `functions/` directory is deployed as Pages Functions (API)

**Environment variables** (set in Cloudflare dashboard):

| Variable | Description |
|----------|-------------|
| `TURSO_URL` | Turso database URL |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `JWT_SECRET` | JWT signing key |

### Fallback: Docker

```bash
npm run docker:build    # Multi-stage build (Node 20 Alpine)
npm run docker:up       # Start app + nginx reverse proxy
npm run docker:down     # Stop containers
```

| Service | Port | Description |
|---------|------|-------------|
| `app` | `4000` | Angular SSR server |
| `nginx` | `80`, `443` | Reverse proxy |

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Dev server (`http://localhost:4200`, SSR + HMR) |
| `npm run build` | Production build (runs sitemap gen first) |
| `npm run build:staging` | Staging environment build |
| `npm run start:ssr` | Serve production SSR on port 4000 |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier format |
| `npm run format:check` | Prettier check |
| `npm run deploy` | Deploy to Cloudflare Pages |
| `npm run db:seed` | Seed local SQLite database |
| `npm run db:seed:turso` | Seed remote Turso database |
| `npm run docker:build` | Build Docker image |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |

---

## Environments

| Environment | API Base URL | Build Command |
|-------------|-------------|---------------|
| Development | `http://localhost:3000/api` | `npm start` |
| Staging | `https://staging-api.alahram-developments.com/api` | `npm run build:staging` |
| Production | `https://api.alahram-developments.com/api` | `npm run build` |

---

## Contributing

### Branch Naming

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New feature | `feature/project-listing-page` |
| `fix/` | Bug fix | `fix/rtl-header-alignment` |
| `chore/` | Maintenance | `chore/update-angular-21.3` |

### Conventional Commits

```
feat: add project gallery component
fix: correct RTL padding on property cards
chore: upgrade tailwindcss to 4.3
docs: update SSR deployment guide
refactor: extract shared validators
```

### PR Process

1. Branch from `main` using the naming convention above.
2. Ensure `npm run lint` and `npm run build` pass.
3. Run `npm run format`.
4. Open a PR against `main` with a summary and test plan.
5. Squash and merge after approval.

---

## License

Proprietary. All rights reserved.
