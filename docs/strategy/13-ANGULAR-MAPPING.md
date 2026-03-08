# 13 — Angular Feature Module Mapping

## Architecture Overview

Based on the project's 3-layer DDD architecture:

```
src/app/
├── core/              # Singleton services, guards, interceptors, layout
│   ├── services/      # ApiService, AuthService, SeoService, I18nService, PlatformService
│   ├── guards/        # authGuard, roleGuard
│   ├── interceptors/  # authInterceptor, errorInterceptor, loadingInterceptor
│   ├── state/         # AppStore (NgRx Signal Store — theme, sidebar, global state)
│   └── layout/        # HeaderComponent, FooterComponent, LayoutComponent
│
├── shared/            # Reusable UI, pipes, directives
│   ├── ui/            # ButtonComponent, CardComponent, InputComponent, etc.
│   ├── pipes/         # CurrencyPipe, DatePipe, TruncatePipe
│   ├── directives/    # LazyLoadDirective, IntersectionObserverDirective
│   └── helpers/       # Validators, utility functions
│
└── features/          # Lazy-loaded feature modules
    ├── home/          # Homepage
    ├── about/         # About Us page
    ├── projects/      # Projects listing + detail
    ├── gallery/       # Photo/video gallery
    ├── contact/       # Contact page + forms
    ├── payment/       # Payment plans + calculator      [Phase 2]
    ├── updates/       # Construction updates timeline   [Phase 2]
    ├── guide/         # Sadat City guide                [Phase 2]
    ├── blog/          # Blog listing + article detail   [Phase 2]
    ├── investors/     # Investors page                  [Phase 3]
    └── faq/           # FAQ page                        [Phase 3]
```

---

## Feature Module Details

### `features/home/`

```
home/
├── home.component.ts          # Page component
├── home.component.html        # Template
├── home.routes.ts             # Route config
├── components/
│   ├── hero-section/          # Hero banner with CTAs
│   ├── trust-bar/             # Key numbers strip
│   ├── featured-projects/     # 3 project cards
│   ├── why-us/                # 4 value pillars
│   ├── gallery-preview/       # Recent photos slider
│   ├── testimonials/          # Customer quotes
│   └── cta-banner/            # Contact CTA section
└── home.store.ts              # Feature signal store (featured projects, testimonials)
```

| Aspect | Details |
|--------|---------|
| **Route** | `/` (ar), `/en` (en) |
| **SSR** | Full SSR — critical for SEO and first paint |
| **API Endpoints** | `GET /api/projects?featured=true`, `GET /api/testimonials` |
| **State** | `homeStore` — featured projects, testimonials, gallery items |
| **SEO** | `SeoService.setMeta()` with homepage-specific tags |
| **Preload** | Hero image preloaded, other sections use `@defer` |

---

### `features/about/`

```
about/
├── about.component.ts
├── about.component.html
├── about.routes.ts
└── components/
    ├── company-story/
    ├── key-numbers/
    ├── values-section/
    └── timeline/
```

| Aspect | Details |
|--------|---------|
| **Route** | `/من-نحن` (ar), `/en/about` (en) |
| **SSR** | Full SSR |
| **API** | Static content (no API needed initially) |
| **State** | None — static content |
| **SEO** | Company name + "من نحن" keywords |

---

### `features/projects/`

```
projects/
├── projects.routes.ts
├── project-list/
│   ├── project-list.component.ts
│   ├── project-list.component.html
│   └── components/
│       ├── project-card/
│       └── project-filters/
├── project-detail/
│   ├── project-detail.component.ts
│   ├── project-detail.component.html
│   └── components/
│       ├── image-gallery/
│       ├── project-info/
│       ├── floor-plans/
│       ├── location-map/
│       ├── construction-progress/
│       ├── payment-summary/
│       ├── nearby-amenities/
│       └── inquiry-form/
├── models/
│   └── project.model.ts
└── projects.store.ts
```

| Aspect | Details |
|--------|---------|
| **Routes** | `/مشاريعنا` (list), `/مشاريعنا/:slug` (detail) |
| **SSR** | Full SSR — project pages are key SEO targets |
| **API Endpoints** | `GET /api/projects`, `GET /api/projects/:slug` |
| **State** | `projectsStore` — project list, selected project, filters |
| **SEO** | Dynamic meta per project, `RealEstateListing` schema |
| **Features** | Image gallery with lightbox, Google Maps embed, inquiry form |

---

### `features/gallery/`

```
gallery/
├── gallery.component.ts
├── gallery.component.html
├── gallery.routes.ts
├── components/
│   ├── gallery-grid/
│   ├── gallery-filter/
│   └── lightbox/
└── gallery.store.ts
```

| Aspect | Details |
|--------|---------|
| **Route** | `/معرض-الصور` (ar), `/en/gallery` (en) |
| **SSR** | Partial — render grid shell on server, load images in browser |
| **API** | `GET /api/gallery?project=&category=` |
| **State** | `galleryStore` — images, selected filter, lightbox state |
| **Features** | Masonry grid, category filters, lightbox with swipe, lazy loading |

