---
title: "feat: Editorial real-estate restyling of home page with new image-rich sections"
type: feat
status: active
date: 2026-04-29
---

# feat: Editorial real-estate restyling of home page with new image-rich sections

## Overview

Restyle the home page toward an editorial luxury real-estate aesthetic (magazine-style imagery, generous whitespace, refined typography, quiet-luxury palette) and introduce four new image-rich sections — a brand-story teaser anchored on the logo, a zones showcase, a projects mosaic, and a lifestyle/amenities strip — without redesigning the page from scratch.

## Problem Frame

The current home page (`src/app/features/home/home.component.html`) reads as a competent but generic developer site. It leans on a single hero image, a stats bar, value pillars, a small featured-projects swiper, a gallery preview, a CTA, and a map. There is no narrative anchor for the brand (no logo + story moment), no visual entry point into the eight Sadat City zones we sell into, and the imagery surface is small relative to a real-estate buyer's expectations. Editorial competitors (Emaar, SODIC) lead with photography, brand storytelling, and clearly merchandised neighborhoods.

## Requirements Trace

- R1. Restyle the existing home page to read as a luxury real-estate developer site (typography, whitespace, palette polish, imagery foreground), not a generic corporate page.
- R2. Add a brand-story teaser section that pairs the Al-Ahram logo with a short narrative paragraph and a strong photograph.
- R3. Add a zones / locations showcase section that visually merchandises the eight Sadat City zones and links into `/:locale/projects/:zoneSlug`.
- R4. Add an image-rich projects mosaic section (asymmetric/masonry) that surfaces additional projects beyond the existing `featured-projects` swiper.
- R5. Add a lifestyle / amenities strip that signals the family-buyer value proposition (schools, parks, transit, security) using existing iconography.
- R6. All new and restyled sections must be RTL-correct, SSR-safe, accessible (alt text, semantic landmarks, keyboard focus), and respect `prefers-reduced-motion`.
- R7. Reuse existing assets (`src/assets/images/projects/`, `src/assets/images/hero-bg-*.webp`, `src/assets/images/logo-transparent.png`, `src/assets/images/zones.webp`); do not block on new photography.

## Scope Boundaries

- **In-scope:** UI/UX work inside `src/app/features/home/` and supporting translation keys in `src/assets/i18n/{ar,en}.json`. New `home.data.ts` entries for zones/mosaic/lifestyle content. Optional small additions to `src/styles.css` for editorial utility classes.
- **Out-of-scope:** Backend/API changes. Header/footer redesign. Changes to project detail pages, zone listing pages, or the projects feature. New photography or brand assets (use existing). Testimonials section is not reactivated as part of this plan (currently commented out in `home.component.html`).
- **Non-goals:** Component-library changes (no new shadcn/Radix/Material adoption). New animation libraries. Dark-mode-only or light-mode-only styling — both must remain correct.

## Context & Research

### Relevant Code and Patterns

- `src/app/features/home/home.component.html` — current section ordering and `@defer (on viewport)` pattern.
- `src/app/features/home/components/hero-section/hero-section.component.{html,scss}` — hero with fixed-attachment background and overlay.
- `src/app/features/home/components/trust-bar/trust-bar.component.html` — count-up signal pattern with Lucide icons.
- `src/app/features/home/components/why-us/why-us.component.html` — 4-card grid pattern with `ahramAnimate` stagger (`[animateDelay]="i * 0.15"`).
- `src/app/features/home/components/featured-projects/` — Swiper element pattern; reference if mosaic uses any horizontal-scroll affordance.
- `src/app/features/home/components/gallery-preview/` — existing image-grid pattern; mirror its image sizing/lazy-loading approach.
- `src/app/features/home/data/home.data.ts` — typed data exports (`FEATURED_PROJECTS`, `VALUE_PILLARS`); add zone/mosaic/lifestyle/brand-story arrays here.
- `src/app/features/home/models/home.models.ts` — extend with new model interfaces.
- `src/app/features/projects/data/projects.data.ts` — `ZONES` array (8 zones, slugs + nameKeys + imageUrls) for zones showcase.
- `src/app/features/about/about.component.html` and the `about.story.*` translation namespace — source of brand-story copy and tone for R2's teaser.
- `src/app/shared/directives/scroll-animate.directive.ts` (`ahramAnimate`) — entry animations; reuse rather than introduce new animation libraries.
- `src/app/shared/pipes/localize-route.pipe.ts` (`localizeRoute`) — required on every `routerLink` so locale prefix is preserved.
- `src/styles.css` — global utility layer (`cta-gradient`, `hero-overlay`, `card-hover`, `btn-glow`, `link-underline`, `img-zoom`, `icon-float`); add editorial helpers here, not per-component.

