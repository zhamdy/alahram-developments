---
title: Expand blog post content and improve blog HTML for SEO
type: feat
status: active
date: 2026-04-30
---

# Expand blog post content and improve blog HTML for SEO

## Overview

Each of the 50 blog posts currently has only 3 short paragraphs (~150–240 words total) — too thin for reader value, SEO, or `BlogPosting` schema. This plan does two things in parallel:

1. **Content track:** append more paragraphs to each post, growing total length to ~500–700 words (~6–8 paragraphs) without changing the per-post content shape.
2. **HTML/SEO track:** upgrade the blog templates with semantic markup, visible breadcrumbs, reading time, ISO datetime, smarter related posts, and richer `BlogPosting` / OpenGraph metadata — improvements that benefit every post equally without requiring per-post template restructuring.

## Problem Frame

- Blog posts are unhelpfully short. A typical post is ~180 words across 3 flat paragraphs, providing weak reader value and almost no SEO weight.
- The blog detail template renders content as a single wall of `<p>` blocks under a `prose-custom` container — no semantic sectioning, no visible breadcrumbs, no reading-time signal, no `datetime` attribute on the publish date, and the `BlogPosting` JSON-LD lacks fields like `articleSection` and `dateModified` that Google uses for richer results.
- The user explicitly chose to keep the per-post content shape unchanged ("more paragraphs, same shape") and to apply the change to all 50 posts in both Arabic and English.
- The user followed up asking for the HTML to be "better for SEO" — so template-level SEO upgrades are in scope, but per-post structural rewrites (e.g., H2 subheadings inside content) are out of scope by their earlier choice.

## Requirements Trace

- R1. Every blog post must have at least 6 content paragraphs and ~500–700 total words across both locales (`ar` and `en`), keeping all existing paragraphs intact and appending new ones.
- R2. New paragraphs must be authored in both Arabic (primary) and English, semantically aligned across locales, written in the existing brand voice, and grounded in facts already present in the post or in the project's documented Sadat City context.
- R3. `BlogPost.contentKeys` remains `readonly string[]`; the existing template `@for` rendering must keep working unchanged for all posts.
- R4. The blog detail page must surface visible breadcrumbs (Home › Blog › Title), an estimated reading time, and an ISO `datetime` attribute on the publish date.
- R5. The `BlogPosting` JSON-LD must include `articleSection`, `dateModified`, and a non-empty `wordCount` that reflects the expanded content. OpenGraph article tags (`article:published_time`, `article:modified_time`, `article:section`, `article:tag`) must be emitted.
- R6. Related-posts sidebar must prefer posts in the same category and sharing tags over a naive "first 3 non-current" slice.
- R7. No new build warnings, no lint regressions, no SSR breakage, prerender of static blog routes still succeeds.

## Scope Boundaries

- **In scope:** content additions to all 50 posts in both locales, semantic/SEO template upgrades to `blog-detail.component.html`, `BlogPost` SEO metadata (model adds `lastModified` + `readingMinutes` only as derived/optional), `SeoService` extensions for OG article tags, related-posts logic update.
- **Out of scope:** introducing structured headings (H2/H3) inside content, lists, callouts, or any change that would require restructuring per-post content (explicitly excluded by user choice). If we later want H2-driven SEO wins, that's a follow-up plan.
- **Out of scope:** moving blog content to a CMS/MDX/API. Hard-coded data + i18n stays.
- **Out of scope:** generating new blog images. Existing `blog-1.jpg`…`blog-50.jpg` stay.
- **Out of scope:** UI/UX redesign of the blog list/grid (already covered in `2026-04-29-001-feat-replace-blog-with-sadat-city-content-plan.md`). Touch list page only for breadcrumb/SEO consistency.
- **Out of scope:** sitemap regeneration logic — URLs don't change, only `lastmod` will benefit if the generator already reads post `date`.

## Context & Research

### Relevant Code and Patterns

