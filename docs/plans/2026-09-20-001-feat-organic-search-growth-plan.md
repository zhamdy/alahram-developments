---
title: "feat: Organic Google Search growth — indexing, LCP and Arabic relevance"
type: feat
status: completed
date: 2026-09-20
---

> **Implementation status (2026-09-20).** P0, P1, P2 and P3 are done and verified
> in production. Two findings contradicted this plan and the code follows the
> evidence, not the text: the projects tree was broken by a relative API base URL
> resolving against localhost during prerender, not by Cloudflare serving;
> and `hero-bg-*.webp` is a different photograph, not a WebP of the hero, so the
> variants had to be generated. P0-2 (trailing-slash internal links) was
> deliberately not done — see `CLAUDE.md` Learnings. Remaining open items are the
> Arabic prose for §5.2 and the follow-ups listed in `CLAUDE.md`.

# feat: Organic Google Search growth — indexing, LCP and Arabic relevance

> **Plan only.** No code is changed by this document. Every claim below is tagged
> **A** (confirmed from repository/code), **B** (confirmed from Search Console data supplied by the
> user), or **C** (hypothesis requiring validation). See §14 for the consolidated split.

---

## 1. Executive summary

The site is technically healthy on the surface — Lighthouse SEO 100, valid hreflang, valid
breadcrumbs, no manual actions, a working sitemap. The growth blockers are **not** the things a
Lighthouse SEO audit looks at. Evidence gathered from the live site and the repository points to
four real constraints:

**1. The entire projects tree is effectively unindexable in production. (A + C)**
Every zone URL and every project-detail URL on the live site returns the wrong document:

| Live URL | HTTP | `<title>` | `<link rel=canonical>` | What is actually served |
|---|---|---|---|---|
| `/ar/projects/zone-21/` | 200 | `الأهرام للتطوير العقاري` | `…/ar/` | the prerendered **homepage** (`ng-server-context="ssg"`, hero `<h1>` = company name) |
| `/ar/projects/al-rawda/` … ×7 zones | 200 | brand only | `…/ar/` | same |
| `/ar/projects/zone-21/project-584/` | 200 | `الأهرام للتطوير العقاري \| Al-Ahram Developments` (the `src/index.html` default) | **none** | an un-hydrated client shell |

The local build of the current HEAD produces these pages **correctly**
(`dist/alahram-developments/browser/ar/projects/zone-21/index.html` has
`<h1>المنطقة ٢١ (المنطقة الذهبية)</h1>` and its own canonical), so this is a deploy/serving fault,
not a source fault. 52 URLs (7 zones + 19 projects, × 2 locales) — the commercial core of the
site — are either duplicates of the homepage or empty shells. This alone accounts for most of the
**34 "Alternate page with proper canonical tag"** and the **10 "Crawled – currently not
indexed"** buckets. **(B)**

**2. Roughly half of all crawled URLs are redirects, caused by a one-character convention
mismatch. (A)** Cloudflare Pages normalises **to** a trailing slash:

```
/ar/about   → 308 → /ar/about/   (200)
/ar/blog    → 308 → /ar/blog/    (200)
/en/projects→ 308 → /en/projects/(200)
```

The sitemap and every `<link rel=canonical>` correctly use the trailing-slash form. But every
**internal link** does not: `LocalizeRoutePipe` (`src/app/shared/pipes/localize-route.pipe.ts`)
emits `/ar/about`, and every `BreadcrumbList` JSON-LD `item` URL also omits the slash. Google
therefore discovers ~168 slash-less URLs from crawling the site itself, each of which 308s. That is
the direct explanation for **148 "Page with redirect"** against 168 sitemap URLs. **(B)** It is not
a ranking penalty, but it halves effective crawl budget and dilutes every internal link.

**3. Mobile LCP is 8.5 s because ~1.4–2.0 MB of high-priority bytes compete for the first
paint. (A)** The measured chain, in priority order:

- `src/index.html:30-36` preloads **`hero-bg-*.webp` — an asset the page never renders** (the hero
  `<img>` uses `hero-*.png`). ~153 KB downloaded at `fetchpriority=high` and discarded. The
  preload also has **no `href`**, so it is invalid in Firefox/Safari and the *real* LCP image gets
  no preload at all.
- The header logo is preloaded with `priority`: `public/logo.png` is **414 KB at 2939×2463 px**,
  rendered at ~96 px tall.
- The actual LCP image is an **8-bit palette PNG**: `hero-1024w.png` 373 KB / `hero-1672w.png`
  912 KB — while correctly-sized WebP versions of the same frame already sit unused on disk at
  65/153/363 KB.
- 8 `modulepreload`ed chunks ≈ 479 KB uncompressed.
- The HTML document is **319 KB, of which 253 KB (79 %) is the inlined `ar.json` transfer state**.
- No `public/_headers` file exists, so assets are served `max-age=14400, must-revalidate`
  (measured) instead of `immutable`.
- No `preconnect` to `unpkg.com` or `googletagmanager.com`, both hit from `<head>`.

FCP 2.9 s / LCP 8.5 s is exactly the signature of "text paints from inlined critical CSS, then the
page waits ~5.6 s for a bitmap".

**4. The pages that should own the Sadat City intents are thin in crawlable HTML. (A)**

- The **homepage** server-renders only **1,108 characters of visible text**. Sections 3 and 5–10
  (`why-us`, `zones-showcase`, `gallery-preview`, `projects-mosaic`, `lifestyle-strip`,
  `cta-banner`, `location-map`) are all `@defer (on viewport)` and are absent from the prerendered
  payload. The crawlable homepage is: nav + hero + three counters + one brand-story paragraph +
  footer.
- Those three counters render as literal **`0 مشاريع متميزة` / `+0 وحدة سكنية` / `+0 عميل سعيد`**
  in the prerendered HTML (`trust-bar.component.ts` initialises `signal(0)` and only counts up in
  `afterNextRender`). The real values (21 / 300 / 260) never reach crawlable markup. Confirmed in
  the live document.
- `/ar/sadat-city-maps/` — the strongest organic asset **(B)** — has **~95 words of unique prose**
  and 36 table rows whose anchor text is the identical string «تحميل الخريطة». No per-zone
  description, no visible breadcrumb, and exactly **two** outbound links (one to `/projects`, one
  to WhatsApp).
- Every page title is **double-suffixed**: `من نحن | الأهرام للتطوير العقاري | الأهرام للتطوير العقاري`
  (77 chars, truncated in SERPs). `SeoService.updateSeo` appends the brand while every
  `seo.*.title` key already contains it. The **homepage has no title key at all** — it renders as
  the bare brand name, wasting the single most valuable title on the site.

Nothing here requires a redesign or a JavaScript rewrite. The work is: fix the serving of the
projects tree, align one URL convention, fix four image/preload mistakes, and put real Arabic
content into the HTML that is already being crawled.

---

## 2. Current architecture