---

### `features/contact/`

```
contact/
├── contact.component.ts
├── contact.component.html
├── contact.routes.ts
├── components/
│   ├── contact-form/
│   ├── contact-info/
│   └── office-map/
└── contact.store.ts
```

| Aspect | Details |
|--------|---------|
| **Route** | `/تواصل-معنا` (ar), `/en/contact` (en) |
| **SSR** | Full SSR for content; form interactive in browser |
| **API** | `POST /api/inquiries` |
| **State** | `contactStore` — form state, submission status |
| **Features** | Reactive form with Zod validation, Google Maps, WhatsApp link, click-to-call |
| **Validation** | Name (required), Phone (Egyptian format), Email (optional), Message |

---

### `features/payment/` — Phase 2

```
payment/
├── payment.component.ts
├── payment.component.html
├── payment.routes.ts
├── components/
│   ├── payment-calculator/
│   ├── plan-comparison/
│   └── financing-info/
└── payment.store.ts
```

| Aspect | Details |
|--------|---------|
| **Route** | `/خطط-السداد` (ar), `/en/payment-plans` (en) |
| **SSR** | Partial — static content SSR, calculator client-side |
| **API** | `GET /api/payment-plans`, calculator is client-side logic |
| **State** | `paymentStore` — calculator inputs/outputs, selected plan |
| **Features** | Interactive slider calculator, comparison table, lead capture |

---

### `features/updates/` — Phase 2

```
updates/
├── updates.routes.ts
├── updates-list/
│   ├── updates-list.component.ts
│   └── updates-list.component.html
├── update-detail/
│   ├── update-detail.component.ts
│   └── update-detail.component.html
├── components/
│   ├── timeline/
│   ├── milestone-badge/
│   └── photo-grid/
└── updates.store.ts
```

| Aspect | Details |
|--------|---------|
| **Route** | `/تحديثات-البناء` (ar), `/en/construction-updates` (en) |
| **SSR** | Full SSR |
| **API** | `GET /api/updates?project=`, `GET /api/updates/:id` |
| **State** | `updatesStore` — updates list, selected project filter |

---

### `features/guide/` — Phase 2

```
guide/
├── guide.component.ts
├── guide.component.html
├── guide.routes.ts
└── components/
    ├── city-overview/
    ├── why-sadat/
    ├── infrastructure/
    ├── education/
    ├── healthcare/
    └── price-comparison/
```

| Aspect | Details |
|--------|---------|
| **Route** | `/دليل-مدينة-السادات` (ar), `/en/sadat-city-guide` (en) |
| **SSR** | Full SSR — heavy SEO page |
| **API** | Static content initially |
| **SEO** | Long-form content targeting informational keywords |

---

### `features/blog/` — Phase 2

```
blog/
├── blog.routes.ts
├── blog-list/
│   ├── blog-list.component.ts
│   ├── blog-list.component.html
│   └── components/
│       ├── article-card/
│       └── category-filter/
├── blog-detail/
│   ├── blog-detail.component.ts
│   └── blog-detail.component.html
├── models/
│   └── article.model.ts
└── blog.store.ts
```

| Aspect | Details |
|--------|---------|
| **Routes** | `/المدونة` (list), `/المدونة/:slug` (detail) |
| **SSR** | Full SSR — blog is core SEO strategy |
| **API** | `GET /api/articles?category=&page=`, `GET /api/articles/:slug` |
| **State** | `blogStore` — articles list, categories, pagination |
| **SEO** | `Article` schema, dynamic meta, breadcrumbs |

---

### `features/investors/` — Phase 3

| Aspect | Details |
|--------|---------|
| **Route** | `/المستثمرين` (ar), `/en/investors` (en) |
| **SSR** | Full SSR |
| **Components** | InvestmentCase, ROICalculator, MarketData, InvestorForm |

### `features/faq/` — Phase 3

| Aspect | Details |
|--------|---------|
| **Route** | `/الأسئلة-الشائعة` (ar), `/en/faq` (en) |
| **SSR** | Full SSR — `FAQPage` schema for Google rich results |
| **Components** | FaqAccordion, FaqCategory, FaqSearch |
| **API** | `GET /api/faqs?category=` |

---