### Institutional Learnings

- RTL-first: use logical Tailwind properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `start-*`, `end-*`). Never `ml-*`/`mr-*`/`text-left`/`text-right`.
- SSR-safe: no direct `window`/`document`/`localStorage`. Use `PlatformService` for browser-only logic. GSAP work goes through `afterNextRender()` in the constructor (already encapsulated by `ScrollAnimateDirective`).
- `*transloco="let t"` on the section root, then `t('home.someKey.title')` in markup. Programmatic translation only via `TranslocoService.translate(key)` from component code.
- Tailwind v4 uses CSS-first config (`@theme` in `src/styles.css`), OKLCH colors, and `var(--color-...)`. Do not write `hsl(var(--...))`.
- `@defer (on viewport)` requires the deferred component in the component's `imports` array — Angular auto-splits the chunk.
- `NgOptimizedImage` with `priority` for above-the-fold images, `loading="lazy"` for below-the-fold; provide `alt`, `width`, `height` to avoid CLS.
- Tests: this repo has no `.spec.ts` files. Verification is manual via the dev server (`npm start`) + browser. Do not invent unit test infrastructure as part of this plan; if test scaffolding is wanted, that is a separate effort.

### External References

External research was skipped: editorial real-estate design conventions are well-known, the codebase already shows mature local patterns (Tailwind v4 + Transloco + NgOptimizedImage + GSAP), and no high-risk surface (security, payments, integrations) is touched.

## Key Technical Decisions

- **Restyle, don't replace.** Keep the existing component split (`hero-section`, `trust-bar`, `why-us`, `featured-projects`, `gallery-preview`, `cta-banner`, `location-map`). Lower risk, preserves existing animations and translations, easier to review.
- **One new component per new section.** Create `brand-story`, `zones-showcase`, `projects-mosaic`, and `lifestyle-strip` as siblings under `src/app/features/home/components/`. Keeps the home page a thin composition.
- **Reuse `ZONES` from `projects` feature.** The zones-showcase imports the existing `ZONES` array from `src/app/features/projects/data/projects.data.ts` rather than duplicating it. Features → can import other features' data only when it represents truly shared domain content; an alternative is to lift `ZONES` into a shared data module — defer that refactor unless a third consumer appears.
- **Editorial typography pass in `styles.css`.** Add a small set of utilities (`.eyebrow`, `.section-title-xl`, `.editorial-rule`) rather than per-component SCSS, to keep the rhythm consistent across new and existing sections.
- **Brand-story uses `logo-transparent.png` against an editorial photo, not a flat background.** This is the "creative section with logo" the user requested; the photographic backdrop is what makes it real-estate-flavored rather than a corporate "About us" block.
- **`@defer (on viewport)` for new below-fold sections.** Match the existing performance posture — only the hero, trust-bar, and (newly) the brand-story teaser remain eager, since brand-story is the second viewport.
- **Manual verification, not automated tests.** Repo has no spec scaffolding; this plan does not introduce any. Verification is browser-based against the dev server in both locales and both themes.

## Open Questions

### Resolved During Planning

- *Editorial luxury vs. immersive vs. trust-first style?* → Editorial luxury (user-confirmed).
- *Which new sections?* → All four (brand story, zones showcase, projects mosaic, lifestyle strip) — user-confirmed.
- *Full redesign or incremental?* → Incremental, preserve existing components — user-confirmed.
- *New photography or reuse?* → Reuse existing `src/assets/images/` content — user-confirmed.

### Deferred to Implementation