### Metadata

| Concern | Where |
|---|---|
| Single entry point | `src/app/core/services/seo.service.ts` → `updateSeo(data: SeoData)` |
| Title composition | `seo.service.ts:38-42` — `data.title ? \`${data.title} | ${brand}\` : brand` |
| Canonical | `seo.service.ts:122-135` — creates/updates/removes one `<link rel=canonical>` |
| hreflang | `seo.service.ts:137-159` — removes all, re-adds `ar`, `en`, `x-default`→`ar` by regex locale swap |
| OG / Twitter | `seo.service.ts:56-100` — `og:*` incl. image dimensions; `twitter:card/title/description/image` |
| JSON-LD | `clearJsonLd()` `seo.service.ts:111-113` removes **every** `script[type=application/ld+json]`; `addJsonLd()` `:115-120` appends |
| Copy source | `src/assets/i18n/ar.json` / `en.json` under `seo.*` (title / description / keywords per page) |
| Static head | `src/index.html` — default title, default description, `og:site_name`, a hardcoded `WebSite` JSON-LD block (lines 14-25), the hero preload (30-36), unpkg Lottie (37-40), GA4 (41-48) |

All of this runs through Angular `Title`/`Meta`/`DOCUMENT`, so it executes during prerender — meta
**is** server-rendered on every prerendered route.

### Routes

- `src/app/app.routes.ts` — `admin` (no locale), legacy non-locale redirects, an Arabic-slug alias
  `خارطة-مدينة-السادات`, then everything under `:locale` guarded by
  `src/app/core/guards/locale.guard.ts` (accepts only `ar`/`en`), then `**` → `NotFoundComponent`.
- Public routes: `''`, `projects`, `projects/:zoneSlug`, `projects/:zoneSlug/:slug`, `about`,
  `contact`, `gallery`, `blog`, `blog/:slug`, `sadat-guide`, `sadat-city-maps`, `construction`,
  `privacy`.
- `src/app/app.routes.server.ts` — `RenderMode.Prerender` for all public locale routes via
  `getPrerenderParams`; `RenderMode.Client` for `admin/**`, legacy paths and `**`.
  `LOCALES = ['ar','en']`; zones/projects from `src/app/content-manifest.json`; **`BLOG_SLUGS` is a
  hardcoded 48-entry array** (lines 13-62) — the one remaining hand-maintained list.
- Prerender emits **172** pages. The sitemap emits **168** URLs. GSC's "172 discovered" matches the
  prerender count, not the sitemap.

### SSR / rendering

Angular 21 SSR with full prerendering, deployed to Cloudflare Pages
(`wrangler.toml` → `pages_build_output_dir = dist/alahram-developments/browser`).
`public/_routes.json` includes only `/api/*` and `/uploads/*`, so **no server code can set an HTTP
status for any page route** — 404/soft-404 behaviour is entirely determined by static assets plus
`public/_redirects`. `src/server.ts` (Express) is the Docker path only and is not used in
production.

Critical CSS is inlined by Beasties (36 KB in the document) and `styles-*.css` (89 KB) is loaded
non-blocking via `media="print" onload`. **CSS is already not render-blocking.**

### Sitemap and robots

- `scripts/generate-sitemap.js` — `BASE_URL = https://www.alahram-developments-sadat.com`,
  10 static routes + zones + projects + 48 blog slugs, × 2 locales. Trailing slash is hardcoded at
  lines 111/114/119. Emits `xhtml:link` alternates (`ar`, `en`, `x-default`) inside every `<url>`.
- `lastmod`: `today` for static routes and zones; `project.lastUpdatedAt || today` for projects;
  scraped `date:` from `blog.data.ts` for posts. Measured max `lastmod` on the live sitemap =
  **2026-09-20**, i.e. the build date — so `lastmod` is largely meaningless as a change signal.
- `public/robots.txt` — `Allow: /`, disallows `/api/`, `/assets/icons/`, `/404`; declares the
  sitemap. `/assets/maps-pdf/` is crawlable.
- **`public/_headers` does not exist.**

### Schema

`src/app/shared/helpers/seo.helper.ts`, seven builders, **none of which emits an `@id`**:

| Builder | `@type` | Used by |
|---|---|---|
| `buildWebSiteSchema` | `WebSite` | home |
| `buildOrganizationSchema` | `RealEstateAgent` | home |
| `buildLocalBusinessSchema` | `RealEstateAgent` | contact |
| `buildProjectSchema` | `RealEstateListing` | project detail |
| `buildSadatMapsSchema` | `ItemList` | sadat-city-maps |
| `buildBreadcrumbSchema` | `BreadcrumbList` | 12 pages |
| `buildFaqSchema` | `FAQPage` | sadat-guide |

Blog detail hand-writes its own `BlogPosting` (the only schema in the repo with an `@id` and an
`inLanguage`).

### i18n

Transloco, `ar` default + RTL. `src/app/core/services/i18n.service.ts` sets `<html lang/dir>` via
injected `DOCUMENT` (works on the server — `/en/` pages correctly ship `lang="en" dir="ltr"`,
verified live). `LocalizeRoutePipe` (`pure: false`) prefixes every `routerLink` with the locale.
Locale comes from the URL via `localeGuard`; `localStorage` is written but never read.

### Images

Plain `<img srcset>` for the hero (`hero-section.component.html:3-15`), `NgOptimizedImage` with
`priority` for the header logo. Assets are copied by the `angular.json` glob and are therefore
**not content-hashed** — stable URLs, no long-lived cache headers.

### Content / data

- Zones and projects come from the **live API at runtime**
  (`projects-api.service.ts`, `catchError(() => of([]))`), and from
  `src/app/content-manifest.json` (7 zones, 19 projects) at build time for prerender + sitemap.
  `src/app/features/projects/data/projects.data.ts` is legacy and unused by rendered pages.
- Blog: 48 posts in `src/app/features/blog/data/blog.data.ts`, bodies in `ar.json`, uniformly
  6 paragraphs, 229–464 Arabic words, no H2s, no in-body links, no images beyond the hero.
- Maps: 36 zones in `sadat-maps.component.ts:17-52` → 41 PDFs in `src/assets/maps-pdf/` (5 orphans:
  `6/7/12/14/15.pdf`).

---

## 3. Search Console findings mapped to code