- `src/app/features/blog/models/blog.models.ts` — `BlogPost` interface; `contentKeys: readonly string[]`. Adding more entries is non-breaking. Optional fields (`lastModified`, `readingMinutes`) can be added without breaking existing posts.
- `src/app/features/blog/data/blog.data.ts` — single source of truth for the 50 posts. Each entry's `contentKeys` is the exact array of i18n keys rendered as `<p>` blocks in order. Convention so far: `blog.posts.postN.content1..content3`. Extend to `content4..content6` (and `content7`/`content8` only when a post genuinely needs the depth).
- `src/app/features/blog/blog-detail/blog-detail.component.ts` — already builds a `BlogPosting` JSON-LD object including `wordCount` derived from `post.contentKeys.map(translate).join(' ')`. Word count auto-updates once content grows. Pattern to follow when adding `articleSection` and `dateModified`.
- `src/app/features/blog/blog-detail/blog-detail.component.html` — current article container is `<article ahramAnimate="fade-right" class="lg:col-span-2">` with a single `prose-custom` wrapper looping `<p>` over `contentKeys`. Add breadcrumb/reading time without restructuring.
- `src/app/core/services/seo.service.ts` — `updateSeo()` handles meta/canonical/OG; extension point for OG article tags.
- `src/app/core/services/transloco-loader.ts` — translations are loaded lazily at runtime via `HttpClient.get('/assets/i18n/{lang}.json')`. Important: longer JSON files do **not** affect the initial JS bundle — only the runtime fetch payload. This bounds the perf risk of doubling content volume.
- `src/assets/i18n/ar.json` and `src/assets/i18n/en.json` — `blog.posts.postN.{title, excerpt, content1..N}` keys live under `blog.posts`. Currently 50 post blocks × 5 keys each = 250 keys per locale. Plan adds ~150–250 new keys per locale.
- `src/app/shared/helpers/seo.helper.ts` — `buildBreadcrumbSchema()` already used; reuse pattern for any expanded breadcrumb step.

### Institutional Learnings

- From `CLAUDE.md` and prior memory: `transloco.translate(key)` is the right path for programmatic translation outside templates; SEO meta strings must be translated, not raw keys. The blog-detail component already follows this pattern correctly — preserve it.
- From `CLAUDE.md`: SEO translation keys live in the `seo.*` namespace; per-post overrides come via `titleKey` / `excerptKey` already wired into `SeoService.updateSeo()`. No new top-level SEO keys are needed.
- From `CLAUDE.md`: GSAP `from()` handles initial state in `ScrollAnimateDirective`. Don't manually set `opacity:0` on new HTML elements — keep using `[ahramAnimate]` directives for breadcrumb/reading-time additions.

### External References

- Schema.org `BlogPosting`: `articleSection`, `articleBody`, `wordCount`, `dateModified` are all supported and used by Google's rich-result tester. Reference: schema.org/BlogPosting.
- OpenGraph article object: `article:published_time`, `article:modified_time`, `article:section`, `article:tag` — established convention and surfaced by Facebook/LinkedIn share cards.
- Reading time heuristic: ~200 words/min for Arabic and English long-form content is the common Medium/HBR baseline.

## Key Technical Decisions

- **Append, don't restructure.** Existing `content1..content3` keys stay verbatim. New keys are appended (`content4`, `content5`, …). This honors the user's "same shape" choice and gives a clean, low-risk rollout where every post is editable independently.
- **Per-post growth target is a soft band, not a hard rule.** Aim for 6–8 paragraphs / ~500–700 words. Some shorter "company-news" posts may settle at 6, while flagship "market-insights" posts (Sadat City overview, master plan, ROI guide) may stretch to 7–8 paragraphs / ~700–900 words. Word count is a quality signal; padding to hit a target is forbidden.
- **Add `lastModified` and (optional) `readingMinutes` to `BlogPost`.** These are derived/authoring metadata that drive `dateModified` JSON-LD and visible reading-time UI. Both optional with sensible fallbacks (`lastModified` → falls back to `date`; `readingMinutes` → computed at render time from translated `articleBody.split(/\s+/).length / 200`).
- **Compute reading time at render, don't store it.** Storing it gets stale as content grows; computing from the translated `articleBody` (same source as `wordCount`) keeps both numbers consistent and bilingual-correct.
- **Smarter related posts: same category + tag-overlap rank, fall back to recency.** Move from `BLOG_POSTS.filter(...).slice(0,3)` to a small ranking function. Keeps SSR-safe (pure function over static data).
- **Extend `SeoService` with optional `article` payload.** New optional fields on `SeoUpdateInput` (`articleSection`, `articlePublishedTime`, `articleModifiedTime`, `articleTags`). When provided, emit OG article meta tags. When absent, behavior is identical — no impact on non-blog pages.
- **Authoring tone:** mirror the existing voice of each post's first three paragraphs; do not introduce new specific facts (zone numbers, road names, prices, project names, dates) unless they already appear in the post or in `data/projects.data.ts`. Stay grounded in `CLAUDE.md` Sadat City context and the existing translation set.
- **JSON-LD `dateModified` populates from `lastModified ?? date`.** Until we revise a post's text, both stay equal — schema-valid and honest.

