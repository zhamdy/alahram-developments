---
title: "feat: Improve Google Rank, Search Visibility & SEO"
type: feat
status: completed
date: 2026-05-24
---

# feat: Improve Google Rank, Search Visibility & SEO

## Overview

The site (`https://www.alahram-developments-sadat.com`) currently ranks only for its exact brand name. This is expected for a freshly-indexed domain, but it is compounded by leftover technical defects from a recent domain change and missed structured-data / internal-linking opportunities.

This plan hardens the technical SEO foundation, enriches structured data for Google rich results, adds SEO-focused UI (visible breadcrumbs, internal linking, related content), scaffolds keyword-targeted content, and provides an off-site authority action plan. The goal is to move from "ranks only for brand name" toward ranking for competitive long-tail queries like "شقق للبيع في مدينة السادات".

## Problem Frame

GA4 (`G-57YKS504Y5`) and Search Console are now linked, the sitemap was repointed to the correct domain, and the production `siteUrl` was corrected. However:

- Some old-domain references remain (`public/robots.txt` sitemap URL, dev/staging env configs, contact emails).
- The sitemap generator emits routes that do not resolve (`/faq`), and route/prerender/sitemap definitions have drifted apart.
- High-value structured data (FAQPage) and on-page signals (visible breadcrumbs, internal links, related content) are absent.
- A new domain has near-zero authority; ranking for competitive terms additionally requires content depth and backlinks, which are off-code actions.

## Requirements Trace

- R1. Eliminate technical SEO defects introduced/left by the domain change so every indexed URL is canonical, reachable (HTTP 200), and on the correct domain.
- R2. Ensure the sitemap, client routes, and prerender config are a single consistent set with no dead URLs.
- R3. Maximize Google rich-result eligibility via complete, valid structured data (FAQPage, enriched BlogPosting, consistent BreadcrumbList).
- R4. Strengthen on-page and internal-linking signals via SEO-focused UI so Google can crawl depth and associate pages with target keywords.
- R5. Scaffold keyword-targeted content structure for long-tail Sadat City queries (copy production deferred to the existing blog content plan).
- R6. Provide an actionable off-site authority checklist (indexing requests, Google Business Profile, backlinks/directories).

## Scope Boundaries

- Not a site-wide visual redesign. UI changes are SEO-scoped: breadcrumbs, internal links, related content, headings/alt text.
- Not writing full blog/article copy here — that is owned by `docs/plans/2026-04-30-001-feat-expand-blog-content-and-seo-plan.md`. This plan scaffolds structure and metadata only.
- Off-site authority work (R6) is an operational checklist, not code.
- Admin panel (`/admin`) and backend/API behavior are out of scope.
- No new automated test framework is introduced unless explicitly chosen (see Open Questions); verification uses build output + sitemap assertions + Google validators.

## Context & Research

### Relevant Code and Patterns

