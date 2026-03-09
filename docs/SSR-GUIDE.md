# Angular SSR Guide

This guide covers Server-Side Rendering in the Al-Ahram Developments project. The application uses Angular 21 with Express, `provideClientHydration()`, HTTP Transfer State, and event replay to deliver fast initial page loads with full SEO support.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [SSR Configuration Files](#ssr-configuration-files)
3. [Client Hydration](#client-hydration)
4. [HTTP Transfer State](#http-transfer-state)
5. [Event Replay](#event-replay)
6. [Server Route Configuration](#server-route-configuration)
7. [Platform Detection](#platform-detection)
8. [Browser-Only Code Patterns](#browser-only-code-patterns)
9. [Deferred Loading with @defer](#deferred-loading-with-defer)
10. [SEO Meta Tags](#seo-meta-tags)
11. [Structured Data (JSON-LD)](#structured-data-json-ld)
12. [Performance Tips](#performance-tips)
13. [Common Pitfalls](#common-pitfalls)

---

## Architecture Overview

The SSR pipeline works as follows:

1. A request hits the Express server (`src/server.ts`).
2. `AngularNodeAppEngine` renders the Angular application on the server.
3. The rendered HTML is sent to the client with serialized HTTP responses (Transfer State).
4. The browser bootstraps the Angular app and **hydrates** the existing DOM instead of re-creating it.
5. User events captured during hydration are **replayed** after the app is interactive.

```
Client Request
     |
     v
Express (server.ts)
     |
     v
AngularNodeAppEngine.handle(req)
     |
     v
Angular renders on Node.js (main.server.ts + app.config.server.ts)
     |
     v
HTML + Transfer State serialized into response
     |
     v
Browser receives HTML, bootstraps app (main.ts + app.config.ts)
     |
     v
Hydration: reuses existing DOM nodes
     |
     v
Event Replay: queued user interactions fire
```

---

## SSR Configuration Files

### `src/server.ts` -- Express Server

This is the Node.js entry point. It creates an Express app, serves static files from the built browser bundle, and delegates all other requests to the Angular SSR engine.

```typescript
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const app = express();
const angularApp = new AngularNodeAppEngine();

// Serve static files with 1-year cache
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

// All other requests go through Angular SSR
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) throw error;
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
```

Key points:
- Static assets are served directly by Express with aggressive caching (`maxAge: '1y'`).
- The `AngularNodeAppEngine` handles Angular route rendering.
- `isMainModule` check allows the file to work both as a standalone server and as a handler for cloud functions.
- The default port is `4000`.

### `src/main.server.ts` -- Server Bootstrap

```typescript
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;
```

This exports the bootstrap function that the SSR engine calls for each request.

### `src/app/app.config.server.ts` -- Server-Specific Providers

```typescript
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

The server config merges with the shared `appConfig` and adds `provideServerRendering` with server-specific route rendering configuration.

### `angular.json` Build Configuration

The build is configured as a server-output application:

```json
{
  "build": {
    "builder": "@angular/build:application",
    "options": {
      "browser": "src/main.ts",
      "server": "src/main.server.ts",
      "outputMode": "server",
      "ssr": {
        "entry": "src/server.ts"
      }
    }
  }
}
```

- `outputMode: "server"` tells Angular to produce both a browser bundle and a server bundle.
- `ssr.entry` points to the Express server file.

---

## Client Hydration

Hydration is configured in `src/app/app.config.ts`:

```typescript
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({ includePostRequests: true })
    ),
    // ...other providers
  ],
};
```

### What `provideClientHydration()` Does

Without hydration, the browser would destroy the server-rendered DOM and rebuild it from scratch. With hydration enabled:

1. Angular reuses the existing DOM nodes rendered by the server.
2. It attaches event listeners to the existing elements.
3. It reconciles the component tree without triggering unnecessary re-renders.

### When Hydration Fails

If the server and client render different content, Angular will log a hydration mismatch warning and fall back to destructive re-rendering for that subtree. Common causes:

- Using `Date.now()` or `Math.random()` in templates.
- Accessing `window` or `localStorage` during server rendering.
- Different data between server and client (solved by Transfer State).

To skip hydration for a specific component:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'ahram-dynamic-widget',
  host: { ngSkipHydration: 'true' },
  template: `<!-- browser-only content -->`,
})
export class DynamicWidgetComponent {}
```

Or in a template:

```html
<ahram-dynamic-widget ngSkipHydration />
```

---

## HTTP Transfer State

When `provideClientHydration()` is configured, Angular automatically serializes HTTP responses made during server rendering into a `<script>` tag in the HTML. On the client, the same HTTP requests are intercepted and served from the Transfer State cache instead of making duplicate network calls.

### Configuration

```typescript
provideClientHydration(
  withHttpTransferCacheOptions({ includePostRequests: true })
)
```

Setting `includePostRequests: true` means that POST requests (such as loading Transloco translation files or fetching initial data) are also cached in the Transfer State. Without this, only GET requests are cached by default.

### How It Works

1. **Server**: Angular intercepts all `HttpClient` requests and stores the responses.
2. **Serialization**: Responses are serialized into a JSON blob in a `<script type="application/json" id="ng-state">` tag.
3. **Client**: On bootstrap, Angular intercepts the same HTTP requests and returns the cached responses instantly.
4. **Cleanup**: After the Transfer State is consumed, the cache is cleared.

### Practical Example

```typescript
// This service makes an HTTP call. On the server, it fetches from the API.
// On the client, the response comes from Transfer State -- no duplicate request.
@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly api = inject(ApiService);

  getProjects(): Observable<ApiResponse<Project[]>> {
    return this.api.get<Project[]>('/projects');
  }
}
```

### Excluding Specific Requests from Transfer State

If a request should always be made fresh on the client (e.g., analytics, user-specific data):

```typescript
import { HttpContext } from '@angular/common/http';
import { NGSS_TRANSFER_CACHE } from '@angular/common/http';

this.http.get('/api/user/session', {
  context: new HttpContext().set(NGSS_TRANSFER_CACHE, false),
});
```

---

## Event Replay

```typescript
provideClientHydration(
  withEventReplay()
)
```

Event replay captures user interactions (clicks, input events, etc.) that occur **before** the application is fully hydrated. Once hydration completes, the captured events are replayed in order so the user does not lose any interactions.

This is critical for pages with interactive elements that appear above the fold. Without event replay, a user clicking a button before hydration completes would have their click silently dropped.

### How It Works

1. During server rendering, Angular injects a lightweight event capture script (`jsaction`) into the HTML.
2. This script listens for user events on the rendered DOM and queues them.
3. After hydration, Angular replays the queued events through the normal event handling pipeline.

---

## Server Route Configuration

`src/app/app.routes.server.ts` controls how each route is rendered. Routes use the `:locale` parameter to prerender both Arabic and English variants.

```typescript
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Root redirect
  { path: '', renderMode: RenderMode.Prerender },

  // Legacy redirects (server-rendered since they redirect)
  { path: 'projects', renderMode: RenderMode.Server },
  { path: 'about', renderMode: RenderMode.Server },
  // ...

  // Locale-prefixed static routes — prerender both ar and en
  {
    path: ':locale',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/projects',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  // ... same pattern for /about, /contact, /gallery, /blog, /privacy

  // Dynamic routes — SSR on each request
  { path: ':locale/projects/:slug', renderMode: RenderMode.Server },
  { path: ':locale/blog/:slug', renderMode: RenderMode.Server },

  // Catch-all
  { path: '**', renderMode: RenderMode.Server },
];
```

### Available Render Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `RenderMode.Server` | Full SSR on every request | Dynamic content, user-specific pages |
| `RenderMode.Prerender` | Pre-rendered at build time | Static pages (about, privacy) |
| `RenderMode.Client` | No SSR, client-only rendering | Authenticated dashboards, admin panels |

### Prerendering Both Locales

All static routes use `getPrerenderParams` to generate HTML for both `ar` and `en` locales at build time. This produces 15 prerendered routes:

| Route Pattern | Prerendered Files |
|---------------|-------------------|
| `:locale` | `/ar/index.html`, `/en/index.html` |
| `:locale/projects` | `/ar/projects/index.html`, `/en/projects/index.html` |
| `:locale/about` | `/ar/about/index.html`, `/en/about/index.html` |
| `:locale/gallery` | `/ar/gallery/index.html`, `/en/gallery/index.html` |
| `:locale/blog` | `/ar/blog/index.html`, `/en/blog/index.html` |
| `:locale/contact` | `/ar/contact/index.html`, `/en/contact/index.html` |
| `:locale/privacy` | `/ar/privacy/index.html`, `/en/privacy/index.html` |
| (root) | `/index.html` |

Each prerendered file has the correct `lang`/`dir` attributes and hreflang alternate links.

### Prerendering with Dynamic Parameters

For prerendering routes with multiple parameters (locale + slug):

```typescript
{
  path: ':locale/projects/:slug',
  renderMode: RenderMode.Prerender,
  async getPrerenderParams() {
    const slugs = ['project-a', 'project-b'];
    return slugs.flatMap(slug => [
      { locale: 'ar', slug },
      { locale: 'en', slug },
    ]);
  },
}
```

---

## Platform Detection

The project uses `PlatformService` to safely detect the runtime environment:

```typescript
// src/app/core/services/platform.service.ts
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly platformId = inject(PLATFORM_ID);

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  get isServer(): boolean {
    return isPlatformServer(this.platformId);
  }

  runInBrowser(fn: () => void): void {
    if (this.isBrowser) {
      fn();
    }
  }

  getWindow(): Window | null {
    return this.isBrowser ? window : null;
  }

  getDocument(): Document | null {
    return this.isBrowser ? document : null;
  }
}
```

### Usage

```typescript
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly platform = inject(PlatformService);

  trackPageView(url: string): void {
    this.platform.runInBrowser(() => {
      // Safe: only runs in the browser
      window.gtag('config', 'GA_MEASUREMENT_ID', { page_path: url });
    });
  }
}
```

---

## Browser-Only Code Patterns

### Pattern 1: Guard with PlatformService

```typescript
export class SomeComponent {
  private readonly platform = inject(PlatformService);

  ngOnInit(): void {
    this.platform.runInBrowser(() => {
      // Access localStorage, window, document, etc.
      const theme = localStorage.getItem('ahram-theme');
    });
  }
}
```

### Pattern 2: afterNextRender / afterRender

For code that must run after the component is rendered in the browser:

```typescript
import { Component, afterNextRender, ElementRef, inject } from '@angular/core';

@Component({
  selector: 'ahram-map',
  template: `<div #mapContainer class="h-[400px] w-full"></div>`,
})
export class MapComponent {
  private readonly el = inject(ElementRef);

  constructor() {
    afterNextRender(() => {
      // Runs once after the component is rendered in the browser
      // Safe to use browser APIs here
      const map = new google.maps.Map(this.el.nativeElement.querySelector('#mapContainer'), {
        center: { lat: 30.0444, lng: 31.2357 }, // Cairo
        zoom: 12,
      });
    });
  }
}
```

### Pattern 3: @defer for Heavy Browser Components

```typescript
@Component({
  template: `
    @defer (on viewport) {
      <ahram-interactive-gallery [images]="project.images" />
    } @placeholder {
      <div class="h-[400px] animate-pulse rounded-lg bg-muted"></div>
    } @loading (minimum 300ms) {
      <ahram-loading-spinner size="lg" />
    }
  `,
})
export class ProjectDetailComponent {}
```

### Pattern 4: Inject DOCUMENT Instead of Using `document` Directly

```typescript
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

export class SeoService {
  private readonly document = inject(DOCUMENT);

  updateCanonicalUrl(url: string): void {
    // This works on both server and browser because Angular
    // provides a server-compatible DOCUMENT token
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
```

### Pattern 5: Conditional Imports via Dynamic import()

For libraries that reference `window` at the module level:

```typescript
@Component({
  selector: 'ahram-chart',
  template: `<div #chart></div>`,
})
export class ChartComponent {
  constructor() {
    afterNextRender(async () => {
      const { Chart } = await import('chart.js');
      // Initialize chart here
    });
  }
}
```

---

## Deferred Loading with @defer

`@defer` blocks allow you to defer loading of components, directives, and pipes until a trigger condition is met. They are particularly useful in SSR because deferred content is not rendered on the server, reducing the initial HTML payload.

### Triggers

```html
<!-- Load when the block enters the viewport -->
@defer (on viewport) {
  <ahram-project-gallery />
}

<!-- Load after the browser is idle -->
@defer (on idle) {
  <ahram-recommendations />
}

<!-- Load after a timer -->
@defer (on timer(2s)) {
  <ahram-chat-widget />
}

<!-- Load on user interaction -->
@defer (on interaction(triggerElement)) {
  <ahram-filter-panel />
}

<!-- Load based on a condition -->
@defer (when isLoggedIn()) {
  <ahram-user-dashboard />
}
```

### Full @defer Block with All Slots

```html
@defer (on viewport) {
  <!-- Loaded and rendered -->
  <ahram-heavy-component />
} @placeholder (minimum 100ms) {
  <!-- Shown before the trigger fires -->
  <div class="h-64 rounded-lg bg-muted"></div>
} @loading (after 150ms; minimum 300ms) {
  <!-- Shown while the deferred chunk is loading -->
  <ahram-loading-spinner />
} @error {
  <!-- Shown if the chunk fails to load -->
  <p class="text-destructive">Failed to load content. Please refresh.</p>
}
```

### SSR Behavior of @defer

- `@placeholder` content **is** rendered on the server and included in the initial HTML.
- The deferred content itself is **not** rendered on the server.
- This means heavy components inside `@defer` do not affect server render time.

---

## SEO Meta Tags

The project uses `SeoService` to manage meta tags, which works correctly on both server and client:

```typescript
// src/app/core/services/seo.service.ts
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  updateSeo(data: SeoData): void {
    const fullTitle = data.title
      ? `${data.title} | الأهرام للتطوير العقاري`
      : 'الأهرام للتطوير العقاري | Al-Ahram Developments';

    this.title.setTitle(fullTitle);

    if (data.description) {
      this.meta.updateTag({ name: 'description', content: data.description });
    }

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: data.ogTitle ?? fullTitle });
    if (data.ogDescription ?? data.description) {
      this.meta.updateTag({
        property: 'og:description',
        content: (data.ogDescription ?? data.description)!,
      });
    }

    // Canonical URL
    this.updateCanonicalUrl(data.canonicalUrl);
  }
}
```

### Usage in a Page Component

Canonical and OG URLs must include the locale prefix:

```typescript
@Component({
  selector: 'ahram-project-detail',
  template: `...`,
})
export class ProjectDetailComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const project = this.route.snapshot.data['project'];
    const lang = this.i18n.locale();
    const siteUrl = 'https://alahram-developments.com';

    this.seo.updateSeo({
      title: project.name,
      description: project.description,
      ogImage: project.coverImage,
      ogUrl: `${siteUrl}/${lang}/projects/${project.slug}`,
      canonicalUrl: `${siteUrl}/${lang}/projects/${project.slug}`,
    });
  }
}
```

### Why This Works with SSR

`Title` and `Meta` services from `@angular/platform-browser` are platform-aware. On the server, they modify the rendered HTML string. On the client, they modify the live DOM. The tags set during SSR appear in the initial HTML response, which is what search engine crawlers see.

---

## Structured Data (JSON-LD)

The project includes a helper for generating JSON-LD structured data:

```typescript
// src/app/shared/helpers/seo.helper.ts
export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'الأهرام للتطوير العقاري',
    alternateName: 'Al-Ahram Developments',
    url: 'https://alahram-developments.com',
    logo: 'https://alahram-developments.com/assets/images/logo.png',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'القاهرة',
      addressCountry: 'EG',
    },
  };
}
```

### Adding JSON-LD to a Page

Use `SeoService.addJsonLd()` instead of the old `createJsonLd()` helper (which was removed):

```typescript
@Component({
  selector: 'ahram-home',
  template: `...`,
})
export class HomeComponent implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.addJsonLd(buildOrganizationSchema());
  }
}
```

`SeoService.updateSeo()` automatically calls `clearJsonLd()` before setting new meta tags, so JSON-LD is always fresh.

---

## Performance Tips

### 1. Use Transfer State for All Initial API Calls

Every HTTP request made during SSR that is not cached in Transfer State will be duplicated on the client. Make sure `provideClientHydration()` is configured and all data-fetching happens through `HttpClient`.

### 2. Defer Non-Critical Content

Use `@defer (on viewport)` or `@defer (on idle)` for components below the fold: galleries, reviews, maps, chat widgets.

### 3. Prerender Static Pages

Configure frequently visited static pages (home, about, contact) with `RenderMode.Prerender` to avoid SSR overhead on every request:

```typescript
{ path: '', renderMode: RenderMode.Prerender },
{ path: 'about', renderMode: RenderMode.Prerender },
```

### 4. Skip SSR for Authenticated Pages

Admin panels and authenticated dashboards gain nothing from SSR since crawlers cannot access them. Use `RenderMode.Client`:

```typescript
{ path: 'admin/**', renderMode: RenderMode.Client },
```

### 5. Minimize Server-Side DOM Manipulation

Avoid heavy DOM operations during server rendering. The server should produce the initial HTML as efficiently as possible.

### 6. Set Appropriate Cache Headers

The Express server already sets `maxAge: '1y'` for static assets. For SSR responses, consider adding cache headers:

```typescript
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => {
      if (response) {
        // Cache SSR responses for 5 minutes at the CDN level
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        writeResponseToNodeResponse(response, res);
      } else {
        next();
      }
    })
    .catch(next);
});
```

### 7. Use `ngSkipHydration` Sparingly

Only skip hydration for components that genuinely cannot be hydrated (e.g., third-party widgets that manipulate the DOM unpredictably). Skipping hydration loses the performance benefit for that subtree.

### 8. Avoid Synchronous Route Guards That Block Rendering

If an auth guard makes a synchronous check that returns `false` on the server (because there is no token), it may redirect the SSR response. Design guards to be SSR-aware:

```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const platform = inject(PlatformService);

  // On the server, allow rendering -- the client will handle auth
  if (platform.isServer) return true;

  if (auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/login']);
};
```

---

## Common Pitfalls

### Accessing `window`, `localStorage`, `document` Directly

**Problem**: These globals do not exist on the server.

**Solution**: Use `PlatformService.runInBrowser()`, `afterNextRender()`, or inject `DOCUMENT`.

### Different Content Between Server and Client

**Problem**: Hydration mismatch warnings.

**Solution**: Ensure the same data is used on both sides via Transfer State. Avoid `Date.now()` or locale-dependent formatting that differs between server and client environments.

### Heavy Imports at the Module Level

**Problem**: Libraries like Google Maps or chart libraries reference `window` at import time, crashing the server.

**Solution**: Use dynamic `import()` inside `afterNextRender()`.

### Not Running `npm run build` Before `npm run start:ssr`

The SSR server requires the production build output in `dist/`. Always build first:

```bash
npm run build
npm run start:ssr
```

During development, use `ng serve` which handles SSR automatically through the dev server.