## Open Questions

### Resolved During Planning

- **Does the BlogPost model need to change?** Yes, but minimally and additively: two optional fields (`lastModified?`, `readingMinutes?`) — neither is required by existing code paths. Resolved.
- **Will longer translation files bloat the bundle?** No — translations are lazy-loaded via `HttpClient` per locale (see `transloco-loader.ts`). Initial JS bundle is unaffected. Runtime fetch payload roughly doubles per locale (~80–120 KB each before gzip). Resolved.
- **Do we need separate `dateModified` semantics from `date`?** Yes — when we revise an old post, `dateModified` must update so search engines retreat from caching the stale version. Use `lastModified` field; fall back to `date` when unset. Resolved.
- **Should reading time be displayed only on detail or also on list cards?** Detail only for now. List cards already feel dense. Reconsider after content lands. Resolved.
- **What's the rendering strategy for the new content paragraphs?** Identical to the existing three: a flat `<p>` inside the `prose-custom` container via the same `@for (contentKey of post.contentKeys)`. The template change is purely additive (breadcrumbs, time, related-posts), not structural. Resolved.

### Deferred to Implementation

- Exact per-post paragraph counts (6 vs 7 vs 8). Decided per post based on subject depth during authoring.
- Final wording in both locales — drafts will be produced during implementation; user reviews before merge.
- Whether to add `<aside>` semantic tag to the existing sidebar or leave it as `<aside>` already (verify in template).
- Whether the existing `prebuild` sitemap script reads `lastModified` — if not, it stays as a follow-up; URLs don't change, so existing sitemap remains valid.

## High-Level Technical Design

Two parallel tracks, with the content track gated by a 3-post pilot before scaling.

```
                          ┌────────────────────────────────────┐
Track A (content)         │  Pilot 3 posts (1 per category)    │
                          │  AR + EN, target 6–7 paragraphs    │
                          └────────────────┬───────────────────┘
                                           │ user reviews tone/depth
                                           ▼
                          ┌────────────────────────────────────┐
                          │  Author remaining 47 posts in     │
                          │  category batches: company-news → │
                          │  investment-tips → market-insights│
                          └────────────────┬───────────────────┘
                                           │
Track B (html/seo)        ┌────────────────▼───────────────────┐
(can run in parallel)     │  Template + SeoService upgrades   │
                          │  no per-post coupling             │
                          └────────────────────────────────────┘
                                           │
                                           ▼
                                  Verification: rendering,
                                  JSON-LD, lint, build, prerender
```

Per-post content layout (illustrative, directional only):

```
content1  (existing) — context / opener
content2  (existing) — middle
content3  (existing) — closing thought
content4  (new)     — deepens a specific facet introduced in content2
content5  (new)     — connects to wider Sadat City / Al-Ahram context
content6  (new)     — practical implication for buyer / investor
[content7] (new, optional) — flagship / longer posts only
[content8] (new, optional) — flagship / longer posts only
```

## Implementation Units

- [ ] **Unit 1: Pilot content authoring (3 posts, AR + EN)**

**Goal:** Produce expanded copy for one post per category as a tone/depth template before scaling. Establishes the voice the remaining 47 posts will follow.

**Requirements:** R1, R2

**Dependencies:** None.

**Files:**
- Modify: `src/app/features/blog/data/blog.data.ts` (extend `contentKeys` for 3 pilot posts only)
- Modify: `src/assets/i18n/ar.json` (add new content keys for 3 pilot posts)
- Modify: `src/assets/i18n/en.json` (add new content keys for 3 pilot posts)

**Approach:**
- Pilot picks: `post-1` (market-insights, flagship Sadat City overview), `post-4` (investment-tips, "How to choose a developer"), `post-13` (company-news, Al-Ahram delivery commitment).
- For each pilot post, append 3 new paragraphs (`content4`, `content5`, `content6`) targeting ~90 words each.
- AR is the source of truth (default locale). EN is authored as an editorial translation, not a literal one — same intent, same facts, locale-natural phrasing.
- No new specific claims (figures, dates, zone names) unless already in the existing 3 paragraphs or in repo context.