- `src/app/core/services/seo.service.ts` — `updateSeo()` sets title, meta, OG, Twitter, canonical, hreflang; `addJsonLd()` / `clearJsonLd()` manage structured data. All pages already call `updateSeo()`.
- `src/app/shared/helpers/seo.helper.ts` — schema builders: `buildOrganizationSchema`, `buildProjectSchema`, `buildLocalBusinessSchema`, `buildSadatMapsSchema`, `buildBreadcrumbSchema`. All correctly use `environment.siteUrl` (no hardcoded domain). No `buildFaqSchema` exists yet.
- `src/app/core/config/social.config.ts` — centralized `SOCIAL_LINKS` consumed by schema helpers.
- `scripts/generate-sitemap.js` — `BASE_URL` now correct; `staticRoutes` array drives URL generation. Contains `/faq` (no matching route) and uses path names that must be verified against `app.routes.ts`.
- `src/app/app.routes.ts` — actual locale-prefixed routes: `'' (home)`, `projects`, `about`, `contact`, `gallery`, `blog`, `sadat-guide`, `sadat-city-maps`, `construction`, `privacy`. **No** `faq`, `investors`, or `payment(-plans)` routes are wired, despite route files existing for `investors`/`payment` and `CLAUDE.md`/prerender config referencing them.
- `src/app/app.routes.server.ts` — prerender list (per `CLAUDE.md` references `faq`, `payment-plans`, `investors`); must be reconciled with `app.routes.ts`.
- `src/app/features/home/home.component.ts` — uses `environment.siteUrl`, adds Organization schema, no single-item breadcrumb (already cleaned up).
- `src/app/features/blog/blog-detail/blog-detail.component.ts` — BlogPosting schema present but missing `articleBody`, `wordCount`, `inLanguage`, `keywords`, `publisher.logo`.
- Feature dirs present: `about, admin, blog, contact, gallery, guide, home, investors, payment, privacy, projects, sadat-maps, updates`.
- No visible breadcrumb UI component exists under `src/app/shared/ui/`.
- SEO copy lives in `src/assets/i18n/ar.json` and `src/assets/i18n/en.json` under `seo.*` keys (well-populated with Arabic/English keywords).

### Institutional Learnings

- `docs/SEO-CODE-ROADMAP.md` — prior audit (20 items). Several are now DONE (hreflang, OG dimensions, base-URL centralization, sitemap generation, LocalBusiness schema, single-item breadcrumb removal). Still-open items folded into this plan: robots.txt, BlogPosting enrichment, hero alt text, console cleanup. **Note:** the roadmap's code snippets still show the OLD domain and predate the domain change — treat its prose as context, not current truth.
- `docs/strategy/11-CONTENT-STRATEGY.md`, `docs/strategy/12-SITEMAP.md` — content/keyword strategy references (also predate domain change).

### External References

- Google: FAQPage structured data is eligible for rich results when the FAQ content is visible on the page and not gated/duplicated.
- Google: BreadcrumbList requires ≥2 items; visible breadcrumbs reinforce the markup.
- New-domain ranking for competitive terms typically takes 3–6 months and is gated by crawl coverage + backlinks, not just on-page SEO.

## Key Technical Decisions

