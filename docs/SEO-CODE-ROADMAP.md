# Al-Ahram Developments -- SEO & Code Quality Improvement Roadmap

## Table of Contents

1. [Overview & Current Score](#overview--current-score)
2. [Phase 1: Critical SEO Fixes (Week 1)](#phase-1-critical-seo-fixes-week-1)
   - [1.1 Add hreflang alternate links for ar/en](#11-add-hreflang-alternate-links-for-aren)
   - [1.2 Complete Organization schema](#12-complete-organization-schema)
   - [1.3 Add LocalBusiness schema for Google Maps](#13-add-localbusiness-schema-for-google-maps)
   - [1.4 Add twitter:site meta tag](#14-add-twittersite-meta-tag)
   - [1.5 Fix hero image alt text](#15-fix-hero-image-alt-text)
   - [1.6 Add articleBody to BlogPosting schema](#16-add-articlebody-to-blogposting-schema)
3. [Phase 2: High Priority (Week 2)](#phase-2-high-priority-week-2)
   - [2.1 Centralize base URL](#21-centralize-base-url)
   - [2.2 Add og:image dimensions](#22-add-ogimage-dimensions)
   - [2.3 Improve robots.txt directives](#23-improve-robotstxt-directives)
   - [2.4 Remove console.warn/log from production code](#24-remove-consolewarnlog-from-production-code)
4. [Phase 3: Accessibility & UX (Week 3)](#phase-3-accessibility--ux-week-3)
   - [3.1 Add skip-to-content link](#31-add-skip-to-content-link)
   - [3.2 Add aria-hidden to decorative SVGs](#32-add-aria-hidden-to-decorative-svgs)
   - [3.3 Add aria-label to language toggle button](#33-add-aria-label-to-language-toggle-button)
   - [3.4 Add preconnect for Google Analytics](#34-add-preconnect-for-google-analytics)
   - [3.5 Add image error fallbacks](#35-add-image-error-fallbacks)
5. [Phase 4: Advanced SEO (Week 4)](#phase-4-advanced-seo-week-4)
   - [4.1 Dynamic sitemap generation at build time](#41-dynamic-sitemap-generation-at-build-time)
   - [4.2 Centralize social links in config](#42-centralize-social-links-in-config)
   - [4.3 Complete BlogPosting schema fields](#43-complete-blogposting-schema-fields)
   - [4.4 Remove single-item breadcrumb from home page](#44-remove-single-item-breadcrumb-from-home-page)
6. [Positive Findings](#positive-findings)
7. [Validation Checklist](#validation-checklist)

---

## Overview & Current Score

This roadmap captures 20 actionable improvements discovered during an SEO and code quality audit. Issues are organized into 4 phases by priority. Each item includes the problem, its impact, the specific fix, and the files to modify.

**Audit Summary:**

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 6 | Missing hreflang, incomplete schemas, empty alt text |
| High | 4 | Hardcoded URLs, missing OG dimensions, weak robots.txt |
| Medium | 5 | Accessibility gaps, missing preconnect, no image fallbacks |
| Low | 5 | Sitemap generation, social config, breadcrumb cleanup |

**Current Strengths:** SSR with prerendering, canonical URLs on all pages, JSON-LD structured data, proper noindex on 404, comprehensive sitemap, good aria-label usage on theme toggle and mobile menu.

---

## Phase 1: Critical SEO Fixes (Week 1)

### 1.1 Add hreflang alternate links for ar/en — DONE

**Status:** Implemented via path-based locale routing.

**Implementation:** `SeoService.updateHreflang()` is called automatically by `updateSeo()` and generates 3 `<link>` tags per page:

```html
<link rel="alternate" hreflang="ar" href="https://alahram-developments.com/ar/projects" />
<link rel="alternate" hreflang="en" href="https://alahram-developments.com/en/projects" />
<link rel="alternate" hreflang="x-default" href="https://alahram-developments.com/ar/projects" />
```

The sitemap also includes `<xhtml:link>` hreflang alternates for all 32 URLs (16 routes x 2 locales).

---

### 1.2 Complete Organization schema

**Problem:** The Organization/RealEstateAgent schema in `seo.helper.ts` (lines 1-21) is missing `email`, `sameAs` (social media links), and `ContactPoint` properties. Google's Rich Results validator flags these as recommended fields.

**Impact:** Reduced Knowledge Panel eligibility. Google uses `sameAs` to verify social profiles and `ContactPoint` for customer service info.

**Files:**
- `src/app/shared/helpers/seo.helper.ts` (lines 1-21, `buildOrganizationSchema`)

**Fix:** Add the missing properties to the returned schema object:

```typescript
export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'الأهرام للتطوير العقاري',
    alternateName: 'Al-Ahram Developments',
    url: 'https://alahram-developments.com',
    logo: 'https://alahram-developments.com/assets/images/logo.jpg',
    telephone: '+201031198677',
    email: 'info@alahram-developments.com',  // Add actual email
    sameAs: [
      'https://www.facebook.com/AlAhramDevelopments',  // Add actual URLs
      'https://www.instagram.com/alahram_developments',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+201031198677',
      contactType: 'sales',
      areaServed: 'EG',
      availableLanguage: ['Arabic', 'English'],
    },
    address: { /* ...existing... */ },
    areaServed: { /* ...existing... */ },
  };
}
```

---

### 1.3 Add LocalBusiness schema for Google Maps

**Problem:** The site uses `RealEstateAgent` but lacks a `LocalBusiness` schema with `geo` coordinates. Google Maps and local search rely on this for place cards.

**Impact:** The business won't appear in Google Maps local pack results or "near me" searches.

**Files:**
- `src/app/shared/helpers/seo.helper.ts` (add new function)
- `src/app/features/contact/contact.component.ts` (line 24, add JSON-LD call)

**Fix:** Add a new helper function:

```typescript
export function buildLocalBusinessSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'الأهرام للتطوير العقاري',
    url: 'https://alahram-developments.com',
    telephone: '+201031198677',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'مدينة السادات',
      addressLocality: 'مدينة السادات',
      addressRegion: 'المنوفية',
      addressCountry: 'EG',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 30.0376,   // Replace with actual coordinates
      longitude: 30.3713,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '09:00',
      closes: '18:00',
    },
  };
}
```

Add to the contact page: `this.seo.addJsonLd(buildLocalBusinessSchema());`

---

### 1.4 Add twitter:site meta tag

**Problem:** Twitter Card tags are set (lines 72-84 in `seo.service.ts`) but `twitter:site` is missing. This tag identifies the site's Twitter/X handle.

**Impact:** Tweets sharing site links won't show the site's handle in the card, reducing brand attribution.

**Files:**
- `src/app/core/services/seo.service.ts` (line 72, after `twitter:card`)

**Fix:** Add a single line after line 72:

```typescript
this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
this.meta.updateTag({ name: 'twitter:site', content: '@AlAhramDev' }); // Add actual handle
```

---

### 1.5 Fix hero image alt text

**Problem:** The hero background image at `hero-section.component.html:4` has an empty `alt=""`. While decorative images can use empty alt, this is the primary hero image and conveys meaning.

**Impact:** Screen readers skip the image entirely. Google Image Search cannot index it with relevant keywords.

**Files:**
- `src/app/features/home/components/hero-section/hero-section.component.html` (line 4)

**Fix:** Add a descriptive, translated alt attribute:

```html
<img
  ngSrc="assets/images/hero-bg.jpg"
  [alt]="t('home.hero.imageAlt')"
  fill
  priority
  class="absolute inset-0 object-cover"
/>
```

Add to translation files:
- `ar.json`: `"home.hero.imageAlt": "مشروعات الأهرام للتطوير العقاري في مدينة السادات"`
- `en.json`: `"home.hero.imageAlt": "Al-Ahram Developments real estate projects in Sadat City"`

---

### 1.6 Add articleBody to BlogPosting schema

**Problem:** The BlogPosting JSON-LD in `blog-detail.component.ts` (lines 53-72) includes `headline` and `description` but omits `articleBody`. Google recommends this field for article rich results.

**Impact:** Reduced eligibility for Google's article rich results and Top Stories carousel.

**Files:**
- `src/app/features/blog/blog-detail/blog-detail.component.ts` (lines 53-72)

**Fix:** Add `articleBody` with the translated full article content. Since blog posts use translation keys, translate the content sections:

```typescript
this.seo.addJsonLd({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  description: excerpt,
  articleBody: this.transloco.translate(post.contentKey),  // Add this line
  // ...rest of existing fields
});
```

If the post data doesn't have a single `contentKey`, concatenate the relevant section keys.

---

## Phase 2: High Priority (Week 2)

### 2.1 Centralize base URL

**Problem:** The string `https://alahram-developments.com` is hardcoded in 30+ locations across 10 files. This makes environment switching (staging vs production) error-prone and violates DRY.

**Impact:** Risk of broken canonical URLs and schema data in staging. Any domain change requires updating 30+ locations.

**Files affected (all containing hardcoded URLs):**
- `src/app/shared/helpers/seo.helper.ts` (lines 7, 8, 23)
- `src/app/features/home/home.component.ts` (lines 40, 44)
- `src/app/features/contact/contact.component.ts` (lines 25, 28, 29)
- `src/app/features/about/about.component.ts` (lines 60, 63, 64)
- `src/app/features/projects/projects-list/projects-list.component.ts` (lines 27, 30, 31)
- `src/app/features/projects/project-detail/project-detail.component.ts` (lines 49, 50, 55-57)
- `src/app/features/blog/blog-list/blog-list.component.ts` (lines 58, 62, 65)
- `src/app/features/blog/blog-detail/blog-detail.component.ts` (lines 43, 50, 58, 70, 76, 79, 88, 93)
- `src/app/features/gallery/gallery.component.ts` (lines 70, 73, 74)
- `src/app/features/privacy/privacy.component.ts` (lines 23, 26, 27)

**Fix:** Use the existing environment config:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  siteUrl: 'https://alahram-developments.com',  // Add this
};
```

Then import and use across all files:

```typescript
import { environment } from '@env';
// Replace: 'https://alahram-developments.com'
// With:    environment.siteUrl
```

Update `seo.helper.ts` to accept `baseUrl` as a parameter or import from environment.

---

### 2.2 Add og:image dimensions — DONE

**Status:** Implemented. `SeoData` interface includes `ogImageWidth`, `ogImageHeight`, and `ogImageAlt`. Defaults to 1200x630 if not specified. `SeoService.updateSeo()` sets `og:image:width`, `og:image:height`, and `og:image:alt` meta tags.

---

### 2.3 Improve robots.txt directives

**Problem:** The current `public/robots.txt` (4 lines) only has `Allow: /`. It doesn't block crawlers from non-content paths like `/api/`, asset directories, or the 404 page.

**Impact:** Search engines may waste crawl budget on non-content URLs.

**Files:**
- `public/robots.txt`

**Fix:** Expand with targeted directives:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /assets/icons/
Disallow: /404

Sitemap: https://alahram-developments.com/sitemap.xml
```

> Note: Do not disallow `/assets/images/` — images need to be crawlable for Google Image Search.

---

### 2.4 Remove console.warn/log from production code

**Problem:** Production code contains `console.warn` calls in `storage.helper.ts` (lines 21, 31) and `console.error` in `error.interceptor.ts` (line 35). While the `server.ts` and `main.ts` logs are acceptable (bootstrap/startup), client-side console output leaks internal details.

**Impact:** Minor information disclosure; clutters browser console for developers inspecting the site.

**Files:**
- `src/app/shared/helpers/storage.helper.ts` (lines 21, 31)
- `src/app/core/interceptors/error.interceptor.ts` (line 35)

**Fix:** Remove `console.warn` from storage helper — the `catch` blocks can be empty (silent fail is acceptable for localStorage). For the error interceptor, consider using a proper logging service or guard with `!environment.production`:

```typescript
// storage.helper.ts — remove console.warn, keep empty catch
catch {
  // Silent fail: localStorage unavailable (SSR, private browsing, quota exceeded)
}

// error.interceptor.ts — guard with environment check
if (!environment.production) {
  console.error(`[API Error] ${req.method} ${req.url}:`, errorMessage);
}
```

---

## Phase 3: Accessibility & UX (Week 3)

### 3.1 Add skip-to-content link

**Problem:** `app.component.html` (line 1-10) has no skip-to-content link. Keyboard users must tab through the entire header and navigation on every page.

**Impact:** WCAG 2.1 Level A failure (Success Criterion 2.4.1). Screen reader and keyboard users experience significant friction.

**Files:**
- `src/app/app.component.html` (line 1, before `<ahram-header>`)
- `src/styles.css` (add utility class)

**Fix:**

```html
<!-- app.component.html -->
<div class="flex min-h-screen flex-col bg-background text-foreground font-body">
  <a href="#main-content" class="skip-to-content">Skip to content</a>
  <ahram-header />
  <main id="main-content" class="flex-1">
    <router-outlet />
  </main>
  <ahram-footer />
  @defer {
    <ahram-whatsapp-button />
  }
</div>
```

```css
/* styles.css */
.skip-to-content {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
  z-index: 9999;
}
.skip-to-content:focus {
  position: fixed;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  height: auto;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  font-weight: 600;
  border-radius: 0.5rem;
  text-decoration: none;
}
```

Add translation keys for the link text in both `ar.json` and `en.json`.

---

### 3.2 Add aria-hidden to decorative SVGs

**Problem:** Inline SVGs in `header.component.html` (lines 84, 86, 99, 101) for theme toggle and mobile menu icons don't have `aria-hidden="true"`. Screen readers announce the raw SVG paths.

**Impact:** Screen readers read meaningless SVG markup. The parent buttons already have `aria-label`, so the SVGs are decorative.

**Files:**
- `src/app/core/layout/header/header.component.html` (lines 84, 86, 99, 101)

**Fix:** Add `aria-hidden="true"` to each `<svg>` element:

```html
<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" ...>
```

---

### 3.3 Add aria-label to language toggle button

**Problem:** The language toggle button at `header.component.html` (lines 68-74) has no `aria-label`. The button text alternates between "EN" and "عربي", which doesn't convey purpose to screen readers.

**Impact:** Screen readers announce "EN button" or "عربي button" without indicating that clicking switches the site language.

**Files:**
- `src/app/core/layout/header/header.component.html` (lines 68-74)

**Fix:**

```html
<button
  type="button"
  (click)="i18n.toggleLocale()"
  [attr.aria-label]="t('header.toggleLanguage')"
  class="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
>
  {{ i18n.locale() === 'ar' ? 'EN' : 'عربي' }}
</button>
```

Add translation keys:
- `ar.json`: `"header.toggleLanguage": "تغيير اللغة إلى الإنجليزية"`
- `en.json`: `"header.toggleLanguage": "Switch language to Arabic"`

---

### 3.4 Add preconnect for Google Analytics

**Problem:** `index.html` (line 14-15) has preconnect hints for Google Fonts but not for Google Analytics (`googletagmanager.com`). The GA script (line 18) loads from a different origin.

**Impact:** The GA script fetch incurs a DNS lookup + TLS handshake delay that could be eliminated with preconnect.

**Files:**
- `src/index.html` (after line 15, before the GA script)

**Fix:** Add preconnect before the GA script tag:

```html
<link rel="preconnect" href="https://www.googletagmanager.com" />
```

---

### 3.5 Add image error fallbacks

**Problem:** No global error handling for broken images. If an `ngSrc` image 404s, the browser shows the broken image icon.

**Impact:** Poor UX when images fail to load (CDN issues, wrong paths). No visual fallback.

**Files:**
- `src/app/shared/directives/` (new directive)
- Component templates using `<img>` (optional per-component adoption)

**Fix:** Create a shared directive for image fallback:

```typescript
@Directive({
  selector: 'img[ahramFallback]',
  standalone: true,
})
export class ImageFallbackDirective {
  fallbackSrc = input<string>('assets/images/placeholder.jpg', { alias: 'ahramFallback' });

  @HostListener('error', ['$event'])
  onError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== this.fallbackSrc()) {
      img.src = this.fallbackSrc();
    }
  }
}
```

Apply selectively to project/gallery images where broken images are most impactful.

---

## Phase 4: Advanced SEO (Week 4)

### 4.1 Dynamic sitemap generation at build time — DONE

**Status:** Implemented as `scripts/generate-sitemap.js`. Runs automatically via `npm run prebuild`.

**Implementation:** The script reads project slugs from `projects.data.ts` and blog entries from `blog.data.ts`, then generates `public/sitemap.xml` with:
- Both locale variants (`/ar/...` and `/en/...`) for every route
- `<xhtml:link>` hreflang alternates (ar, en, x-default) per URL entry
- Dynamic `lastmod` dates from blog post dates
- Appropriate `changefreq` and `priority` values

**Output:** 32 URLs (16 routes x 2 locales) with full hreflang alternate links.

**Command:** `node scripts/generate-sitemap.js`

---

### 4.2 Centralize social links in config

**Problem:** Social media URLs (Facebook, Instagram, WhatsApp) are scattered across templates and helper files. Adding a new platform or changing a URL requires updating multiple files.

**Impact:** Maintenance burden. Risk of inconsistent URLs across schema markup, footer, and share buttons.

**Files:**
- `src/app/core/config/` (new config file)
- `src/app/shared/helpers/seo.helper.ts` (consume config)
- Footer and share components (consume config)

**Fix:** Create a central config:

```typescript
// src/app/core/config/social.config.ts
export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/AlAhramDevelopments',
  instagram: 'https://www.instagram.com/alahram_developments',
  whatsapp: '+201031198677',
  twitter: '@AlAhramDev',
  email: 'info@alahram-developments.com',
} as const;
```

Import from this config in `seo.helper.ts` for `sameAs`, in the footer, and in share button components.

---

### 4.3 Complete BlogPosting schema fields

**Problem:** The BlogPosting schema in `blog-detail.component.ts` (lines 53-72) is missing several recommended fields: `wordCount`, `inLanguage`, `keywords`, and `publisher.logo`.

**Impact:** Google's structured data guidelines recommend these fields for maximum rich result eligibility.

**Files:**
- `src/app/features/blog/blog-detail/blog-detail.component.ts` (lines 53-72)

**Fix:** Add the missing properties:

```typescript
this.seo.addJsonLd({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  description: excerpt,
  articleBody: this.transloco.translate(post.contentKey),
  wordCount: this.transloco.translate(post.contentKey).split(/\s+/).length,
  inLanguage: this.transloco.getActiveLang() === 'ar' ? 'ar-EG' : 'en-US',
  keywords: post.tags?.join(', '),
  publisher: {
    '@type': 'Organization',
    name: 'الأهرام للتطوير العقاري',
    url: 'https://alahram-developments.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://alahram-developments.com/assets/images/logo.jpg',
    },
  },
  // ...rest of existing fields
});
```

---

### 4.4 Remove single-item breadcrumb from home page

**Problem:** `home.component.ts` (lines 43-45) adds a `BreadcrumbList` with only one item (Home). Google's documentation states that a breadcrumb list should have at least 2 items to be meaningful.

**Impact:** Google may ignore the breadcrumb structured data or flag it as an error in Search Console.

**Files:**
- `src/app/features/home/home.component.ts` (lines 43-45)

**Fix:** Remove the breadcrumb JSON-LD from the home page:

```typescript
ngOnInit(): void {
  this.seo.updateSeo({
    title: this.transloco.translate('seo.home.title'),
    description: this.transloco.translate('seo.home.description'),
    keywords: this.transloco.translate('seo.home.keywords'),
    canonicalUrl: 'https://alahram-developments.com',
  });
  this.seo.addJsonLd(buildOrganizationSchema());
  // Remove: this.seo.addJsonLd(buildBreadcrumbSchema([...]));
}
```

---

## Positive Findings

These areas are already well-implemented and should be maintained:

| Area | Details |
|------|---------|
| **SSR + Prerendering** | 15 static routes prerendered at build time (root + 7 per locale); dynamic routes server-rendered |
| **Canonical URLs** | Every page sets `canonicalUrl` via `SeoService.updateSeo()` |
| **JSON-LD Structured Data** | Organization, RealEstateListing, BlogPosting, and BreadcrumbList schemas on relevant pages |
| **404 noindex** | `not-found.component.ts:19` correctly sets `robots: 'noindex, nofollow'` |
| **Comprehensive Sitemap** | Auto-generated sitemap with 32 URLs (16 routes x 2 locales) and xhtml:link hreflang alternates |
| **NgOptimizedImage** | All images use `ngSrc` with `fill`/`sizes` and `priority` for above-the-fold |
| **Twitter Card setup** | `summary_large_image` card type with title, description, and image |
| **Open Graph basics** | `og:title`, `og:description`, `og:type`, `og:locale`, `og:site_name` all set |
| **Theme toggle a11y** | Theme button has `[attr.aria-label]="t('header.toggleTheme')"` |
| **Mobile menu a11y** | Hamburger button has `aria-label` and `aria-expanded` |
| **Bundle size** | 397 KB initial bundle (106 KB transferred) — well under budget |
| **SEO title suffix** | Locale-aware suffix: Arabic = `الأهرام للتطوير العقاري`, English = `Al-Ahram Developments` |
| **JSON-LD cleanup** | `clearJsonLd()` called automatically by `updateSeo()` to prevent stale data |

---

## Validation Checklist

After implementing each phase, validate with these tools:

| Tool | What to Check | URL |
|------|---------------|-----|
| Google Rich Results Test | JSON-LD schemas (Organization, BlogPosting, BreadcrumbList, LocalBusiness) | https://search.google.com/test/rich-results |
| Schema.org Validator | Full schema validation with warnings | https://validator.schema.org/ |
| Facebook Sharing Debugger | og:image rendering, dimensions, alt text | https://developers.facebook.com/tools/debug/ |
| Twitter Card Validator | Card preview with twitter:site handle | https://cards-dev.twitter.com/validator |
| Google PageSpeed Insights | Preconnect impact, image loading, CLS | https://pagespeed.web.dev/ |
| WAVE Accessibility Tool | Skip link, aria-hidden, aria-label coverage | https://wave.webaim.org/ |
| Google Search Console | hreflang errors, sitemap status, breadcrumb errors | https://search.google.com/search-console |
| aXe DevTools | WCAG 2.1 Level A/AA compliance | Browser extension |

**Per-phase validation:**

- [ ] **Phase 1:** Run Rich Results Test on homepage, blog detail, and contact pages. Verify hreflang in page source.
- [ ] **Phase 2:** Search codebase for remaining hardcoded `alahram-developments.com`. Test og:image on Facebook Debugger. Check robots.txt via `https://alahram-developments.com/robots.txt`.
- [ ] **Phase 3:** Tab through site with keyboard — verify skip link appears on focus. Run WAVE on header. Check preconnect in DevTools Network waterfall.
- [ ] **Phase 4:** Verify sitemap auto-generates on build. Check Google Search Console for breadcrumb warnings on home page.