- Exact mosaic layout breakpoints (e.g., 2-column vs. 3-column at `md`, hero-tile height ratios) — settle in the browser against real images rather than on paper.
- Whether `ZONES` should be lifted from `features/projects/data/` into `src/app/shared/data/` — wait until a third consumer arrives. For now, the home zones-showcase imports it directly.
- Whether the brand-story background photograph is one of the existing project hero images or `hero-bg-1920w.webp` — pick during implementation by visually testing 3-4 candidates at the section size.
- Final lifestyle-strip icon set (Lucide already covers all candidates: `LucideGraduationCap`, `LucideTrees`, `LucideTrainFront`, `LucideShieldCheck`, `LucideShoppingBag`, `LucideHeart`). Pick 4-5 in implementation based on space.
- The `assets/images/zones/zone_21.png` path referenced in `ZONES` may not exist (only `zones.webp` is present at the parent level). Verify during implementation; fall back to a project hero from zone-21 (e.g., `project-865-hero.jpg`) if needed and either fix the data file or add the asset.

## High-Level Technical Design

Directional only — see implementation units for specifics.

**New home.component.html ordering (after this plan):**

```
<ahram-hero-section />                    [eager]
<ahram-trust-bar />                       [eager]
<ahram-brand-story />                     [eager — second viewport, anchors brand]
@defer(on viewport) <ahram-why-us />
<ahram-featured-projects />               [eager — keep current behavior]
@defer(on viewport) <ahram-zones-showcase />     [NEW]
@defer(on viewport) <ahram-projects-mosaic />    [NEW]
@defer(on viewport) <ahram-lifestyle-strip />    [NEW]
@defer(on viewport) <ahram-gallery-preview />
@defer(on viewport) <ahram-cta-banner />
@defer(on viewport) <ahram-location-map />
```

Rationale for ordering: hero → social proof (stats) → narrative (brand-story) → why-us proposition → flagship merchandising (featured-projects) → exploration depth (zones, mosaic) → lifestyle proof → visual gallery → conversion (CTA) → location. This is a classic editorial real-estate funnel: image → trust → story → reasons → portfolio → exploration → lifestyle → visual proof → ask.

**Decision matrix — section eagerness:**

| Section | Above-fold? | Eager? | Reason |
|---|---|---|---|
| hero-section | Yes | Yes | LCP target |
| trust-bar | Yes (mobile: just below) | Yes | Light, anchors trust |
| brand-story | Just-below | Yes | Lands the brand on first scroll |
| why-us | Below | Defer | Existing pattern |
| featured-projects | Below | Eager | Keep current — Swiper warmup |
| zones-showcase, projects-mosaic, lifestyle-strip, gallery, cta, map | Below | Defer | Standard pattern |

## Implementation Units

- [ ] **Unit 1: Editorial typography & rhythm utilities**

**Goal:** Establish a small set of shared editorial classes and verify the existing palette/typography supports a luxury read; tighten section rhythm globally before touching individual components.

**Requirements:** R1, R6

**Dependencies:** None.

**Files:**
- Modify: `src/styles.css`

**Approach:**
- Add utilities under the existing `@layer utilities` block: `.eyebrow` (small caps, letter-spaced, primary color, used above section titles), `.section-title-xl` (larger display headline scale for new sections), `.editorial-rule` (thin horizontal rule with brand color), `.section-spacing-lg` (a slightly larger vertical rhythm option for editorial sections).
- Confirm the existing OKLCH brand tokens in `@theme` already give us the muted/warm palette an editorial real-estate page wants. No new tokens unless something is clearly missing during implementation (defer if so).
- Confirm `prefers-reduced-motion: no-preference` gate on `scroll-behavior: smooth` is intact.

**Patterns to follow:**
- Existing utility additions in `src/styles.css` (`card-hover`, `btn-glow`, `link-underline`, `img-zoom`, `icon-float`).

**Test scenarios:**
- Test expectation: none — pure utility class addition, no behavior. Verified visually by Unit 2+ adoption.

**Verification:**
- Build succeeds (`npm run build`) with no Tailwind warnings about unknown classes.
- New utilities render correctly when applied in a smoke template.

---

- [ ] **Unit 2: Refine hero-section to editorial luxury**