- **Single source of truth for routes.** Sitemap `staticRoutes`, client `app.routes.ts`, and prerender `app.routes.server.ts` must list the same canonical route set. Default to removing URLs that don't resolve (e.g., `/faq`) rather than emitting 404s. Wiring `investors`/`payment` as public routes is a product decision (see Open Questions).
- **FAQ content must be visible.** FAQPage schema is added only on a page that visibly renders the Q&A (avoids Google's "hidden content" violation). Implemented as a reusable FAQ UI block + `buildFaqSchema`.
- **Reuse existing patterns.** New schema builders live in `seo.helper.ts` and consume `environment.siteUrl` + `SOCIAL_LINKS`; new UI lives under `src/app/shared/ui/` as standalone OnPush signal components, consistent with project conventions.
- **Verification without a test harness.** The repo has no `*.spec.ts` and no `test` script. Primary verification: successful `ng build`, sitemap output assertions, route-resolution checks, and Google Rich Results / Search Console. Adding a minimal unit-test runner for pure schema helpers is optional (Open Questions).
- **Emails are a content/business decision.** `info@alahram-developments.com` appears in 4 files; whether to switch to an `@...-sadat.com` mailbox depends on what mailbox actually exists.

## Open Questions

### Resolved During Planning

- Which domain is canonical? → `https://www.alahram-developments-sadat.com` (with `www`, HTTPS). All URLs/schema/sitemap must use it.
- Does the FAQ rich-result opportunity require a route? → It requires visible FAQ content; can live on an existing page (e.g., `sadat-guide` or `contact`) or a new `/faq` route (see below).

### Deferred to Implementation / Needs User Decision

- **Should `investors` and `payment(-plans)` be public, indexed routes?** They have feature files but are not wired into `app.routes.ts`. If yes → wire routes + add to sitemap/prerender. If no → ensure they are excluded everywhere. (Blocks final route reconciliation in Unit 2.)
- **Should `/faq` become a real route, or should FAQ content live on an existing page?** Determines whether Unit 3 creates a route or embeds the FAQ block. (Recommended: dedicated `/ar/faq` + `/en/faq` route for a clean FAQPage target.)
- **Contact email domain:** keep `info@alahram-developments.com` or switch to a `-sadat.com` mailbox? Depends on which mailbox exists.
- **Add a minimal test runner (e.g., Vitest) for pure SEO helpers?** Affects how Unit 3/4/5 test scenarios are executed (automated vs. validator-based).

## High-Level Technical Design

Route/sitemap/prerender reconciliation — the three must agree:

```
              canonical route set (decision)
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
 app.routes.ts   app.routes.server.ts   scripts/generate-sitemap.js
 (client nav)    (prerender list)       (staticRoutes → sitemap.xml)
        │               │                │
        └──── every emitted URL resolves 200, on www....-sadat.com ────┘
```

FAQ rich-result flow (directional):

```
faq.data.ts (Q&A keys) ─► FaqAccordion UI (visible) ─► buildFaqSchema() ─► seo.addJsonLd()
                                                              │
                                          Google Rich Results: FAQ rich snippet
```

## Implementation Units

> Phased delivery: Phase 1 (technical correctness) ships first and is the highest-impact, lowest-risk. Phases 2–4 build on a clean foundation.

### Phase 1 — Technical Correctness

- [ ] **Unit 1: Purge remaining old-domain references**

**Goal:** Every domain reference in config + crawlable assets points to `https://www.alahram-developments-sadat.com`.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Modify: `public/robots.txt` (sitemap URL → new domain)
- Modify: `src/environments/environment.staging.ts` (siteUrl — confirm staging host)
- Modify: `src/environments/environment.ts` (dev siteUrl, for consistency)
- Modify (conditional on email decision): `src/app/core/layout/footer/footer.component.html`, `src/app/features/contact/contact.component.html`, `src/app/features/privacy/privacy.component.html`

**Approach:**
- Repoint the `Sitemap:` line in `robots.txt` to the correct absolute URL.
- Update staging/dev `siteUrl` so canonical/OG/schema are correct in non-prod builds.
- Only touch email strings if the business confirms a new mailbox (Open Questions); otherwise leave emails as-is and note them.

**Patterns to follow:** Existing `environment.prod.ts` (already corrected).

**Test scenarios:**
- Verify: `public/robots.txt` `Sitemap:` line equals `https://www.alahram-developments-sadat.com/sitemap.xml`.
- Edge case: a repo-wide search for `alahram-developments.com` (without `-sadat`) returns only intentional matches (docs, emails pending decision) — no canonical/OG/robots/sitemap hits.
- Test expectation: none for the config string changes themselves — no behavioral logic; verified by inspection + build.

**Verification:** Repo grep shows no unintended old-domain references in crawlable/config surfaces; `ng build` succeeds.

- [ ] **Unit 2: Reconcile routes, prerender, and sitemap into one canonical set**

**Goal:** The sitemap lists only URLs that resolve 200; client routes, prerender config, and sitemap agree.

**Requirements:** R1, R2

**Dependencies:** Unit 1; decisions on `investors`/`payment` and `/faq` (Open Questions)

**Files:**
- Modify: `scripts/generate-sitemap.js` (`staticRoutes` — remove `/faq` unless route is created; align names with real paths)
- Modify: `src/app/app.routes.ts` (only if `investors`/`payment` are to be public)
- Modify: `src/app/app.routes.server.ts` (prerender list must match)
- Regenerate: `public/sitemap.xml`

**Approach:**
- Establish the canonical route list from `app.routes.ts` after the product decision.
- Remove `/faq` from `staticRoutes` (or add the route in Unit 3 first).
- Confirm `sadat-guide`, `sadat-city-maps`, `construction` names in the script exactly match `app.routes.ts`.
- Decide `investors`/`payment`: wire + index, or exclude everywhere.
- Run `node scripts/generate-sitemap.js` and confirm URL count/paths.

**Technical design:** See route reconciliation diagram above. Prefer extracting the canonical static-route list once and reusing it, rather than maintaining three divergent arrays — directional only.

**Patterns to follow:** Existing `staticRoutes` structure in `scripts/generate-sitemap.js`.

**Test scenarios:**
- Happy path: every `<loc>` in the regenerated `public/sitemap.xml` corresponds to a route that resolves (manually hit each static path in `start:ssr`, expect 200, not the 404 catch-all).
- Edge case: `/ar/faq` and `/en/faq` are absent from the sitemap when no faq route exists.
- Edge case: sitemap URL count matches `(static routes + zones + project details + blog posts) × 2 locales`.
- Integration: `npm run prebuild` (which runs the generator) succeeds and produces the same URL set as a manual run.

**Verification:** No sitemap URL returns the 404 component; Search Console "Pages" report shows 0 "not found (404)" from sitemap after redeploy.

### Phase 2 — Structured Data Enrichment

- [ ] **Unit 3: FAQPage schema + visible FAQ block**

**Goal:** Add a visible FAQ section with valid FAQPage JSON-LD to capture FAQ rich results for Sadat City buyer questions.

**Requirements:** R3, R4

**Dependencies:** Unit 2 (route decision for `/faq`)

**Files:**
- Create: `src/app/shared/ui/faq-accordion/faq-accordion.component.ts` (+ `.html`, `.scss`)
- Create: faq data, e.g. `src/app/features/<faq-or-guide>/data/faq.data.ts` (Q&A as translation keys)
- Modify: `src/app/shared/helpers/seo.helper.ts` (add `buildFaqSchema(items)`)
- Modify: host page component (`guide`/`contact`, or new `faq` feature per decision) to render the block + call `seo.addJsonLd(buildFaqSchema(...))`
- Modify: `src/assets/i18n/ar.json`, `src/assets/i18n/en.json` (FAQ Q&A copy + section heading)
- Modify (if new route): `src/app/app.routes.ts`, `src/app/app.routes.server.ts`, `scripts/generate-sitemap.js`

**Approach:**
- FAQ content must be visibly rendered (accordion) on the page that carries the schema.
- `buildFaqSchema` returns a `FAQPage` with `mainEntity` array of `Question`/`acceptedAnswer`.
- Target high-intent questions (prices, installments, زون/مناطق, delivery dates) using existing keyword themes.

**Technical design:** `faq.data.ts` → array of `{ questionKey, answerKey }`; component renders accessible accordion; `buildFaqSchema(resolvedItems)` maps to schema.org `FAQPage`. Directional only.

**Patterns to follow:** `buildSadatMapsSchema` (ItemList over data) for the helper shape; existing shared UI components for standalone/OnPush/signal conventions.

**Test scenarios:**
- Happy path: `buildFaqSchema` with 3 items returns `@type: FAQPage` with `mainEntity.length === 3`, each `Question` having a non-empty `acceptedAnswer.text`.
- Edge case: empty FAQ list → helper returns a schema with empty `mainEntity` (or the host omits the call); page must not emit an invalid FAQPage with zero questions.
- Edge case: answers containing HTML/quotes are serialized without breaking JSON-LD.
- Integration: rendered page passes Google Rich Results Test as a valid FAQ; the visible accordion text matches the schema answers (no hidden-content mismatch).

**Verification:** Rich Results Test reports a valid FAQ; the FAQ section is visible and keyboard-accessible.

- [ ] **Unit 4: Enrich BlogPosting schema**

**Goal:** Add recommended BlogPosting fields for article rich-result eligibility.

**Requirements:** R3

**Dependencies:** None

**Files:**
- Modify: `src/app/features/blog/blog-detail/blog-detail.component.ts`

**Approach:** Add `articleBody`, `wordCount`, `inLanguage` (`ar-EG`/`en-US`), `keywords` (post tags), and `publisher` with `logo`. Reuse `environment.siteUrl` and `SOCIAL_LINKS`/org constants — no hardcoded domain.

**Patterns to follow:** Existing `addJsonLd` usage in `blog-detail.component.ts`; `buildOrganizationSchema` for publisher fields.

**Test scenarios:**
- Happy path: a post with body + tags produces BlogPosting JSON-LD where `wordCount > 0`, `inLanguage` matches active locale, `keywords` equals the joined tags, and `publisher.logo.url` is on the correct domain.
- Edge case: a post with no tags omits `keywords` (no empty string) and still validates.
- Edge case: Arabic post sets `inLanguage: 'ar-EG'`; English post sets `'en-US'`.
- Integration: blog detail page passes Rich Results Test as a valid Article/BlogPosting.

**Verification:** Rich Results Test validates the article schema in both locales.

- [ ] **Unit 5: Consistent BreadcrumbList across inner pages**

**Goal:** Every inner page (not home) emits a ≥2-item BreadcrumbList aligned with the visible breadcrumb UI (Unit 6).

**Requirements:** R3, R4

**Dependencies:** Unit 6 (visible breadcrumbs), or can ship schema-first

**Files:**
- Modify: inner-page components that call `addJsonLd` (e.g., `projects-list`, `project-detail`, `about`, `gallery`, `guide`, `sadat-maps`, `blog-list`, `blog-detail`, `contact`, `privacy`)
- Reuse: `buildBreadcrumbSchema` in `src/app/shared/helpers/seo.helper.ts`

**Approach:** Audit each inner page for a correct breadcrumb trail (Home → Section [→ Item]) with locale-prefixed, correct-domain URLs. Ensure home page emits **no** single-item breadcrumb (already true — keep it that way).

**Patterns to follow:** Existing `buildBreadcrumbSchema` calls in `projects-list` / `about`.

**Test scenarios:**
- Happy path: `buildBreadcrumbSchema` with `[Home, Projects, Project]` returns `itemListElement.length === 3` with sequential `position` and correct-domain `item` URLs.
- Edge case: a section page yields exactly 2 items (Home → Section); never 1.
- Edge case: locale switch (ar/en) produces correctly localized names and `/ar` vs `/en` URLs.
- Integration: each inner page passes Rich Results Test breadcrumb validation; Search Console shows no breadcrumb errors after redeploy.

**Verification:** Rich Results Test passes for breadcrumbs on representative pages; GSC breadcrumb enhancement report is error-free.

### Phase 3 — SEO-Focused UI

- [ ] **Unit 6: Visible breadcrumb component**

**Goal:** Render a visible, accessible breadcrumb trail on inner pages — improves UX, internal linking, and reinforces BreadcrumbList markup.

**Requirements:** R4

**Dependencies:** None (pairs with Unit 5)

**Files:**
- Create: `src/app/shared/ui/breadcrumbs/breadcrumbs.component.ts` (+ `.html`, `.scss`)
- Modify: inner-page templates to include `<ahram-breadcrumbs [items]="...">`
- Modify: `src/assets/i18n/*.json` (aria label / "Home" label if needed)

**Approach:** Standalone OnPush component taking a typed `items` input; uses `LocalizeRoutePipe`/`routerLink` for internal links; RTL-aware separators; `nav[aria-label]` + `aria-current="page"` on last crumb.

**Patterns to follow:** Existing shared UI components; RTL logical-property conventions in `CLAUDE.md`.

**Test scenarios:**
- Happy path: given 3 items, renders 3 links with the last marked `aria-current="page"` and not linked.
- Edge case: RTL renders separators/order correctly; LTR mirrors.
- Edge case: single-item input renders nothing or just the current page (no orphan crumb).
- Integration: breadcrumb links navigate to locale-prefixed routes that resolve 200.

**Verification:** Visible breadcrumbs appear on inner pages in both directions; links work; WAVE/aXe report no new a11y violations.

- [ ] **Unit 7: Internal linking — related projects, zones, related posts**

**Goal:** Add contextual internal links so Google can crawl depth and associate pages with keyword clusters.

**Requirements:** R4

**Dependencies:** None

**Files:**
- Modify: `src/app/features/projects/project-detail/project-detail.component.*` (add "related projects in same zone" + link to zone page)
- Modify: `src/app/features/blog/blog-detail/blog-detail.component.*` (add "related articles")
- Possibly Create: a small `RelatedItems` shared UI component under `src/app/shared/ui/`

**Approach:** Derive related items from existing data (same `zoneSlug`; shared blog tags). Keep link anchors keyword-rich and localized.

**Patterns to follow:** Existing project/zone data access in `projects.data.ts`; existing card components.

**Test scenarios:**
- Happy path: a project detail page lists other projects sharing its `zoneSlug` (excluding itself) and links to the zone page.
- Edge case: a project that is the only one in its zone shows a graceful fallback (e.g., link to all projects) with no empty section.
- Edge case: a blog post with no tag matches shows a fallback (recent posts) rather than an empty block.
- Integration: all generated internal links resolve 200 and are locale-prefixed.

**Verification:** Inner pages now interlink; crawl depth improves (verify via a crawler like Screaming Frog or GSC links report after redeploy).

- [ ] **Unit 8: On-page content signals — headings & image alt**

**Goal:** Ensure each indexable page has a unique keyword-rich H1/H2 and meaningful image alt text.

**Requirements:** R4

**Dependencies:** None

**Files:**
- Modify: `src/app/features/home/components/hero-section/hero-section.component.html` (hero `alt` — verify/fill per roadmap 1.5)
- Modify: page templates lacking a clear single H1 or with empty/duplicate alt text
- Modify: `src/assets/i18n/*.json` (alt text + heading keys as needed)

**Approach:** One H1 per page using primary keyword; descriptive `alt` for content images (skip purely decorative). Use existing translation-key pattern.

**Patterns to follow:** Existing `NgOptimizedImage` usage; `t('...')` translation keys.

**Test scenarios:**
- Happy path: home hero image has a non-empty, translated `alt`; each audited page has exactly one H1.
- Edge case: decorative images keep `alt=""` intentionally (documented), not removed.
- Test expectation: none automated (template/content changes) — verified via rendered DOM inspection + Lighthouse SEO/a11y audit.

**Verification:** Lighthouse SEO audit shows no "image missing alt" / "no H1" / "duplicate title" issues on audited pages.

### Phase 4 — Content & Keywords (Scaffolding)

- [ ] **Unit 9: Keyword landing structure for long-tail Sadat City queries**

**Goal:** Scaffold structure + SEO metadata for high-intent long-tail pages; defer full copy to the blog content plan.

**Requirements:** R5

**Dependencies:** Units 1–2 (clean routes/sitemap)

**Files:**
- Modify: `src/assets/i18n/*.json` (`seo.*` entries for any new/strengthened pages; richer zone-page descriptions)
- Modify: zone/project list components or data to surface keyword-rich intro copy where thin
- Reference (do not duplicate): `docs/plans/2026-04-30-001-feat-expand-blog-content-and-seo-plan.md`

**Approach:** Identify 3–5 priority long-tail intents (e.g., "شقق بالتقسيط مدينة السادات", "أسعار شقق المنطقة الذهبية"), ensure a page/section targets each with unique title/description/H1. Hand off article-length copy to the blog content plan.

**Patterns to follow:** Existing `seo.home/projects` translation entries (title/description/keywords trios).

**Test scenarios:**
- Happy path: each priority intent maps to a page whose `<title>` and meta description contain the target phrase and are unique across the site.
- Edge case: no two pages share an identical title/description (avoid duplicate-content signals).
- Test expectation: none automated (content/metadata) — verified via crawl of `<title>`/`<meta>` uniqueness + GSC Performance query report over time.

**Verification:** Post-deploy, GSC Performance shows impressions for non-brand queries within 2–4 weeks; titles/descriptions are unique.

## System-Wide Impact

- **Interaction graph:** `seo.helper.ts` builders feed `SeoService.addJsonLd`; the sitemap generator runs in `prebuild`; route changes affect `app.routes.ts`, `app.routes.server.ts`, and the sitemap simultaneously — keep them in lockstep (Unit 2).
- **Error propagation:** Invalid/empty structured data fails silently in browsers but is flagged by GSC enhancement reports — rely on Rich Results Test pre-deploy.
- **State lifecycle risks:** `clearJsonLd()` already runs in `updateSeo()`; ensure new `addJsonLd` calls happen after `updateSeo()` so they aren't cleared.
- **API surface parity:** Locale parity — every change must be applied to both `ar` and `en` (URLs, schema language, copy).
- **Integration coverage:** Sitemap URL ↔ route resolution is the key cross-layer invariant; verify by hitting routes, not just by reading config.
- **Unchanged invariants:** Canonical/hreflang/OG mechanics in `SeoService`, prerender modes, and the `environment.siteUrl` pattern stay as-is; this plan adds data and UI, it does not change the SEO pipeline's architecture.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Route/sitemap/prerender drift reintroduced later | Unit 2 consolidates to one canonical list; document the invariant in `CLAUDE.md`. |
| FAQ schema rejected for hidden content | Render FAQ visibly; ensure schema text matches DOM (Unit 3). |
| Wiring `investors`/`payment` without finished content creates thin/duplicate pages | Gate on product decision; exclude from index until content is ready. |
| No automated tests → regressions slip through | Lean on `ng build`, sitemap assertions, Rich Results Test, and Lighthouse; optionally add Vitest for pure helpers. |
| Expecting fast ranking gains | Set expectations: technical + structured data are necessary but authority/backlinks (R6) drive competitive ranking over 3–6 months. |

## Documentation / Operational Notes

### Off-Site Authority Checklist (R6 — operational, not code)

- **Search Console:** After each redeploy, use URL Inspection → Request Indexing for home, `/ar/projects`, `/ar/about`, and new FAQ/landing pages. Resubmit `sitemap.xml`. Monitor Pages (coverage), Enhancements (breadcrumb/FAQ), and Performance reports.
- **Google Business Profile:** Create/claim a Business Profile for the Sadat City office (matches `buildLocalBusinessSchema` geo/address) — drives local pack + Maps visibility.
- **Backlinks / directories:** List on Egyptian real-estate portals (Aqarmap, OLX Egypt, عقار.كوم) and relevant local directories — each is a backlink building domain authority.
- **Social profile consistency:** Ensure Facebook/social links in `SOCIAL_LINKS` are live and point back to the new domain (reinforces `sameAs`).

### Docs to Update

- `CLAUDE.md` — update SEO/prerender/sitemap sections to reflect the reconciled canonical route set and the new domain; note the route↔sitemap↔prerender invariant.
- `docs/SEO-CODE-ROADMAP.md` — mark folded-in items done; correct stale old-domain snippets.

## Sources & References

- Related code: `src/app/core/services/seo.service.ts`, `src/app/shared/helpers/seo.helper.ts`, `scripts/generate-sitemap.js`, `src/app/app.routes.ts`, `src/app/app.routes.server.ts`
- Related plans: `docs/plans/2026-04-30-001-feat-expand-blog-content-and-seo-plan.md` (blog content), `docs/SEO-CODE-ROADMAP.md` (prior audit)
- Recent commits: `f45318f` (sitemap base URL fix), `a87779b` (GA4 ID), plus this session's `environment.prod.ts` siteUrl fix
- External: Google Rich Results Test, Schema.org Validator, Google Search Console, Lighthouse