**Patterns to follow:**
- Existing `blog.posts.post1.content1..content3` voice and sentence rhythm.
- Existing key naming convention: `blog.posts.postN.contentM`.

**Test scenarios:**
- Happy path: navigate to `/ar/blog/sadat-city-overview-2026` and `/en/blog/sadat-city-overview-2026`; the page renders 6 paragraphs, no missing-key flickers, hero/sidebar layout unchanged.
- Happy path: BlogPosting JSON-LD `wordCount` reflects the new total in both locales (inspect via DevTools).
- Edge case: `formatDate` pipe still renders the unchanged `date` correctly.

**Verification:**
- Visual review of the 3 pilot posts in both AR and EN; tone is consistent with the existing 3 paragraphs; no lorem-ipsum / generic filler.
- User signs off on tone before Unit 2 begins.

---

- [ ] **Unit 2: Author remaining 47 posts in category batches (AR + EN)**

**Goal:** Apply the pilot voice/depth across the rest of the catalog.

**Requirements:** R1, R2

**Dependencies:** Unit 1 (pilot signed off).

**Files:**
- Modify: `src/app/features/blog/data/blog.data.ts` (extend `contentKeys` for the remaining 47 posts)
- Modify: `src/assets/i18n/ar.json` (add new content keys for 47 posts)
- Modify: `src/assets/i18n/en.json` (add new content keys for 47 posts)

**Approach:**
- Process by category for tone consistency: `company-news` (5 posts) → `investment-tips` (12 posts) → `market-insights` (30 posts, split into two sub-batches of 15 to keep diff size reviewable).
- Per post: append 3 paragraphs as the default; flagship posts (`post-19` master plan, `post-27` ROI calculation, `post-41` market trends, `post-50` market outlook) get 4–5 to settle around 700–900 words.
- Maintain AR ↔ EN semantic parity. If a paragraph references a regional concept that doesn't translate cleanly, adapt the EN paragraph (still says the same thing for an English reader).
- Append-only diff in `data/blog.data.ts` — never modify existing array entries.

**Patterns to follow:**
- Pilot from Unit 1.
- Existing tag taxonomy already on each post — let the tags hint at which angles to deepen (e.g., post tagged `mortgage` should have a paragraph deepening the mortgage angle).

**Test scenarios:**
- Happy path: random sample 5 posts across categories in both locales; render, count paragraphs (≥6), spot-check word count via DevTools.
- Edge case: i18n key collision — fail-fast with `transloco.translate` returning the key string. Verify all new keys are unique under their `blog.posts.postN.*` namespace.
- Error path: malformed JSON breaks the i18n fetch; verify `npm run build` and `npm start` cleanly load both locales.
- Integration: `BlogDetailComponent.ngOnInit` builds the JSON-LD `articleBody` from `contentKeys.map(translate).join(' ')`. Confirm `wordCount` for each sampled post is in the 500–900 band.

**Verification:**
- All 50 posts have ≥6 entries in `contentKeys`.
- All referenced keys exist in both `ar.json` and `en.json` (no missing-key console warnings during smoke test).
- `npm run lint` clean; `npm run build` clean; both prerendered locales for blog list and the 4 sampled detail routes succeed.

---

- [ ] **Unit 3: Add optional `lastModified` and content-derived reading time to `BlogPost`**

**Goal:** Introduce the metadata needed for `dateModified` JSON-LD and for visible reading-time UI without breaking existing code.

**Requirements:** R3, R5

**Dependencies:** None (parallelizable with Units 1–2).

**Files:**
- Modify: `src/app/features/blog/models/blog.models.ts` (add `readonly lastModified?: string` to `BlogPost`)
- Modify: `src/app/features/blog/data/blog.data.ts` (no edits needed initially — field is optional; future revisions set it on the post they revise)
- Modify: `src/app/features/blog/blog-detail/blog-detail.component.ts` (compute `readingMinutes` from translated content; pass `dateModified` and `articleSection` into JSON-LD)

**Approach:**
- `lastModified` is opt-in metadata; absent on every post initially. JSON-LD falls back to `post.date` when absent.
- Reading time computed in the component as `Math.max(1, Math.round(articleBody.split(/\s+/).length / 200))` and exposed as a `computed()` signal so it auto-recomputes on locale switch.
- `articleSection` populated from a small mapping: `company-news` → "Company News", `market-insights` → "Market Insights", `investment-tips` → "Investment Tips" (translated via existing `blog.filters.*` keys).