**Goal:** Lift the hero from "stock background + headline" to an editorial real-estate hero — refined overlay gradient, eyebrow line, slimmer-tracked headline, scroll cue, locale-aware micro-copy treatment.

**Requirements:** R1, R6

**Dependencies:** Unit 1 (utilities).

**Files:**
- Modify: `src/app/features/home/components/hero-section/hero-section.component.html`
- Modify: `src/app/features/home/components/hero-section/hero-section.component.scss`
- Modify: `src/assets/i18n/ar.json`, `src/assets/i18n/en.json` (add `home.hero.eyebrow`, `home.hero.scrollCue`)

**Approach:**
- Replace the inline `style` background with a layered approach: keep the responsive `<img srcset>` block (uncomment the existing one), drop `background-attachment: fixed` (jittery on iOS, hostile to mobile performance), let `hero-overlay` carry a richer multi-stop gradient.
- Add an eyebrow line above the H1 (`.eyebrow` from Unit 1) translating `home.hero.eyebrow` (e.g., "تطوير عقاري في مدينة السادات" / "Real estate development in Sadat City").
- Add a small scroll cue at the bottom-center with `aria-hidden`; gate animation on `prefers-reduced-motion`.
- Keep CTA primary/outline split; tighten spacing using logical properties.
- `NgOptimizedImage` with `priority` on the LCP image; provide `width`/`height`.

**Patterns to follow:**
- Existing `ahramAnimate` stagger (`fade-up` with `[animateDelay]`) — keep current entry feel.
- Existing `srcset` markup commented in the file — uncomment and finish.

**Test scenarios:**
- Happy path: hero renders with sharp image at 1920w, 1024w, 640w viewports; H1, eyebrow, subtitle, CTAs all readable in light and dark mode.
- Edge case: image fails to load — overlay + brand color background remain legible (no white-on-white).
- Edge case: `prefers-reduced-motion: reduce` — no scroll-cue bounce, no `ahramAnimate` movement (verify GSAP gate).
- Integration: `routerLink="'/projects' | localizeRoute"` resolves to `/ar/projects` and `/en/projects` correctly when language is toggled.
- Accessibility: keyboard focus ring visible on both CTAs; eyebrow is decorative (`role="presentation"` or plain `<span>`), scroll cue is `aria-hidden="true"`.

**Verification:**
- Visual diff in browser, both locales, both themes.
- Lighthouse: LCP element is the hero image, not a placeholder.

---

- [ ] **Unit 3: Add brand-story teaser section (logo + narrative)**

**Goal:** Implement the "creative section with logo and some text" — a brand-anchored editorial moment placed below the trust bar that pairs `logo-transparent.png` with a short story paragraph and a signature photograph.

**Requirements:** R2, R6, R7

**Dependencies:** Unit 1 (utilities).

**Files:**
- Create: `src/app/features/home/components/brand-story/brand-story.component.ts`
- Create: `src/app/features/home/components/brand-story/brand-story.component.html`
- Create: `src/app/features/home/components/brand-story/brand-story.component.scss`
- Modify: `src/app/features/home/data/home.data.ts` (add `BRAND_STORY_HIGHLIGHTS` for 3-4 short pillars under the paragraph)
- Modify: `src/app/features/home/models/home.models.ts` (add `BrandStoryHighlight` interface)
- Modify: `src/assets/i18n/ar.json`, `src/assets/i18n/en.json` (new `home.brandStory.*` namespace: `eyebrow`, `title`, `paragraph1`, `paragraph2`, `cta`, `highlight1.title`, `highlight1.value`, ...)

**Approach:**
- Two-column layout at `lg+`: left column carries the editorial photograph (one of the existing zone or hero photos) overlaid with `logo-transparent.png` at ~30-40% opacity bottom-anchored, framed in a soft 1px border with brand-warm tint; right column carries `eyebrow` → `section-title-xl` → two short paragraphs (echoing `about.story.paragraph1/2` tone but tightened) → CTA "Read our story" linking to `/:locale/about` via `localizeRoute`.
- Below the columns: a row of 3 small highlight stats/values (e.g., founding year, Sadat City focus, family-first promise) — small icons + label, not the same as `trust-bar`.
- Mobile: stack columns, photograph on top, text below; logo overlay shrinks proportionally.
- Use `NgOptimizedImage` with `loading="lazy"` and explicit dimensions on the photograph; logo image must have non-empty `alt` ("Al-Ahram Developments logo" / "شعار الأهرام للتطوير العقاري").
- Use `@if(isRtl())` only if direction-specific layout is unavoidable; prefer logical properties throughout.