| GSC finding | Count | Mapped cause | Evidence |
|---|---|---|---|
| Sitemap discovered | 172 | Matches the **prerender** count in `app.routes.server.ts`, not the sitemap (`public/sitemap.xml` = 168 `<loc>`). Likely a stale GSC read or a prior build. | A |
| Alternate page with proper canonical tag | 34 | Live zone pages serve the **homepage** with `canonical → /ar/`; the Arabic-slug alias and locale pairs add more. | A (live) |
| Soft 404 | 2 | `public/_redirects:51-54` rewrites `/ar\|/en/projects/:zone/:slug[/]` → `/index.csr` **200**. Verified: `/ar/projects/fake-zone/fake-slug/` returns **200**. | A (live) |
| Crawled – currently not indexed | 10 | Project-detail URLs serving an empty CSR shell with the default title and **no canonical** — nothing worth indexing. | A (live) |
| Page with redirect | 148 | Slash-less internal links (`LocalizeRoutePipe`, breadcrumb JSON-LD) 308 to the trailing-slash canonical; plus legacy `_redirects` double hops (`/about` → `/ar/about/` → …) and `/` → `/ar/`. | A (live) |
| Not found (404) | 10 | `/خارطة-مدينة-السادات` and `/ar\|/en/خارطة-مدينة-السادات` — prerender-declared but never emitted and not in `_redirects` (verified **404**); renamed map PDFs; re-slugged projects (`350288d`, `19c4667`). | A (live) |
| Duplicate without user-selected canonical | 0 | Healthy — canonicals are present and self-consistent on prerendered pages. | B |
| Breadcrumb valid, 1 item | — | The homepage-served zone pages carry the homepage's schema. On real pages `buildBreadcrumbSchema` emits ≥2. Re-inspect after §7 lands. | C |
| CWV: not enough data | — | Low traffic. Use Lighthouse/PSI until CrUX fills. | B |

### Classification

**1 — Expected / healthy:** `/` → `/ar/`; the retired-feature 301s (`/faq`, `/payment-plans`,
`/investors`, `/units`); `admin/*`; apex→www and http→https (Cloudflare zone rules, outside the
repo); 0 duplicate-without-canonical.

**2 — Harmless cleanup:** the legacy double hops (`/about` → `/ar/about/` → 200 is already correct
— the second hop only exists for slash-less legacy targets); orphan PDFs `6/7/12/14/15.pdf`;
`Disallow: /404` (a no-op, no such URL); dead i18n keys `seo.paymentPlans.*`, `seo.investors.*`,
`header.investors`, `header.paymentPlans`, `sadatMaps.cta.projects`, `sadatMaps.cta.guide`.

**3 — Genuine SEO issue:** zone + project pages serving the wrong document (P0-1); the
`/index.csr 200` soft-404 rewrite (P0-3); the trailing-slash split between internal links and
canonical (P0-2); the Arabic-slug URL hard-404 (P2); double-suffixed titles; homepage counters at
`0`; blog pages 2–6 uncrawlable.

**4 — Needs URL-level GSC investigation:** the exact 10 URLs in "Not found", the exact 2 in "Soft
404", and the exact 10 in "Crawled – not indexed". Export them before implementation so the fixes
can be verified against real URLs rather than inferred ones.

### Why 148 redirects against 168 sitemap URLs

Not the sitemap's fault. Measured behaviour:

```
https://www.alahram-developments-sadat.com/ar/about   → 308 → /ar/about/   → 200
https://alahram-developments-sadat.com/ar/            → 301 → www          → 200
http://www.alahram-developments-sadat.com/ar/         → 301 → https        → 200
https://www.alahram-developments-sadat.com/projects   → 301 → /ar/projects/→ 200
```

Ranked contributors:

1. **Slash-less internal links** — `LocalizeRoutePipe` returns `['/', locale, ...segments]`, so
   Angular renders `/ar/about`. Google crawls what the site links, gets a 308 on ~168 URLs.
   *This is the dominant source.*
2. **Breadcrumb JSON-LD `item` URLs** — built without the trailing slash on every page, e.g.
   `about.component.ts:84-85`, contradicting the canonical two lines above.
3. Legacy non-locale paths (11 rules) and the retired-feature paths (20 rules) in `_redirects`.
4. Root `/` → `/ar/`.
5. Apex and `http://` (Cloudflare zone-level; not in the repo).
6. `localeGuard` client-redirecting any unknown first segment to `/ar` — a JS soft redirect.

Not contributors: HTTP/HTTPS misconfiguration, route aliases beyond the Arabic slug, or old project
slugs (those land on the `200` rewrite, not a redirect).

---

## 4. Prioritized opportunities

### P0 — serious indexing / crawl / canonical

| # | Issue | Evidence |
|---|---|---|
| P0-1 | 52 zone + project URLs serve the homepage or an empty CSR shell in production | A (live) |
| P0-2 | Internal links and breadcrumb JSON-LD use the slash-less form; canonical and sitemap use the trailing-slash form → ~148 redirect URLs | A (live) |
| P0-3 | `/index.csr 200` rewrites turn any invalid project slug into a soft 404 | A (live) |

### P1 — high-impact ranking / performance

| # | Issue |
|---|---|
| P1-1 | Hero LCP: wrong preload target, no `href`, palette PNG instead of the existing WebP, 414 KB logo preloaded at high priority |
| P1-2 | No `public/_headers` → no immutable caching on Cloudflare Pages |
| P1-3 | Every `<title>` double-suffixed and truncated; homepage title is the bare brand |
| P1-4 | Homepage server-renders 1,108 chars; 7 of 10 sections are `@defer (on viewport)` |
| P1-5 | Trust-bar counters render `0` in crawlable HTML |
| P1-6 | `/ar/sadat-city-maps/` — the striking-distance page — has ~95 words of unique prose, identical anchor text ×36, 2 outbound links, no visible breadcrumb |
| P1-7 | Blog pages 2–6 (39 of 48 posts) unreachable without JS — pagination has no URL state |
| P1-8 | 253 KB of inlined `ar.json` transfer state in every HTML document |

### P2 — meaningful improvement

| # | Issue |
|---|---|
| P2-1 | Schema: no `@id` anywhere; two conflicting `RealEstateAgent` nodes + a third inline copy; `ItemList` entries have no `url`; `RealEstateListing.offers` has currency but no price; locale-less schema URLs that 301 |
| P2-2 | NAP inconsistency: `tel:` links use the **WhatsApp** number on about/project-detail; schema `telephone` is the WhatsApp number; two different map coordinates ~5 km apart; footer address omits «دار مصر مول» |
| P2-3 | `robots`, `description`, `og:image` are never cleared between client navigations (`seo.service.ts`) — the 404 page's `noindex` persists |
| P2-4 | `clearJsonLd()` destroys the static `WebSite` block from `index.html` on every non-home page |
| P2-5 | Meta descriptions: `sadatMaps` 219 chars (ar) / 217 (en) truncate; `home` 82 chars (ar) wastes half the snippet |
| P2-6 | Breadcrumb component missing on `sadat-city-maps`, zone, project-detail, blog-list (schema present, no visible trail) |
| P2-7 | `/خارطة-مدينة-السادات` hard-404s in all three forms |
| P2-8 | `/construction` is a sitemap orphan — zero inbound `routerLink` |
| P2-9 | Below-fold PNGs: `lifestyle-strip.png` 3.47 MB, `brand-story.png` 2.51 MB, `breadcrumb.png` 2.28 MB, `cta.png` 2.19 MB; unused `hero.png` 2.6 MB + `hero-bg.jpg` 2.55 MB shipped |
| P2-10 | `switchLocale` does not refresh title/description/JSON-LD (component reuse), and drops the trailing slash |