**Patterns to follow:**
- `BlogDetailComponent.post = computed(...)` and `recentPosts = computed(...)` — add `readingMinutes` as another `computed()`.

**Test scenarios:**
- Happy path: post without `lastModified` produces JSON-LD where `dateModified === datePublished === post.date`.
- Happy path: post with `lastModified: '2026-05-01'` produces JSON-LD with `datePublished: post.date` and `dateModified: '2026-05-01'`.
- Edge case: very short post (theoretical 1 paragraph) yields `readingMinutes: 1` (clamped, no zero or NaN).
- Integration: switching locale via the language toggle updates `readingMinutes` if AR/EN word counts differ enough to flip the rounded minute.

**Verification:**
- `BlogPosting` JSON-LD includes both `datePublished` and `dateModified` plus `articleSection` for every post.
- TypeScript compiles with no errors; existing posts (no `lastModified`) still type-check.

---

- [ ] **Unit 4: Extend `SeoService` to emit OpenGraph article tags**

**Goal:** Add `article:published_time`, `article:modified_time`, `article:section`, and `article:tag` meta tags when the page is a blog post.

**Requirements:** R5

**Dependencies:** Unit 3 (`articleSection` and `dateModified` data points).

**Files:**
- Modify: `src/app/core/services/seo.service.ts` (extend `SeoUpdateInput` with optional `article?: { publishedTime; modifiedTime; section; tags?: string[] }`; emit corresponding `<meta property="article:*">` tags when present; remove them when navigating to a non-article page)
- Modify: `src/app/features/blog/blog-detail/blog-detail.component.ts` (pass article payload into `seo.updateSeo({ ..., article: {...} })`)

**Approach:**
- Reuse the existing meta-management pattern in `SeoService` — same approach as `og:type` / `og:image`.
- Stale-tag cleanup: when `updateSeo` runs without an `article` payload, ensure prior `article:*` tags are removed (leftover tags on a non-blog page would be misleading to crawlers).

**Patterns to follow:**
- Existing `updateSeo` meta `set/remove` pattern; existing `clearJsonLd` cleanup pattern.

**Test scenarios:**
- Happy path: load `/ar/blog/sadat-city-overview-2026`; confirm 4 `article:*` meta tags present in `<head>` with correct values.
- Integration: navigate from a blog post to `/ar/about`; confirm the four `article:*` tags are removed.
- Edge case: post with empty `tags` array emits zero `article:tag` meta tags but still emits the others.
- Error path: missing optional fields don't throw; behavior degrades to "no article tags emitted."

**Verification:**
- View-source on a detail page shows the article tags; view-source on a non-article page shows none.

---

- [ ] **Unit 5: Upgrade `BlogDetailComponent` template with breadcrumbs, reading time, ISO datetime, and semantic structure**

**Goal:** Improve on-page SEO and UX without restructuring per-post content. All changes apply once and benefit every post.

**Requirements:** R4, R7

**Dependencies:** Unit 3 (reading-time signal).

**Files:**
- Modify: `src/app/features/blog/blog-detail/blog-detail.component.html`
- Modify: `src/app/features/blog/blog-detail/blog-detail.component.scss` (only if visible breadcrumb needs minor styling not covered by existing utilities)
- Modify: `src/app/features/blog/blog-detail/blog-detail.component.ts` (expose breadcrumb items as a computed signal so the template can render them via `@for`)

**Approach:**
- Breadcrumbs: render visible `Home › Blog › <Title>` above the H1, using the existing `[localizeRoute]` pipe; mirror the JSON-LD breadcrumb already emitted. Use `<nav aria-label="Breadcrumb">` with an ordered list.
- Reading time: render after the date as `· {{ readingMinutes() }} min read` (translated key `blog.readingTime` with `{minutes}` interpolation, plus `blog.readingTimeShort` for AR — i18n decides phrasing).
- `<time>` element: add `[attr.datetime]="post.date"` so the ISO string is on the element, while the visible text remains formatted via the `formatDate` pipe.
- Semantic structure: wrap the article body content in `<section aria-labelledby="article-title">` and add `id="article-title"` to the H1; wrap the share block in `<footer>`. The sidebar is already `<aside>` — verify and keep.
- Use `prefers-reduced-motion` already handled by `ScrollAnimateDirective`; do not add new animations.
- Add new i18n keys: `blog.breadcrumb.home`, `blog.breadcrumb.blog`, `blog.readingTime` (AR + EN). Reuse existing `header.home`, `header.blog` if their phrasing fits.