**Patterns to follow:**
- Standalone component, `ChangeDetectionStrategy.OnPush`, `inject()`, signal inputs, `*transloco="let t"` on the section root.
- `ahramAnimate="fade-up"` for the text column with a small delay; `fade-right` (or `fade-left` in RTL — directive auto-handles or accepts both) for the image column.

**Test scenarios:**
- Happy path: section renders at `≥1024px`, `768px`, `375px` widths; logo overlay readable but not garish over the photograph.
- Happy path AR: text column is right-aligned, image column on the visual-left; CTA chevron flips correctly.
- Happy path EN: mirror — text left, image right.
- Edge case: photograph fails to load — `ImageFallbackDirective` (already in `@shared/directives`) shows a brand-color background; logo remains visible.
- Edge case: dark mode — logo (`logo-transparent.png`) still has acceptable contrast against the dark-mode panel; photograph overlay is dark-mode aware.
- Integration: CTA `routerLink="'/about' | localizeRoute"` navigates to `/ar/about` or `/en/about`.
- Accessibility: section has an `aria-labelledby` referencing the `<h2>` id; logo `<img>` has alt text or `alt=""` if labeled adjacent.

**Verification:**
- Browser visual check in both locales and both themes at three breakpoints.
- Translation keys present in both `ar.json` and `en.json` (no missing-key warnings in the console).

---

- [ ] **Unit 4: Add zones / locations showcase section**

**Goal:** Visually merchandise Sadat City zones in an editorial grid, each card linking into `/:locale/projects/:zoneSlug`, so a buyer can enter the catalog by neighborhood rather than scrolling the full project list.

**Requirements:** R3, R6, R7

**Dependencies:** Unit 1.

**Files:**
- Create: `src/app/features/home/components/zones-showcase/zones-showcase.component.ts`
- Create: `src/app/features/home/components/zones-showcase/zones-showcase.component.html`
- Create: `src/app/features/home/components/zones-showcase/zones-showcase.component.scss`
- Modify: `src/assets/i18n/ar.json`, `src/assets/i18n/en.json` (new `home.zones.*` namespace: `eyebrow`, `title`, `subtitle`, `viewAll`, `cardCta`)

**Approach:**
- Import `ZONES` from `src/app/features/projects/data/projects.data.ts`. Build a responsive editorial grid: 1 column mobile, 2 columns at `md`, 3-4 at `lg+`.
- Each card: `NgOptimizedImage` with `fill` + `sizes`, dark gradient overlay, zone name (`t(zone.nameKey)`) and short description (`t(zone.descriptionKey)`) bottom-anchored, hover lift (`card-hover`) + image zoom (`img-zoom`). Whole card is a single `<a [routerLink]="['/projects', zone.slug] | localizeRoute">`.
- Section CTA "View all zones" → `'/projects' | localizeRoute`.
- Verify each `zone.imageUrl` exists; if `assets/images/zones/zone_21.png` is missing, file a one-line fix in `projects.data.ts` to point at `assets/images/projects/project-865-hero.jpg` or place the asset (note in deferred questions).
- `ahramAnimate="fade-up"` with `[animateDelay]="i * 0.08"` for staggered entry.

**Patterns to follow:**
- `gallery-preview` component for image-grid sizing/lazy-loading.
- `featured-projects` component for card hover styling.

**Test scenarios:**
- Happy path: 8 zone cards render, each clickable, image present.
- Happy path: clicking a card navigates to `/ar/projects/zone-21` (or appropriate slug); navigating back preserves scroll behavior.
- Edge case: missing `imageUrl` — `ImageFallbackDirective` placeholder; card still clickable.
- Edge case: zone name very long (Arabic) — text doesn't break layout, ellipsis or wrap is graceful.
- Integration: language toggle re-renders zone names via Transloco without a hard reload.
- Accessibility: each card is one tab stop; focused card has visible outline; image `alt` is derived from the zone name (not duplicated against the visible label — use `alt=""` if the heading is adjacent and announced).