### P3 — optional / later

`keywords` meta removal (ignored by Google, up to 224 chars/page); dead i18n keys; orphan PDFs;
`resetSeo()` dead code; `--font-mono` referencing unloaded fonts; `preconnect` to unpkg/GTM;
moving Lottie off unpkg; `SearchAction` (only if a real site search is built); `staging.` host
crawl protection.

---

## 5. Page-level SEO plan

### 5.1 Arabic homepage — `/ar/`

- **Intent:** brand + «شركة تطوير عقاري في مدينة السادات» + entry point to projects/zones.
- **Current issues:** title = bare brand; description 82 chars; 1,108 chars of crawlable text;
  counters at `0`; 7 of 10 sections deferred out of the SSR payload; no `og:image`; `h2` count = 1.
- **Proposed:** add `seo.home.title` (Arabic, ≤60 chars, leading with the company + مدينة السادات);
  lengthen `seo.home.description` to ~150 chars and fix the `اسعار`→`أسعار` typo; render the
  `zones-showcase` and `why-us` sections eagerly (or `@defer (on idle)` with a **server-rendered
  placeholder carrying the real text**) so zone names and the value proposition are crawlable;
  emit the real counter values in the SSR HTML and let GSAP animate *from* 0 to the rendered value;
  add a default `og:image`.
- **Affected code:** `src/assets/i18n/{ar,en}.json` (`seo.home.*`), `src/app/features/home/home.component.html`,
  `src/app/features/home/components/trust-bar/trust-bar.component.{ts,html}`,
  `src/app/core/services/seo.service.ts` (default `og:image`), `src/index.html`.
- **Why it helps:** the homepage is the strongest-authority page on the domain and currently gives
  Google almost nothing to associate with «مدينة السادات» beyond one paragraph. A crawlable
  zone list also creates 7 high-authority internal links that do not exist today.

### 5.2 Sadat City maps — `/ar/sadat-city-maps/` (highest priority page)

- **Intent:** «خريطة مدينة السادات» / «خرائط مدينة السادات» / «مناطق مدينة السادات» — informational,
  already ranking at the page-1/2 boundary. **(B)**
- **Current issues:** ~95 words of unique prose; 36 identical anchors «تحميل الخريطة»; H2 «المنطقة /
  الخريطة» is a table header, not a keyword; `ItemList` entries carry `name` but no `url`; no
  visible breadcrumb; only 2 outbound links; `seo.sadatMaps.description` is 219 chars (truncates)
  and advertises «المنطقة الـ 32», for which no PDF exists; two unused CTA translation keys already
  written for the links that are missing.
- **Proposed:**
  - Rewrite `seo.sadatMaps.title` / `description` to ≤60 / ≤155 chars, leading with the exact query
    phrasing.
  - Change anchor text from «تحميل الخريطة» to «تحميل خريطة {zone.label} PDF» — 36 unique,
    naturally keyword-bearing anchors, no stuffing.
  - Add a short factual paragraph (2–3 sentences) per zone group (المناطق الرقمية / الأشرطة المميزة /
    الأحياء), not per zone, describing location relative to المحور المركزي and the main services.
    This is the difference between a link list and a reference page.
  - Add the visible `<ahram-breadcrumbs>` component (already exists, already used on 7 pages).
  - Wire the two unused CTA keys: link to `/sadat-guide` and to `/projects`.
  - Add contextual links from each zone row that has a matching zone page (`zone-21`, `zone-22`,
    `zone-29`, `zone-35`, `zone-14`, `al-rawda`, `zone-7-strip`) and a matching blog post
    (`sadat-city-zone-21-guide`, `sadat-city-golden-zone-guide`,
    `sadat-city-distinguished-district`, …).
  - Give `ItemList` entries a `url` pointing at the PDF.
  - Remove the reference to منطقة 32 or add the missing PDF.
  - **Do not** add an FAQ block here unless real user questions exist — `sadat-guide` already owns
    the `FAQPage`.
- **Affected code:** `src/app/features/sadat-maps/sadat-maps.component.{ts,html}`,
  `src/assets/i18n/{ar,en}.json` (`sadatMaps.*`, `seo.sadatMaps.*`),
  `src/app/shared/helpers/seo.helper.ts` (`buildSadatMapsSchema`), `src/assets/maps-pdf/`.
- **Why it helps:** a page at position 8–15 with thin content and no differentiated anchors is the
  classic profile for "impressions without clicks". Unique anchors + real prose + internal links
  from higher-authority pages is the standard lever, and it is available here without inventing
  content.

### 5.3 Projects listing — `/ar/projects/`

- **Intent:** «مشاريع مدينة السادات» / «عقارات مدينة السادات».
- **Current issues:** title double-suffixed to 69 chars; **670 chars** of crawlable text; H1 is
  «مناطق المشاريع» (generic — no city); zone cards are API-driven and render nothing if the API is
  slow at prerender time.
- **Proposed:** H1 → a phrase containing مدينة السادات; add a 2–3 sentence intro above the zone
  grid; ensure the zone list is present in the prerendered HTML (it depends on P0-1 being fixed);
  add a contextual link to `/sadat-city-maps/`.
- **Affected code:** `src/app/features/projects/projects-list/projects-list.component.html`,
  `src/assets/i18n/{ar,en}.json`.

### 5.4 Individual project pages — `/ar/projects/:zone/:slug/`

- **Intent:** long-tail «شقق للبيع في المنطقة 21» etc.
- **Current issues:** **not served at all in production** (P0-1); one-sentence descriptions;
  `RealEstateListing.offers` has `priceCurrency` + `availability` but **no price**;
  `floorSize` is passed an array of `QuantitativeValue` with string `value`s; schema `url` omits the
  locale (`/projects/...` → 301); no visible breadcrumb.
- **Proposed:** fix serving first, then: add price or remove `offers`; fix `floorSize`; add the
  locale to the schema `url`; add `<ahram-breadcrumbs>`; expand descriptions to 2–3 sentences
  including the zone name.
- **Affected code:** `public/_redirects`, `src/app/shared/helpers/seo.helper.ts:46-91`,
  `src/app/features/projects/project-detail/project-detail.component.{ts,html}`, admin content.

### 5.5 Sadat guide — `/ar/sadat-guide/`

Already the richest page in the repo (8 zone cards, a price-comparison table, an 8-question
`FAQPage`). Issues: title 77 chars after double-suffixing; **not linked from the desktop nav** —
only the mobile menu and the footer. Proposed: fix the title, add it to the desktop nav or link it
contextually from the homepage and `/sadat-city-maps/`.

### 5.6 About / Contact