## Route Configuration

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      // Phase 1
      { path: '', loadChildren: () => import('./features/home/home.routes') },
      { path: 'من-نحن', loadChildren: () => import('./features/about/about.routes') },
      { path: 'مشاريعنا', loadChildren: () => import('./features/projects/projects.routes') },
      { path: 'معرض-الصور', loadChildren: () => import('./features/gallery/gallery.routes') },
      { path: 'تواصل-معنا', loadChildren: () => import('./features/contact/contact.routes') },
      { path: 'سياسة-الخصوصية', loadChildren: () => import('./features/privacy/privacy.routes') },

      // Phase 2
      { path: 'خطط-السداد', loadChildren: () => import('./features/payment/payment.routes') },
      { path: 'تحديثات-البناء', loadChildren: () => import('./features/updates/updates.routes') },
      { path: 'دليل-مدينة-السادات', loadChildren: () => import('./features/guide/guide.routes') },
      { path: 'المدونة', loadChildren: () => import('./features/blog/blog.routes') },

      // Phase 3
      { path: 'المستثمرين', loadChildren: () => import('./features/investors/investors.routes') },
      { path: 'الأسئلة-الشائعة', loadChildren: () => import('./features/faq/faq.routes') },

      // English routes (Phase 3)
      { path: 'en', loadChildren: () => import('./features/home/home.routes') },
      { path: 'en/about', loadChildren: () => import('./features/about/about.routes') },
      // ... mirror all routes under /en/
    ],
  },
  { path: '**', redirectTo: '' },
];
```

---

## Shared Components (used across features)

| Component | Location | Usage |
|-----------|----------|-------|
| `WhatsappButtonComponent` | `shared/ui/` | Floating button on all pages |
| `ProjectCardComponent` | `shared/ui/` | Homepage, projects listing |
| `ImageGalleryComponent` | `shared/ui/` | Gallery, project detail, updates |
| `LightboxComponent` | `shared/ui/` | Gallery, project detail |
| `InquiryFormComponent` | `shared/ui/` | Project detail, contact, investors |
| `BreadcrumbsComponent` | `shared/ui/` | All Level 1+ pages |
| `SectionHeadingComponent` | `shared/ui/` | All pages |
| `CtaBannerComponent` | `shared/ui/` | Homepage, about, guide |
| `GoogleMapComponent` | `shared/ui/` | Contact, project detail |
| `ShareButtonsComponent` | `shared/ui/` | Blog, projects |

---

## API Endpoints Summary

### Phase 1

| Method | Endpoint | Feature | Description |
|--------|----------|---------|-------------|
| GET | `/api/projects` | projects | List projects (filterable) |
| GET | `/api/projects/:slug` | projects | Single project detail |
| GET | `/api/gallery` | gallery | Gallery images (filterable) |
| GET | `/api/testimonials` | home | Customer testimonials |
| POST | `/api/inquiries` | contact | Submit contact/inquiry form |

### Phase 2

| Method | Endpoint | Feature | Description |
|--------|----------|---------|-------------|
| GET | `/api/payment-plans` | payment | Available payment plans |
| GET | `/api/updates` | updates | Construction updates (filterable) |
| GET | `/api/updates/:id` | updates | Single update detail |
| GET | `/api/articles` | blog | Blog articles (paginated) |
| GET | `/api/articles/:slug` | blog | Single article |
| POST | `/api/newsletter` | shared | Newsletter signup |

### Phase 3

| Method | Endpoint | Feature | Description |
|--------|----------|---------|-------------|
| GET | `/api/faqs` | faq | FAQ items (filterable by category) |
| GET | `/api/market-data` | investors | Market statistics and trends |

---

## State Management (NgRx Signal Store)

### Global Store (`core/state/app.store.ts`)

```typescript
// Manages: theme (light/dark), sidebar state, language, loading
type AppState = {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  locale: 'ar' | 'en';
  isLoading: boolean;
};
```

### Feature Stores

| Store | Feature | Key State |
|-------|---------|-----------|
| `projectsStore` | projects | projects list, selected project, filters |
| `galleryStore` | gallery | images, active filter, lightbox state |
| `contactStore` | contact | form data, submission status |
| `homeStore` | home | featured projects, testimonials |
| `blogStore` | blog | articles, categories, pagination |
| `updatesStore` | updates | update entries, project filter |
| `paymentStore` | payment | calculator state, plan comparison |
| `faqStore` | faq | faq items, category filter, search |

---

## SSR Strategy

| Page | SSR Mode | Notes |
|------|----------|-------|
| Homepage | Full SSR | Critical for first impression and SEO |
| About | Full SSR | Static content, fast render |
| Project List | Full SSR | SEO-critical listing page |
| Project Detail | Full SSR | Each project is a unique SEO landing page |
| Gallery | Hybrid | Render grid shell SSR, load images in browser |
| Contact | Hybrid | Form interactive client-side, static content SSR |
| Payment Calculator | Hybrid | Calculator client-side, static content SSR |
| Blog List | Full SSR | SEO-critical content |
| Blog Article | Full SSR | SEO-critical content |
| Construction Updates | Full SSR | SEO + transparency |
| Sadat Guide | Full SSR | Heavy SEO page |
| Investors | Full SSR | SEO for investor keywords |
| FAQ | Full SSR | FAQPage schema for rich snippets |

### SSR-Safe Patterns

- Use `PlatformService.isBrowser` before accessing `window`, `document`, `localStorage`
- Use `@defer` blocks for heavy client-side components (calculator, maps, lightbox)
- Use Transfer State to avoid duplicate API calls (server → browser)
- Use `afterNextRender()` for DOM-dependent initialization