**Verification:**
- All 8 cards visible and clickable on mobile, tablet, desktop.
- No console warnings about missing translation keys.

---

- [ ] **Unit 5: Add image-rich projects mosaic section**

**Goal:** Surface a curated mosaic of project hero images (asymmetric layout) that lets a visitor browse the visual breadth of the portfolio beyond the existing `featured-projects` Swiper.

**Requirements:** R4, R6, R7

**Dependencies:** Unit 1.

**Files:**
- Create: `src/app/features/home/components/projects-mosaic/projects-mosaic.component.ts`
- Create: `src/app/features/home/components/projects-mosaic/projects-mosaic.component.html`
- Create: `src/app/features/home/components/projects-mosaic/projects-mosaic.component.scss`
- Modify: `src/app/features/home/data/home.data.ts` (add `MOSAIC_TILES` — 6-9 entries selecting from existing project hero images, each with `imageUrl`, `link`, optional `nameKey` and `tileSize: 'sm' | 'md' | 'lg'`)
- Modify: `src/app/features/home/models/home.models.ts` (add `MosaicTile` interface)
- Modify: `src/assets/i18n/ar.json`, `src/assets/i18n/en.json` (new `home.mosaic.*` namespace: `eyebrow`, `title`, `subtitle`, `viewAll`, `tile1.name`, ...)

**Approach:**
- CSS Grid mosaic: define 4 tile slots at `lg+` using `grid-template-areas` (e.g., one large tile, two medium, three small) for editorial irregularity; collapse to 2-column at `md`, 1-column at mobile.
- Each tile is a clickable image card with title + zone hint overlay on hover; whole tile is a `routerLink="['/projects', zoneSlug, projectSlug] | localizeRoute"`.
- Use existing project hero images that aren't already in `FEATURED_PROJECTS` to avoid duplication (e.g., `project-29-hero.jpg`, `project-137-hero.jpg`, `project-255-hero.jpg`, `project-336-hero.jpg`, `project-348-hero.jpg`, `project-584-hero.jpg`, `project-629-hero.jpg`, `mini-compound-hero.jpg`). Pick during implementation based on what crops well into mosaic tiles.
- `NgOptimizedImage` with `fill` + appropriate `sizes`, `loading="lazy"`.
- Section CTA "Browse all projects" → `'/projects' | localizeRoute`.

**Technical design:**

```
@media (min-width: 1024px) {
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 280px);
  grid-template-areas:
    "lg lg md sm"
    "lg lg sm md";
}
```

Directional only — final tile sizing tuned visually.

**Patterns to follow:**
- `gallery-preview` lazy-loading and sizing.
- `featured-projects` hover affordance.