About has ~300 words and is fine structurally. Contact is form-heavy with little prose. Both carry
the NAP problems in P2-2 — the `tel:` link on `about.component.html:138` uses the **WhatsApp**
number, and `buildLocalBusinessSchema` uses it as `telephone`. Fix NAP consistency across
`src/app/core/config/social.config.ts`, `seo.helper.ts:93-119`, the i18n address strings, and
`privacy.component.html:89` before doing anything else local-SEO related.

### 5.7 Blog

48 real Arabic posts averaging ~305 words, 6 plain paragraphs each, no H2s, no in-body links.
Pages 2–6 are unreachable without JS. Proposed: add `?page=` (or `/blog/page/N/`) URL state so all
48 posts are crawlable from `/blog/`; add 2–3 contextual in-body links per post (to the matching
zone page and to `/sadat-city-maps/`); add H2 subheadings to the longer posts. Enrich `BlogPosting`
with `wordCount`, `keywords`, `publisher.logo`, and type `author` correctly.

### 5.8 English equivalents

Everything above applies to `/en/*` for correctness, not for growth. Specific English-only items:
`en.about.description` 181 chars, `en.projects.description` 175, `en.sadatMaps.description` 217 —
all truncate. Several schema builders hardcode Arabic `name` values that are emitted on English
pages (`buildWebSiteSchema`, `buildOrganizationSchema`, `buildSadatMapsSchema`).

---

## 6. Technical SEO plan (exact files)

| Change | File(s) |
|---|---|
| Fix zone/project serving | `public/_redirects` (narrow or remove the `/index.csr 200` rewrites), `public/_routes.json`, CI redeploy of `src/app/app.routes.server.ts` output |
| Trailing-slash convention | `src/app/shared/pipes/localize-route.pipe.ts`, `src/app/shared/helpers/seo.helper.ts` (`buildBreadcrumbSchema`), all `_redirects` targets, `src/app/core/services/i18n.service.ts` (`switchLocaleUrl`) |
| Title double-suffix | `src/app/core/services/seo.service.ts:38-42` **or** strip the brand from every `seo.*.title` key in `src/assets/i18n/{ar,en}.json` — pick one, not both |
| Homepage title | `src/assets/i18n/{ar,en}.json` (`seo.home.title`), `src/app/features/home/home.component.ts:45` |
| Meta hygiene (clear `robots`/`description`/`og:image` on change) | `src/app/core/services/seo.service.ts:47-104` |
| Preserve `WebSite` schema site-wide | `src/app/core/services/seo.service.ts:111-113`, `src/index.html:14-25` |
| Arabic-slug alias 404 | `public/_redirects` (add a 301), `src/app/app.routes.server.ts:133-137` (drop the prerender entry that never emits) |
| Sitemap `lastmod` | `scripts/generate-sitemap.js:11,78-104` — use real content timestamps, not build date |
| Blog slug drift | `src/app/app.routes.server.ts:13-62` — derive `BLOG_SLUGS` from `blog.data.ts` instead of hardcoding |
| `_headers` | **create** `public/_headers` |
| robots.txt | `public/robots.txt` — drop the `/404` no-op; keep `/assets/maps-pdf/` crawlable |
| Schema `@id` + entity consolidation | `src/app/shared/helpers/seo.helper.ts` (all builders), `src/app/shared/helpers/seo.helper.spec.ts` (assertions lock the current shape and will need updating) |

---

## 7. Indexing cleanup plan

| Bucket | Count | Verdict | Action |
|---|---|---|---|
| Alternate page with proper canonical | 34 | **Genuine issue** — zone pages serve the homepage and canonicalize to `/ar/` | Fix P0-1, redeploy, then URL-inspect 3 zone URLs and request indexing |
| Soft 404 | 2 | **Genuine issue** — `_redirects` 200-rewrite for invalid project slugs | Remove or narrow the `/ar\|/en/projects/:zone/:slug` → `/index.csr 200` rules so unknown slugs fall through to a real 404. If the "content added between builds" case must keep working, gate it on a slug that exists in `content-manifest.json`, or shorten the build cadence. **Decision needed — see §15.** |
| Crawled – not indexed | 10 | **Genuine issue** — project-detail URLs serve an empty shell with no canonical | Same fix as P0-1; re-request indexing after redeploy |
| Page with redirect | 148 | **Genuine but non-urgent** — crawl-budget waste, not a penalty | Align internal links + breadcrumb JSON-LD to the trailing-slash form (P0-2). Expect the bucket to shrink over 4–8 weeks as Google re-crawls. Keep the legacy 301s — they are correct. |
| Not found (404) | 10 | **Mixed** — the Arabic-slug alias is a real 404 for a URL the site once exposed; renamed PDFs and re-slugged projects are expected attrition | Add a 301 for `/خارطة-مدينة-السادات` (all three forms) → `/ar/sadat-city-maps/`; export the real 10 URLs from GSC before deciding on the rest |
| Duplicate without user-selected canonical | 0 | **Healthy** | No action |

Sitemap review: all 168 URLs are canonical, trailing-slash, HTTP 200, split evenly `ar`/`en`, with
504 `xhtml:link` alternates. No redirects and no 404s are present in the sitemap. The two real
defects are (a) `lastmod` = build date for most URLs, and (b) `BLOG_SLUGS` being hand-maintained in
`app.routes.server.ts` while the sitemap scrapes `blog.data.ts`.

---

## 8. Performance plan — the 8.5 s mobile LCP

**LCP element:** the hero `<img>` in
`src/app/features/home/components/hero-section/hero-section.component.html:3-15`. It is a plain
`<img>`, not a CSS background, not inside `@defer`, and it **is** in the prerendered HTML — so this
is a bytes-and-priority problem, not a hydration problem. `ahramAnimate` is applied only to the
`<h1>`/`<p>`/CTA, never to the image.

**The blocking chain, in the order the browser encounters it:**

1. 319 KB HTML document, 253 KB of which is the inlined `ar.json` transfer state.
2. `index.html:30-36` preload of `hero-bg-1024w.webp` (~153 KB) at `fetchpriority=high` — **wrong
   asset, never rendered**, and invalid without `href`.
3. Header-logo preload of `public/logo.png` — **414 KB at 2939×2463** for a 96 px render.
4. 8 `modulepreload` chunks ≈ 479 KB.
5. The real LCP image: `hero-1024w.png` 373 KB (or `hero-1672w.png` 912 KB), 8-bit palette PNG,
   **not preloaded**.
6. `Cache-Control: public, max-age=14400, must-revalidate` (measured) — re-validated on every visit.
7. No `preconnect` to `unpkg.com` / `googletagmanager.com`.

**Ordered fixes, highest leverage first:**