**Patterns to follow:**
- Existing breadcrumb-on-other-pages pattern in the project (search for `aria-label="Breadcrumb"` to find precedent; if none, use a clean ordered-list pattern).
- Existing `*transloco="let t"` directive at the top of the template.

**Test scenarios:**
- Happy path: breadcrumbs render in both locales; clicking each link navigates correctly with the locale prefix.
- Happy path: reading time shows "5 min read" (or AR equivalent) on the Sadat City overview post.
- Edge case: very short post (e.g., a hypothetical 1-paragraph post) shows "1 min read", not "0".
- Integration: `<time datetime>` attribute matches `post.date` exactly; `view-source` confirms.
- Edge case: switching locale recomputes reading time (AR words may parse differently from EN).
- Error path: `post()` is undefined (404 redirect path) — template guards with `@if (post(); as post)` already; no NPE.

**Verification:**
- Lighthouse SEO score on a sample post stays ≥ current score (ideally improves with the added structured data and semantic tags).
- Manual a11y check: the new breadcrumb is reachable via keyboard and has the `aria-label`.

---

- [ ] **Unit 6: Smarter related-posts ranking**

**Goal:** Replace the naive "first 3 non-current" sidebar list with a same-category + tag-overlap ranked list. Improves internal linking signals.

**Requirements:** R6

**Dependencies:** None (independent of Units 1–5; touches sidebar only).

**Files:**
- Modify: `src/app/features/blog/blog-detail/blog-detail.component.ts` (replace `recentPosts` computation)

**Approach:**
- Build a small ranking function: same-category posts get +5; +1 per tag overlapping with the current post; recency tiebreaker. Take top 3 non-current.
- Pure function over the static `BLOG_POSTS` array; SSR-safe.

**Patterns to follow:**
- Keep it as a `computed()` signal driven by `slug()`.

**Test scenarios:**
- Happy path: on `post-1` (market-insights, tags include `sadat-city`, `overview`), the top 3 are other market-insights posts that share the most tags.
- Edge case: a post in a category with only 1 sibling — fallback fills with cross-category posts ranked by tag overlap, then recency.
- Edge case: a post with no tag overlaps with anyone — falls back to most-recent same-category, then most-recent overall.
- Integration: clicking through related posts updates `slug()`, which re-runs the computation; new related list appears.

**Verification:**
- Visual: open three different posts and confirm the related list differs and feels relevant.
- Unit-test-like spot-check: pick a known post, manually confirm the top-ranked related post matches the algorithm's intent.

---

- [ ] **Unit 7: End-to-end verification (build, prerender, lint, JSON-LD, runtime)**

**Goal:** Confirm the change holds together: types compile, lints pass, build succeeds, all blog routes prerender, JSON-LD validates, no missing i18n keys, and runtime SEO meta is intact.

**Requirements:** R7

**Dependencies:** Units 1–6 complete.

**Files:**
- No production file changes. May add a small `scripts/verify-blog-content.mjs` helper if needed to assert each post has ≥6 keys present in both locales, but only if a manual spot-check feels insufficient.

**Approach:**
- Run `npm run lint`, `npm run format:check`, `npm run build`.
- Spot-check 5 posts (one company-news, two investment-tips, two market-insights) in both `ar` and `en`:
  - Hero, breadcrumbs, reading time render
  - 6+ paragraphs render with no flicker / missing-key strings
  - JSON-LD validates via Google Rich Results Test (manual paste)
  - OG article tags appear in `<head>`
  - Related posts feel relevant
- Confirm prerendered routes: blog list (ar/en) + sampled detail routes via `RenderMode.Server`.

**Patterns to follow:**
- Existing build/prerender pipeline; nothing custom.

**Test scenarios:**
- Test expectation: none — this unit is verification of prior units, not new behavior.