**Test scenarios:**
- Happy path: 6-9 tiles render in editorial layout at desktop, collapse to 2-column at tablet, 1-column at mobile.
- Happy path: each tile click navigates to the correct project detail URL with locale prefix.
- Edge case: tile image missing — `ImageFallbackDirective` placeholder, click still routes correctly.
- Edge case: all `MOSAIC_TILES` entries fail to load — section still has a heading, subtitle, and CTA fallback (degrades gracefully, doesn't render an empty grey block).
- Integration: language toggle re-renders tile labels and CTAs; `routerLink` updates locale.
- Accessibility: each tile is a single focusable `<a>`; non-decorative images have alt text; visual focus indicator visible.

**Verification:**
- Mosaic looks intentional (not a uniform grid) at desktop.
- No layout shift (CLS) when images load (explicit dimensions or `aspect-ratio`).

---

- [ ] **Unit 6: Add lifestyle / amenities strip section**

**Goal:** Communicate the family-buyer lifestyle promise (schools, parks, transit, security, retail) through a compact icon + photo strip, distinct from `why-us` (which sells the developer) and `trust-bar` (which sells track record).

**Requirements:** R5, R6, R7

**Dependencies:** Unit 1.

**Files:**
- Create: `src/app/features/home/components/lifestyle-strip/lifestyle-strip.component.ts`
- Create: `src/app/features/home/components/lifestyle-strip/lifestyle-strip.component.html`
- Create: `src/app/features/home/components/lifestyle-strip/lifestyle-strip.component.scss`
- Modify: `src/app/features/home/data/home.data.ts` (add `LIFESTYLE_AMENITIES` — 4-5 entries with `icon`, `titleKey`, `descriptionKey`)
- Modify: `src/app/features/home/models/home.models.ts` (add `LifestyleAmenity` interface)
- Modify: `src/assets/i18n/ar.json`, `src/assets/i18n/en.json` (new `home.lifestyle.*` namespace: `eyebrow`, `title`, `subtitle`, `schools.title`, `schools.description`, `parks.*`, `transit.*`, `security.*`, `retail.*`)

**Approach:**
- Section background: a soft-tinted panel (`bg-muted/40` or a brand-warm equivalent) with a single editorial photograph anchoring the right column at `lg+`.
- Left column at `lg+`: eyebrow, title, subtitle, then a 2x2 (or 1x4) icon list of amenities (Lucide icons: `LucideGraduationCap`, `LucideTrees`, `LucideTrainFront`, `LucideShieldCheck`, `LucideShoppingBag` — pick 4-5).
- Each amenity card: small icon in a brand-color rounded square, label, one-line description.
- Mobile: stack — photo on top, amenities grid below.
- `ahramAnimate="fade-up"` with stagger.

**Patterns to follow:**
- `why-us` for the icon-card visual style.
- `trust-bar` for the icon containment (rounded square / circle with brand-color tint).

**Test scenarios:**
- Happy path: 4-5 amenity cards render in 2x2 at `lg+`, 1x4 at mobile.
- Happy path AR: text alignment is `text-start`, icon position respects RTL.
- Edge case: long Arabic description text wraps without overflowing the card.
- Edge case: dark mode — icon backgrounds and text remain legible.
- Integration: Lucide icon imports succeed (use `[lucideIcon]` binding pattern from `why-us`).
- Accessibility: icon is decorative (`aria-hidden="true"`); text label carries the meaning.

**Verification:**
- Section reads as "lifestyle promise" not "company features"; differentiated from `why-us` visually.

---

- [ ] **Unit 7: Compose home.component.html, polish translations & rhythm**

**Goal:** Wire the four new components into the home page in the planned order, register them in the `imports` array, ensure all sections pass eager/defer review, and verify both locales render every translation key without warnings.

**Requirements:** R1, R3, R4, R5, R6

**Dependencies:** Units 2-6.

**Files:**
- Modify: `src/app/features/home/home.component.html`
- Modify: `src/app/features/home/home.component.ts` (add the 4 new components to `imports`)
- Modify: `src/assets/i18n/ar.json`, `src/assets/i18n/en.json` (final pass — verify every new key is present in both files, no orphan keys)

**Approach:**
- Reorder per the High-Level Technical Design table; mark `brand-story` eager, the rest of the new sections deferred.
- Confirm placeholder heights on `@defer` blocks are tall enough to prevent jarring layout-on-load (use `section-spacing` or new `section-spacing-lg` from Unit 1).
- Run a final consistency pass on section eyebrow + title + subtitle wording across all home sections so they feel like one editorial document.
- Search `src/assets/i18n/ar.json` and `en.json` for any `home.brandStory|home.zones|home.mosaic|home.lifestyle` keys referenced in templates that aren't defined. Fix or remove.

**Patterns to follow:**
- Existing `@defer (on viewport) { … } @placeholder { <div class="section-spacing" aria-hidden="true"></div> }` pattern.

**Test scenarios:**
- Happy path: home page renders end-to-end at `375px`, `768px`, `1280px`, `1920px` widths in both locales and both themes; no layout breaks, no missing-translation console warnings.
- Happy path: scrolling through the page triggers each `@defer` once; no double-init, no layout shift.
- Edge case: slow-network simulation — placeholders remain visible until each deferred component loads; no FOUC.
- Edge case: `prefers-reduced-motion: reduce` — no GSAP entry animations, sections appear instantly.
- Integration: full keyboard navigation — `Tab` reaches every CTA in a logical order; no skipped landmarks.
- Integration: language toggle from `/ar` to `/en` (and back) re-renders all sections without losing scroll position.

**Verification:**
- Lighthouse Performance score does not regress more than 3 points from current baseline.
- No console errors or Transloco missing-key warnings in either locale.
- Manual scan against the four R-requirements and visual direction described in Overview.

## System-Wide Impact

- **Interaction graph:** Adds four new components to `home.component.ts` `imports` array. No router changes (existing `/:locale` shape preserved). No service additions.
- **Error propagation:** Image failures degrade via the existing `ImageFallbackDirective`. Translation key gaps are surfaced by Transloco's missing-key warnings in dev. No new error paths introduced.
- **State lifecycle risks:** None — all new components are presentational, no signals beyond locally-scoped data, no subscriptions.
- **API surface parity:** None affected. No public component APIs changed. New components are internal to the home feature. `ZONES` cross-feature import noted in Key Technical Decisions.
- **Integration coverage:** Manual browser verification in both locales × both themes × three breakpoints is the integration check. No automated tests since the repo has no spec scaffolding.
- **Unchanged invariants:** Header (`AppHeaderComponent`), footer (`AppFooterComponent`), routing (`/:locale` shape), `localeGuard`, all interceptors, all services (`SeoService`, `I18nService`, `AppStore`), prerendering manifest (`app.routes.server.ts`), sitemap and `robots.txt`, all other feature pages. SEO meta tags for the home page are unchanged unless the title/description in `home.component.ts` `SeoService.updateSeo` needs adjusting for the new positioning — verify during Unit 7 and update only if the current copy no longer fits.

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| Mosaic and zones cards add 8-15 image requests, hurting LCP/CLS. | Use `NgOptimizedImage` with `fill` + `sizes`, `loading="lazy"`, explicit aspect ratios; defer the section via `@defer (on viewport)`; verify Lighthouse pre/post. |
| `assets/images/zones/zone_21.png` referenced in `ZONES` may not exist. | Verify in Unit 4; fall back to a project hero image and either fix the path or place the asset; document in deferred questions (already noted). |
| Brand-story section reads like a generic "About us" block instead of a real-estate moment. | Anchor it on a strong photograph (not a flat color), keep the logo overlay subtle (≤40% opacity), echo `about.story` tone but tighten to 2 short paragraphs; visual review at the end of Unit 3 specifically against this risk. |
| RTL parity drift in mosaic CSS Grid `grid-template-areas`. | Areas are direction-agnostic (visual layout is the same in RTL); verify text alignment within tiles uses `text-start`; no `start-` / `end-` ambiguity in the grid template itself. |
| Translation drift between AR and EN. | Unit 7 has an explicit final pass to diff key sets between the two locale files. |
| Editorial typography utilities clash with existing component styles. | Add only as additive utilities in `@layer utilities`; they're opt-in classes, not global element selectors; no risk to unmodified components. |
| `featured-projects` Swiper init logic fights `@defer` re-init in the new section ordering. | `featured-projects` stays in the same eager position; only deferred components are new, so Swiper init order is unchanged from current behavior. |

## Documentation / Operational Notes

- No deployment/operational changes. Pure frontend work, prerendered as part of the existing `/:locale` static prerender pass — verify the home route still prerenders successfully (should: no new dynamic params).
- Update `CLAUDE.md` `## Learnings` only if a non-obvious quirk is discovered during implementation (e.g., a Tailwind v4 CSS-first surprise, a Transloco edge case). Do not pre-emptively pad it.
- Sitemap, hreflang, and SEO meta need no structural changes; revisit only if Unit 7 changes home page copy positioning enough that the meta description should reflect it.

## Sources & References

- Origin document: none — direct user request.
- Related code: `src/app/features/home/`, `src/app/features/projects/data/projects.data.ts`, `src/app/features/about/`, `src/app/shared/directives/scroll-animate.directive.ts`, `src/styles.css`, `src/assets/i18n/ar.json`, `src/assets/i18n/en.json`.
- Prior plan (predecessor, partially overlapping): `docs/plans/2026-04-11-001-feat-enhance-home-page-ui-plan.md` — covered hero/trust-bar/why-us refinement; this plan supersedes its scope by focusing on editorial restyling and four new image-rich sections.