| # | Fix | Expected effect |
|---|---|---|
| 1 | Point the `index.html` preload at the **actual** hero asset and give it a valid `href` + `imagesizes` | Removes ~153 KB of waste and makes the LCP image the first high-priority fetch |
| 2 | Serve the hero as AVIF/WebP via `<picture>` (WebP already on disk); generate AVIF | ~373 KB → ~60–90 KB |
| 3 | Resize `public/logo.png` to ~2× its render size and/or drop `priority` | Removes ~400 KB from the critical path |
| 4 | Create `public/_headers` with `immutable`, 1-year cache for `/assets/*`, `/*.js`, `/*.css`, `/*.woff2` | Removes the image from the critical path on repeat views |
| 5 | Exclude `/assets/i18n/*` from the HTTP transfer cache (`src/app/app.config.ts:23-26`) or ship a route-scoped translation bundle | 319 KB → ~70 KB HTML; directly improves FCP |
| 6 | `preload` `cairo-arabic.woff2`; add `preconnect` for `unpkg.com` + `googletagmanager.com` | Faster Arabic text paint |
| 7 | Drop `decoding="async"` on the LCP image | Removes one async decode hop |
| 8 | Re-encode the below-fold PNGs (P2-9) and delete `hero.png` / `hero-bg.jpg` | ~13 MB off the deploy; helps Speed Index |
| 9 | Move `gsap.registerPlugin` out of the eagerly-loaded `trust-bar` component | Small TBT win — do not pursue further; TBT 90 ms is already healthy |

**Explicitly do not touch:** critical-CSS inlining (already correct), the non-blocking stylesheet
(already correct), CLS 0.003, TBT 90 ms, or the `@defer` strategy for genuinely below-fold widgets
such as the maps embed.

**Target:** mobile LCP < 2.5 s is realistic once items 1–4 land, since the LCP would then be a
~70 KB image that is the first high-priority request on a warm CDN edge.

---

## 9. Arabic content plan

Pages to improve, in priority order. **No final marketing copy is written here.**

| Page | What to change | Why |
|---|---|---|
| `/ar/sadat-city-maps/` | New title + description; 36 unique zone-bearing anchors; 3 short group-level paragraphs; visible breadcrumb; links to zone pages + guide + related posts | Striking distance **(B)**; thin unique content is the gap |
| `/ar/` | `seo.home.title` (currently absent); description 82→~150 chars; fix `اسعار`→`أسعار`; crawlable zone list + why-us; real counter values in HTML | Highest-authority page, currently 1,108 crawlable chars |
| `/ar/projects/` | H1 to include مدينة السادات; 2–3 sentence intro; contextual link to the maps page | H1 «مناطق المشاريع» carries no city entity |
| `/ar/projects/:zone/` | 2–3 sentence zone description beyond the current one-liner; zone name in H1; link to the zone's map PDF | Owns «المنطقة 21 مدينة السادات»-type intents once serving is fixed |
| `/ar/sadat-guide/` | Title length; surface it in the desktop nav | Richest page, semi-orphaned on desktop |
| Blog posts | H2 subheadings; 2–3 in-body contextual links each | 305-word flat posts with zero internal links |
| All pages | Remove `keywords` meta; trim descriptions >160 chars; strip brand from title keys | CTR + snippet quality |

**Keyword → page mapping (one owner per intent, no cannibalisation):**

| Intent | Owner |
|---|---|
| خريطة مدينة السادات / خرائط مدينة السادات | `/ar/sadat-city-maps/` |
| مناطق مدينة السادات | `/ar/sadat-city-maps/` (list) with `/ar/sadat-guide/` as the narrative counterpart |
| مدينة السادات (general/informational) | `/ar/sadat-guide/` |
| مشاريع مدينة السادات / عقارات مدينة السادات | `/ar/projects/` |
| المطورين العقاريين في مدينة السادات | `/ar/` and `/ar/about/` |
| الاستثمار العقاري في مدينة السادات | existing posts `roi-calculation-sadat-city-property`, `sadat-city-property-market-2025-2026`, `commercial-unit-investment-sadat` — **consolidate the internal links onto one of these rather than creating a new page** |
| أراضي مدينة السادات | **No owner and no content.** The company sells units, not land. Do not create a page for this unless the business actually has land inventory. |
| المنطقة N بمدينة السادات | `/ar/projects/zone-N/`, supported by the matching blog post |

**New pages: none recommended at this stage.** `/ar/sadat-guide/` already covers «دليل مدينة
السادات»; `/ar/sadat-city-maps/` already covers «مناطق/خرائط»; investment intent is covered by
existing posts. Creating «الاستثمار العقاري في مدينة السادات» or «مشروعات الأهرام في مدينة السادات»
as separate pages now would compete with `/ar/projects/` and `/ar/sadat-guide/` and would be
doorway-shaped. Revisit after 8–12 weeks of Search Console data once the existing pages are fixed.

---

## 10. Internal linking plan

Current state: `/ar/sadat-city-maps/` is linked from exactly three places — the desktop nav, the
mobile menu, and the footer. **Zero contextual links.** It links out to exactly one internal page.
`/construction` has zero inbound links anywhere. 39 of 48 blog posts are reachable only from the
sitemap. `/sadat-guide` is absent from the desktop nav.

Proposed graph (contextual links only — no link blocks):

```
                       /ar/  (homepage)
                         │
      ┌──────────────────┼──────────────────┬─────────────────┐
      ▼                  ▼                  ▼                 ▼
 /ar/projects/     /ar/sadat-guide/   /ar/sadat-city-maps/  /ar/about/
      │                  │  ▲                │  ▲
      │                  │  └────────────────┤  │
      ▼                  ▼                   ▼  │
 /ar/projects/:zone/ ◄───────────────────────┘  │
      │        ▲                                │
      ▼        └────────────── /ar/blog/:slug ──┘
 /ar/projects/:zone/:slug/
```

Concrete additions:

1. **Homepage → maps** — one contextual link from the (newly crawlable) zones section:
   «شاهد خرائط مناطق مدينة السادات».
2. **Maps → zone pages** — per row, where a zone page exists (7 of 36).
3. **Maps → guide** and **maps → projects** — wire the two unused CTA keys.
4. **Guide → maps** — the guide already lists all 8 zones; link each to its map.
5. **Blog posts → maps / zone pages** — 2–3 in-body links per post, matched by subject.
6. **Zone page → its map PDF** and **zone page → its blog post**.
7. **Blog pagination with URL state** so all 48 posts are crawlable from `/ar/blog/`.
8. **`/construction` inbound link** from the homepage or projects page, or drop it from the sitemap.
9. **`/sadat-guide` in the desktop nav.**
10. All anchor text natural and varied; no repeated exact-match anchors.

---

## 11. Structured-data plan

**Keep as-is:** `BreadcrumbList` (correct shape, GSC-validated), `FAQPage` on `/sadat-guide`
(visible Q&A, 8 items — compliant), `BlogPosting` (the only well-formed schema in the repo).

**Change:**