**Verification:**
- Zero new lint warnings.
- Zero build warnings beyond the pre-existing baseline noted in `CLAUDE.md`.
- Initial JS bundle size unchanged (translations are lazy-loaded; verify via `npm run build` size output).
- Both `ar.json` and `en.json` are valid JSON.
- Blog detail page weight (HTML + JSON for one locale) increases proportionally to content; document the new size in the PR description.

## System-Wide Impact

- **Interaction graph:** `BlogDetailComponent` consumes `SeoService` and `BLOG_POSTS`. Extending `SeoService` with optional `article` payload is purely additive — non-blog pages do not pass it and behavior is unchanged. Translations live behind the existing `TranslocoHttpLoader` HTTP fetch, so the loader sees larger but identically-shaped JSON.
- **Error propagation:** Missing `lastModified` falls back to `date`. Missing `tags` produces zero `article:tag` tags. Missing translation keys fall back to the key string (existing Transloco behavior). All degrade gracefully.
- **State lifecycle risks:** Reading time and related-posts are pure `computed()` over signals — no caching/invalidation concerns. JSON-LD is cleared per navigation by the existing `SeoService.clearJsonLd()` flow.
- **API surface parity:** `BlogPost` model gains optional fields only. Both blog list and blog detail consume `BLOG_POSTS`; the list page does not need any change because it doesn't render content — only title, excerpt, image, date, category. Verify by reading `blog-list.component.html`.
- **Integration coverage:** The pivotal cross-layer behavior is `contentKeys → translate → article body → wordCount in JSON-LD`. Spot-check this in Unit 7 across both locales.
- **Unchanged invariants:** Public blog URLs (`/:locale/blog`, `/:locale/blog/:slug`) are unchanged. Sitemap URL set is unchanged (no new posts). The `BlogPost` interface remains structurally compatible: only optional fields are added. Existing pages that don't pass the new optional `article` field to `SeoService` continue to behave identically.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Translation file size doubles, slowing first-paint i18n fetch on 3G. | Translations are HTTP-fetched lazily and cached by the service worker / browser cache. New JSON adds ~80–120 KB per locale before gzip; ~25–35 KB after gzip. Acceptable; revisit only if Lighthouse shows regression. |
| Inconsistent tone across 50 posts when authoring at scale. | Pilot Unit (Unit 1) sets the voice; user reviews before scaling. Category batching keeps sibling posts coherent. |
| Hallucinated facts in new paragraphs (zone numbers, road names, dates that don't exist). | Hard rule: only assert facts present in the existing 3 paragraphs of the same post or in repo-documented Sadat City context. Reviewer flags any new specific claim during PR review. |
| AR/EN drift — translations diverge in meaning over the 50 posts. | Author each post AR-first, then EN as an editorial translation; reviewer compares semantic parity for sampled posts. |
| Prerender slowdown — more content per blog detail = more SSR rendering. | Detail routes are `RenderMode.Server` (not `Prerender`), so build time is not impacted. Blog list is prerendered but list cards don't render full content. No regression expected. |
| `BlogPosting.wordCount` becoming the user-visible "word count" but counting i18n keys' raw text including punctuation. | Same logic already runs today; behavior is consistent. The number is informational for crawlers, not displayed. |
| Adding `article:*` meta tags to `<head>` and forgetting to remove them on navigation away (stale tags on next route). | Unit 4 explicitly tests cleanup on cross-route navigation. SSR is safe because each route renders fresh. |

## Documentation / Operational Notes

- Update `CLAUDE.md` "Known Build Notes" if bundle/prerender numbers change materially.
- Update `docs/I18N-GUIDE.md` if a new pattern (e.g., `blog.posts.postN.contentN+`) is worth codifying.
- No deployment/migration concerns. Static SPA + lazy i18n; first deploy after merge ships everything.
- Optional follow-up plan: introduce structured headings (H2) inside content for further SEO upside — this would be a deliberate scope expansion beyond the current "same shape" choice.

## Sources & References

- Related code: `src/app/features/blog/`, `src/app/core/services/seo.service.ts`, `src/app/core/services/transloco-loader.ts`, `src/assets/i18n/{ar,en}.json`.
- Related plans: `docs/plans/2026-04-29-001-feat-replace-blog-with-sadat-city-content-plan.md` (sets the current 50-post catalog this plan expands on top of).
- Related catalog: `docs/plans/2026-04-29-001-blog-topic-catalog.md` (per-post topic intent — useful when authoring new paragraphs).
- External: schema.org/BlogPosting, ogp.me/article.