| Schema | Change | Why |
|---|---|---|
| `buildOrganizationSchema` + `buildLocalBusinessSchema` | Merge into **one** `RealEstateAgent` with a stable `@id` (`{siteUrl}/#organization`), emitted site-wide; keep `geo` + `openingHoursSpecification`; use `SOCIAL_LINKS.phone` (not WhatsApp) as `telephone`; fix `streetAddress` (currently the city name duplicated into the street field) | Two nodes with the same `url` and no `@id` are unreconcilable; conflicting phone numbers weaken the local entity |
| `buildProjectSchema` | Reference the org by `@id` instead of inlining a third copy; add the locale to `url`; fix `floorSize` (single `QuantitativeValue`, numeric `value`); supply a real price or remove `offers` | An `AggregateOffer` with `priceCurrency` and no price is invalid |
| `buildWebSiteSchema` | Add `@id` (`{siteUrl}/#website`) and `publisher: {@id: …#organization}`; localise `name`; emit on **every** page | `clearJsonLd()` currently destroys the `index.html` copy on all non-home pages |
| `buildSadatMapsSchema` | Add `url` to each `ListItem`; localise `name`/`description` | The list currently points nowhere |
| `buildBreadcrumbSchema` | Use trailing-slash URLs to match the canonical | Part of P0-2 |
| `BlogPosting` | Add `wordCount`, `keywords`, `publisher` `@id` reference; type `author` as `Person` where it is a person | Article rich-result completeness |

**Add:** nothing else. Specifically **not** `AggregateRating` or `Review` (no legitimate review
data), **not** `SearchAction` (no site search exists), **not** `FAQPage` on additional pages
(no visible Q&A to back it), and **not** `Product`/`Offer` until real prices are published.

**Structural:** wrap the site-wide entities in a single `@graph` so `WebSite`, `RealEstateAgent`
and the page-level `WebPage`/`BreadcrumbList` reference each other by `@id` instead of repeating.

---

## 12. Validation plan

**Pre-deploy**

- `npm run build` succeeds; `npx tsc --noEmit` clean. (`npm run lint` is known broken repo-wide —
  ESLint 9 vs the installed angular-eslint builder; see `CLAUDE.md` Learnings.)
- `npx vitest run` — `src/app/shared/helpers/seo.helper.spec.ts` covers all seven builders and its
  assertions lock the current schema shapes; they must be updated alongside §11.
- Assert on the built output, not the source: grep `dist/alahram-developments/browser/ar/projects/zone-21/index.html`
  for its own `<title>`, its own canonical, and `<h1>المنطقة ٢١`.
- Grep every prerendered `index.html` for `>0<` inside the trust bar to confirm the counter fix.
- Confirm `sitemap.xml` URL count and that every `<loc>` has a matching file in `dist`.

**Post-deploy (live HTTP)**

- `curl -sI` each of: `/ar/`, `/ar/about/`, `/ar/projects/`, `/ar/projects/zone-21/`,
  `/ar/projects/zone-21/project-584/`, `/ar/sadat-city-maps/` → expect **200**, correct
  `<title>`, self-referencing canonical.
- `curl -sI /ar/about` → expect the 308 to persist (that is Cloudflare's normalisation) but confirm
  the site no longer *links* to the slash-less form: grep the prerendered HTML for
  `href="/ar/about"` and expect zero hits.
- `curl -sI /ar/projects/fake-zone/fake-slug/` → expect **404**, not 200.
- `curl -sI /خارطة-مدينة-السادات` → expect **301** to `/ar/sadat-city-maps/`.
- `curl -sI /assets/images/hero-*.avif` → expect `cache-control: public, max-age=31536000, immutable`.
- View-source `/ar/` and confirm: real counter values, zone names present, `og:image` present,
  single brand suffix in `<title>`.
- Rich Results Test + Schema.org validator on `/ar/`, `/ar/sadat-city-maps/`, `/ar/projects/zone-21/project-584/`,
  one blog post.
- hreflang: confirm reciprocity `ar ↔ en` on 3 pages and that no hreflang target redirects.
- Broken-link crawl (Screaming Frog or equivalent) — expect 0 internal 3xx after P0-2.
- Lighthouse mobile + PageSpeed Insights on `/ar/` — target LCP < 2.5 s, TBT ≤ 150 ms, CLS ≤ 0.01.

**Search Console**

- Resubmit `sitemap.xml`; URL-inspect and request indexing for `/ar/`, `/ar/projects/`,
  `/ar/sadat-city-maps/`, two zone URLs, two project URLs.
- **Before implementation:** export the actual URL lists behind the 10 404s, 2 soft 404s and
  10 crawled-not-indexed so the fixes can be verified against real URLs.

---

## 13. Post-deployment Search Console monitoring

**Day 7 — did the fixes land?**
- URL Inspection on 2 zone + 2 project URLs: "URL is on Google" with the *correct* canonical.
- Soft 404 count → expect 0.
- 404 count → expect the Arabic-slug URLs to drop out.
- Coverage: indexed URL count should begin rising from its current level.
- Not expected to move yet: impressions, clicks, position.

**Day 28 — is crawl behaviour healthier?**
- "Page with redirect" trending down from 148 (Google re-crawls slowly; a 30–50 % drop is a good
  signal, not a full clear).
- "Crawled – currently not indexed" trending toward 0.
- Indexed pages approaching ~168.
- Performance: impressions on non-brand queries; average position for «خريطة مدينة السادات» /
  «خرائط مدينة السادات»; CTR on `/ar/sadat-city-maps/` (the title/description rewrite should show
  here first).
- Compare branded vs non-branded query split against the pre-change baseline.

**Weeks 8–12 — did rankings move?**
- Page-level performance for `/ar/sadat-city-maps/`, `/ar/projects/`, `/ar/`, and each zone page.
- Queries at positions 4–20 with low CTR — the next round of title/description work.
- Whether zone and project pages have started accumulating impressions at all (they cannot today).
- Core Web Vitals: check whether CrUX now has enough data; if so, confirm mobile LCP in the field.
- Keyword cannibalisation check: for each target intent, confirm Google is ranking the intended
  owner page from §9.

**Baseline to capture before any change ships:** current impressions, clicks, CTR and average
position for the whole property and for `/ar/sadat-city-maps/`, plus the current values of all six
indexing buckets. Without this, none of the above is measurable.

---

## 14. Evidence classification

### A — Confirmed from repository / code (and live HTTP)

- Zone URLs serve the prerendered homepage (`ng-server-context="ssg"`, `<h1>` = company name,
  `canonical → /ar/`); project-detail URLs serve the `index.html` default title with no canonical.
  The local build of HEAD produces both correctly.
- Cloudflare Pages 308s slash-less → trailing-slash; sitemap and canonicals use trailing slash;
  `LocalizeRoutePipe` and breadcrumb JSON-LD use the slash-less form.
- `/ar/projects/fake-zone/fake-slug/` returns **200** via `public/_redirects:51-54`.
- `/خارطة-مدينة-السادات` and both locale forms return **404**.
- Every `<title>` carries the brand twice; `seo.home.title` does not exist.
- Trust-bar counters render `0` in the prerendered HTML.
- Homepage SSR visible text = 1,108 chars; 7 of 10 sections are `@defer (on viewport)`.
- `/ar/sadat-city-maps/` SSR visible text = 2,393 chars, of which ~95 words are unique prose;
  36 identical anchors; 2 outbound internal links.
- `index.html` preloads `hero-bg-*.webp` while the hero renders `hero-*.png`; the preload has no
  `href`. Measured asset sizes: hero PNGs 154/364/891 KB, WebP 64/150/355 KB, `logo.png` 414 KB.
- `Cache-Control: public, max-age=14400, must-revalidate` on `/assets/*`; no `public/_headers`.
- 253 KB of the 319 KB homepage document is the inlined `ar.json` transfer state.
- Sitemap: 168 `<loc>`, all trailing-slash, all 200, 84 `ar` / 84 `en`, 504 hreflang alternates,
  max `lastmod` = the build date.
- Prerender count = 172; `BLOG_SLUGS` is a hardcoded 48-entry array in `app.routes.server.ts`.
- No `@id` in any `seo.helper.ts` builder; two `RealEstateAgent` nodes; `ItemList` entries have no
  `url`; `RealEstateListing.offers` has no price; schema URLs omit the locale.
- NAP: `tel:` links on about/project-detail and schema `telephone` use the **WhatsApp** number;
  home and contact map embeds point ~5 km apart.
- Blog pagination has no URL state; 39 of 48 posts have no crawlable path from `/blog/`.
- `/construction` has zero inbound `routerLink`. `/sadat-guide` is not in the desktop nav.
- 5 orphan PDFs (`6/7/12/14/15.pdf`); `hero.png` (2.6 MB) and `hero-bg.jpg` (2.55 MB) shipped unused.

### B — Confirmed from Search Console data (as supplied)

- Sitemap submitted, status Success, 172 discovered, last read Jun 6 2026.
- Indexing buckets: 34 / 2 / 10 / 148 / 10 / 0.
- Inspected pages are indexed; HTTPS valid; breadcrumb structured data valid, 1 item.
- No manual actions.
- Core Web Vitals: insufficient field data, mobile and desktop.
- Mobile Lighthouse: Perf 65, A11y 100, BP 96, SEO 100; FCP 2.9 s, LCP 8.5 s, TBT 90 ms,
  CLS 0.003, SI 6.0 s.
- `/ar/sadat-city-maps/` is a significant impressions/clicks source; «خريطة/خرائط مدينة السادات»
  rank near the page-1/2 boundary.

> **No Search Console export exists in the repository.** The query-level, CTR and
> position-over-time analysis requested in the brief cannot be performed from repo data. All
> query-level statements above are the user's reported figures, not independently verified.

### C — Hypotheses requiring validation

- **Root cause of P0-1.** The symptom is confirmed live and the local build is correct. The cause is
  one of: (a) production is running an older or partially-uploaded deploy; (b) the
  `/ar|/en/projects/:zone[/:slug] → /index.csr 200` rules in `_redirects` shadow the prerendered
  assets on Cloudflare Pages; (c) the deploy was built while the content API was unreachable and
  `generate-content-manifest.js` fell back. **Validate by redeploying HEAD and re-running the
  §12 curl checks before changing any code.**
- That 34 "Alternate page with proper canonical" is predominantly the zone pages. Plausible
  (14 zone URLs + locale pairs + the alias) but the URL list must be exported to confirm.
- That 148 redirects is predominantly slash-less internal links. Strongly supported by the
  measured 308s and the link audit, but unproven without the GSC URL export.
- That GSC's "172 discovered" is stale rather than a second sitemap — the live sitemap has 168.
- Transloco timing during prerender: `translate()` is called synchronously in `ngOnInit` with no
  `APP_INITIALIZER`. No raw `seo.*` keys were observed in the live HTML, so this appears to work —
  but it is an unguarded dependency worth a build-output assertion.
- That mobile LCP reaches < 2.5 s after fixes 1–4. Realistic from the byte arithmetic, unproven
  until measured.
- Whether apex→www and http→https are Cloudflare zone rules (they are not in the repo) and whether
  `staging.alahram-developments-sadat.com` is publicly crawlable.

---

## 15. Decisions needed before implementation

1. **P0-1 first step.** Redeploy HEAD and re-verify before writing any code? (Recommended — the
   local build is already correct, so a redeploy may resolve 52 URLs for free and will tell us
   whether `_redirects` is the culprit.)
2. **Soft-404 rewrite.** The `/index.csr 200` rules exist so that content added via the admin panel
   between builds does not 404. Removing them fixes the soft 404s but re-breaks that case. Options:
   (a) remove the rules and rebuild on content change; (b) keep them only for slugs present in
   `content-manifest.json`; (c) keep them and accept the soft 404s. Which?
3. **Title de-duplication.** Strip the brand from the `seo.*.title` keys, or stop appending it in
   `SeoService`? (Recommended: strip it from the keys — `privacy` and `sadatMaps` already have no
   brand, so the service behaviour is the consistent one.)
4. **Hero image pipeline.** Hand-generate AVIF/WebP variants and commit them, or add a build step?
   There is no image-processing step in the repo today.
5. **Transfer-state bloat.** Excluding `/assets/i18n/*` from the HTTP transfer cache removes 253 KB
   per document but makes the client re-fetch translations after hydration (a brief flash risk).
   Acceptable?
6. **`/construction`.** Link it properly, or remove it from the sitemap? It has no inbound links and
   5 short timeline entries.
7. **Land inventory.** «أراضي مدينة السادات» is in the target keyword list but the site sells units,
   not land. Confirm whether land is actually sold before any page targets that intent.
8. **GSC URL exports.** Can you export the URL lists for the 10 404s, 2 soft 404s and
   10 crawled-not-indexed? Several classifications in §7 are inferred without them.

---

## 16. Sources & references

- Live HTTP evidence gathered 2026-09-20 against `https://www.alahram-developments-sadat.com`.
- Code: `src/app/core/services/seo.service.ts`, `src/app/shared/helpers/seo.helper.ts`,
  `src/app/app.routes.ts`, `src/app/app.routes.server.ts`, `scripts/generate-sitemap.js`,
  `scripts/generate-content-manifest.js`, `public/_redirects`, `public/_routes.json`,
  `public/robots.txt`, `src/index.html`, `src/app/features/home/**`,
  `src/app/features/sadat-maps/**`, `src/app/features/projects/**`, `src/app/features/blog/data/blog.data.ts`.
- Prior plans: `docs/plans/2026-05-24-001-feat-seo-google-rank-improvement-plan.md`,
  `docs/plans/2026-04-30-001-feat-expand-blog-content-and-seo-plan.md`, `docs/SEO-CODE-ROADMAP.md`
  (predates the domain change — treat its snippets as historical).
