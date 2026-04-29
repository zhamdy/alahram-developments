---
title: 'feat: Replace blog content with researched Sadat City catalog (up to 50 posts)'
type: feat
status: active
date: 2026-04-29
---

# feat: Replace blog content with researched Sadat City catalog (up to 50 posts)

## Overview

Remove the existing 10 blog posts and replace them with up to 50 new posts focused on Sadat City — its zones, infrastructure, real estate investment, education, services, and Al-Ahram-specific company news. Topics are sourced from competitor blog research (`aqargroup.org/blog`, `bussmarealestate.com/blog`) and authoritative sources (GAFI, invest-in-egypt, Oxford Business Group, recent industry news), then **rewritten as original Arabic + English content** to avoid copyright issues and align with Al-Ahram's voice.

The data layer (`blog.data.ts`) and translation files (`ar.json`, `en.json`) carry the change. Component code, routing, SEO service, and sitemap generator already work post-agnostically and need no structural changes — the sitemap script reads slugs from `blog.data.ts` automatically.

## Problem Frame

The current 10 posts are mostly placeholder-like with thin content (~200 chars per content key) and limited topical depth. They do not establish Al-Ahram as a Sadat City authority, which is the primary commercial differentiator. Competitors like Aqar Group and Bussma Real Estate publish broader Sadat-focused content (zones 14/21, technology zone, central axis, mall guides, university coverage, finance guides) that captures organic search intent for Sadat City buyers.

## Requirements Trace

- R1. Remove all 10 existing blog posts (data + translations) cleanly without breaking the build, SSR prerender, or sitemap.
- R2. Add up to 50 new blog posts focused exclusively on Sadat City and Al-Ahram-relevant topics.
- R3. All new content is original Arabic + English copy — no direct translation/copy from referenced competitor blogs.
- R4. Reuse the existing 3 categories (`company-news`, `market-insights`, `investment-tips`) — no schema, filter UI, or i18n filter-label changes.
- R5. Images use the existing `ImageFallbackDirective` placeholder strategy. New images are out of scope for this plan and added later separately.
- R6. Each post has unique slug, ISO date, English/Arabic title + excerpt, and at least 3 content paragraphs per locale, fully consumed by the existing `BlogDetailComponent` SEO/JSON-LD pipeline.
- R7. Sitemap regenerates with all new slugs (3.0.x of `xhtml:link` hreflang per post stays correct).
- R8. SSR `RenderMode.Server` for `:locale/blog/:slug` continues to serve every new post.

## Scope Boundaries

- **Out of scope:** producing new blog images, RTL/LTR layout work, blog filter UI changes, category taxonomy changes, blog listing pagination, blog search, comments/sharing platform expansion, RSS feed, redirects from old slugs (hard cutover), CMS or backend integration.
- **Non-goal:** preserving any old slugs. Old URLs return the existing 404 fallback. No 301 redirects authored.
- **Non-goal:** adding admin/authoring tooling. Posts remain a static TypeScript array.

## Context & Research

### Relevant Code and Patterns

- `src/app/features/blog/data/blog.data.ts` — current `BLOG_POSTS` constant (10 items) with `BlogPost[]` shape.
- `src/app/features/blog/models/blog.models.ts` — `BlogPost` interface; readonly fields: `id`, `slug`, `titleKey`, `excerptKey`, `contentKeys[]`, `author`, `date`, `imageUrl`, `category`, `tags[]`. `BlogCategory = 'company-news' | 'market-insights' | 'investment-tips'`.
- `src/app/features/blog/blog-list/blog-list.component.ts` — consumes `BLOG_POSTS` directly, filters by category signal. No code change needed.
- `src/app/features/blog/blog-detail/blog-detail.component.ts` — looks up post by slug, builds BlogPosting JSON-LD from `contentKeys`. No code change needed.
- `src/assets/i18n/ar.json` and `src/assets/i18n/en.json` — keys live under `blog.posts.postN.{title,excerpt,content1,content2,content3}`. Pattern is rigid: 3 content keys per post.
- `scripts/generate-sitemap.js` — reads `blog.data.ts` text, regex-extracts `slug` and `date`, emits sitemap entries with hreflang alternates for ar/en. No script change needed; verify output post-implementation.
- `src/app/app.routes.server.ts` — `:locale/blog/:slug` is `RenderMode.Server`, so any number of posts is fine (no prerender list to update).
- `src/app/features/blog/data/blog.data.ts` slug convention: kebab-case English ASCII (e.g., `sadat-city-golden-zone-investment`). Keep this even for Arabic-translated topics — Latin slugs match SEO-friendly URLs and avoid percent-encoding noise.

### Institutional Learnings

- Memory note (project): "Don't pass translation keys (like `project.nameKey`) directly to SEO — translate first with `transloco.translate()`." `BlogDetailComponent` already follows this; new content must keep the `titleKey`/`excerptKey` pattern.
- Memory note (project): SEO title suffix is locale-aware (Arabic = `الأهرام للتطوير العقاري`, English = `Al-Ahram Developments`) — `SeoService.updateSeo()` handles this; nothing to do per-post.
- Sitemap regeneration runs automatically via `prebuild` script. Verify after the data swap.

### External References

Topic seeds drawn from research (rewritten, not copied):

- `aqargroup.org/blog/` — Sadat City Private University, City Club, Distinguished District, noise pollution, compounds guide, real estate investment opportunities, construction phases, university education.
- `bussmarealestate.com/blog/` — best zones in Sadat, central axis (المحور المركزي), Zone 14, Zone 21, technology zone, sports clubs, malls, choosing a real developer (8 steps), real estate investment types, commercial unit investment, real estate finance/mortgage.
- `gafi.gov.eg` PDF on Sadat City Industrial Zone — 5 industrial zones over 5 million m², 250 factories, Cairo-Alex desert road location, 30,000 feddan green belt, WHO top-10 industrial-community designation.
- `invest-gate.me`, `oxfordbusinessgroup.com` — Sadat textile complex (568 plants, $2.2B investment, 160k jobs target) and Egypt industrial real estate trajectory.
- `egygatenews.com` (April 2026) — GEDIX Developments EGP 6.5B Sadat City project, 36 feddan integrated community model, mixed apartment/villa compounds + first internationally-rated hotel — illustrates current investor confidence in Sadat City.

## Key Technical Decisions

- **Hard cutover, no slug redirects.** Old slugs were placeholder content; not worth maintaining redirect aliases. Decision rationale: no public link equity worth preserving (site is pre-launch enhancement branch); avoids carrying dead routes.
- **Static TypeScript array stays.** No CMS, no JSON file split, no backend. Decision rationale: keeps SSR prerender behavior identical, keeps build-time sitemap generation working, matches the rest of the codebase's content pattern (`blog.data.ts`, `projects.data.ts`).
- **Content key shape stays rigid: 3 paragraphs per post (`content1`/`content2`/`content3`).** Decision rationale: `BlogDetailComponent` template iterates `contentKeys`, so any count works at runtime, but keeping it rigid at 3 means: (a) translation files stay diff-readable, (b) reviewers can spot-check coverage uniformly, (c) SEO `wordCount` stays predictable. If a topic genuinely needs 4-5 paragraphs, append additional `contentN` keys for that post only and add to its `contentKeys` array.
- **Latin kebab-case slugs only.** Even for Arabic-first audience. Decision rationale: avoids `%D9%85%D8%AF%D9%8A%D9%86%D8%A9` noise in URLs, easier sharing, search-engine-friendly, matches the existing convention.
- **Author field stays `'الأهرام للتطوير العقاري'` for all posts.** Decision rationale: schema already declares `author` as a fixed string at the data layer; per-author bylines are out of scope.
- **Reuse `assets/images/blog/blog-N.jpg` pattern.** New posts reference paths `assets/images/blog/blog-1.jpg` through `assets/images/blog/blog-50.jpg`. The directory currently exists but is empty — `ImageFallbackDirective` substitutes `logo-transparent.png` until real images land. Decision rationale: keeps the data shape stable, makes image production a separate trackable task, no code change needed.
- **Date distribution.** Spread `date` field across the last ~12 months ending 2026-04-29 to give the listing page a realistic chronology and let the recent-posts widget surface recent items first. Avoid clustering all dates on one day.
- **Category distribution target.** Roughly: ~10-12 `company-news` (Al-Ahram project updates, milestones, launches), ~25-30 `market-insights` (zones, infrastructure, market analysis, city features), ~10-15 `investment-tips` (buyer guides, finance, decision frameworks). Tunable during topic catalog drafting.

## Open Questions

### Resolved During Planning

- **Q: Source style — direct translation or original?** A: Original rewrite (user-confirmed).
- **Q: Post count?** A: Up to 50 (user-confirmed).
- **Q: Image strategy?** A: Placeholder + fallback via existing directive (user-confirmed).
- **Q: Categories?** A: Keep current 3 (user-confirmed).
- **Q: Should old slugs redirect?** A: No — hard cutover (decided above).
- **Q: Slug language?** A: Latin kebab-case only (decided above).

### Deferred to Implementation

- **Final exact topic list and slugs for all 50 posts.** Unit 1 produces the catalog. Reviewer approval of the catalog gates Units 2-4.
- **Per-post tag arrays.** Will be drafted during catalog production; tags should be lowercase kebab-case and no more than 5 per post.
- **Whether to ship all 50 in one PR or split into batches of ~25.** Defer to implementer judgment based on PR size at the end of Unit 4.
- **Real images.** Tracked separately; this plan only ensures the fallback path works.

## Implementation Units

- [ ] **Unit 1: Produce Sadat City topic catalog (50 entries)**

**Goal:** Deliver a reviewable, structured catalog of up to 50 blog topics — each with a Latin slug, category assignment, ISO date, tag list, and a one-line English + Arabic angle/synopsis. This is the source-of-truth document the rewrite work consumes.

**Requirements:** R2, R3, R4

**Dependencies:** None.

**Files:**
- Create: `docs/plans/2026-04-29-001-blog-topic-catalog.md` (companion artifact; not a runtime file)

**Approach:**
- Group topics into the existing 3 categories with the distribution target above.
- For each entry capture: `slug`, `category`, `date` (ISO), `tags[]` (≤5), `EN angle` (≤25 words), `AR angle` (≤25 words).
- Source from research notes in this plan; ensure no two slugs collide and no slug matches an old slug from `blog.data.ts`.
- Cover at minimum: Sadat overview, golden zone, zones 14/21/the others by number, technology zone, distinguished district, central axis, industrial zones, university (private + public), schools, mosques, City Club + clubs, malls, healthcare, transportation, green belt, compounds guide, master plan, infrastructure impact, market 2026, future trends, mortgage, payment plans, off-plan vs delivered, ROI thinking, choosing a developer, contract due diligence, construction phases, finishing phases, apartment-size selection, villa vs apartment, family vs investor framing, foreign ownership, taxes, utilities, Al-Ahram project 865 update, Al-Ahram project 868 launch, Al-Ahram milestones, customer-experience pieces, Al-Ahram delivery commitments, Sadat vs other new cities, etc.
- Mark Al-Ahram-specific entries clearly so reviewers can flag any factual claims that require internal verification.

**Patterns to follow:**
- Existing `BLOG_POSTS` field naming and category values from `src/app/features/blog/data/blog.data.ts`.

**Test scenarios:**
- Test expectation: none — catalog is a planning artifact, not runtime code. Verification is reviewer sign-off.

**Verification:**
- All 50 (or fewer, if a topic genuinely doesn't earn its slot) entries are present and reviewer-approved.
- No slug collisions; no slug matches the 10 existing slugs.
- Category distribution is within the target band.

- [ ] **Unit 2: Author original Arabic + English content for every cataloged post**

**Goal:** For each catalog entry, write a `title`, `excerpt` (≤160 chars for SEO meta description fit), and 3 paragraphs of original body content (`content1`/`content2`/`content3`) in **both** Arabic and English. Content must be original prose — no direct copying or sentence-level translation from referenced competitor blogs.

**Requirements:** R3, R6

**Dependencies:** Unit 1 (catalog approved).

**Files:**
- Create: `docs/plans/2026-04-29-001-blog-content-drafts/` (working folder for draft markdown per post; deleted after Unit 3 lands)
  - One file per post: `postNN-<slug>.md` with sections `## Title (EN/AR)`, `## Excerpt (EN/AR)`, `## Content 1-3 (EN/AR)`.

**Approach:**
- Use research notes plus public-domain facts (GAFI, news outlets, government data) as input. Paraphrase, structure, and frame in Al-Ahram's voice.
- Each `content` paragraph: 80-150 words. Total per-post body: ~300-450 words per locale.
- Excerpts: action-oriented, end with a soft hook (no emojis).
- Consistent terminology: use «الأهرام للتطوير العقاري» / «Al-Ahram Developments», «مدينة السادات» / «Sadat City», «منوفية» / «Monufia», «الطريق الصحراوي» / «Cairo-Alexandria Desert Road».
- Avoid factual claims about Al-Ahram-specific products or pricing that aren't already in the projects/zones data.

**Patterns to follow:**
- Existing `ar.json` blog post style (formal modern standard Arabic, no diacritics).
- Existing `en.json` blog post style (clear, professional, second-person where natural).

**Test scenarios:**
- **Happy path:** every catalog entry has a complete draft file with title/excerpt/content1-3 in both locales.
- **Edge case:** excerpt length is ≤160 characters in both locales (SEO meta description boundary).
- **Edge case:** no two posts have identical titles or near-identical excerpts.
- **Quality check:** spot-check 5 random posts against the cited source pages (aqargroup, bussma) — no shared phrasing of >7 consecutive words.
- Test expectation: prose drafts are reviewer-validated, not unit-tested.

**Verification:**
- Reviewer-approved drafts for every post in the catalog.
- Spot-check originality pass.

- [ ] **Unit 3: Replace `BLOG_POSTS` data and translation keys**

**Goal:** Atomic swap of `blog.data.ts`, `ar.json`, and `en.json` so the runtime serves only the new posts.

**Requirements:** R1, R2, R6

**Dependencies:** Unit 2 (drafts approved).

**Execution note:** Land as one commit. Partial swaps (data updated but translations stale) cause `transloco.translate()` to render raw key paths in the listing UI.

**Files:**
- Modify: `src/app/features/blog/data/blog.data.ts`
- Modify: `src/assets/i18n/ar.json` (replace entire `blog.posts` block)
- Modify: `src/assets/i18n/en.json` (replace entire `blog.posts` block)

**Approach:**
- Preserve `blog.hero`, `blog.filters`, `blog.readMore`, `blog.backToBlog`, `blog.share`, `blog.recentPosts` unchanged in both translation files.
- Replace `blog.posts` with `post1`..`postN` keys (N ≤ 50) where each entry has `title`, `excerpt`, `content1`, `content2`, `content3`.
- In `blog.data.ts`: build `BLOG_POSTS` as a new readonly array, IDs `post-1`..`post-N`, slugs from the catalog, `imageUrl: 'assets/images/blog/blog-N.jpg'`, dates from the catalog, category from the catalog, tags from the catalog, `author: 'الأهرام للتطوير العقاري'`.
- Sort by `date` descending in source so the listing shows newest first without runtime sort cost.
- Delete the old draft folder `docs/plans/2026-04-29-001-blog-content-drafts/` after the diff lands.

**Patterns to follow:**
- Existing `BLOG_POSTS` field ordering and indentation in `src/app/features/blog/data/blog.data.ts`.
- Existing `ar.json` indent/quoting style (2 spaces, double quotes, no trailing commas).

**Test scenarios:**
- **Happy path:** `npm run lint` passes (TypeScript strict, no unused imports, readonly types satisfied).
- **Happy path:** `npm run build` succeeds with no NG-prefixed errors.
- **Happy path:** dev server (`npm start`) renders `/ar/blog` and `/en/blog` with N visible cards, all titles/excerpts in the active locale (no raw `blog.posts.postN.title` strings).
- **Happy path:** clicking 3 random posts in each locale loads the detail page with correctly translated 3-paragraph body.
- **Happy path:** the JSON-LD `BlogPosting` script tag in detail pages contains a non-empty `articleBody` and a `wordCount` >0.
- **Edge case:** filter buttons (All / Company News / Market Insights / Investment Tips) each return ≥1 post.
- **Edge case:** detail page for a deleted old slug (`/ar/blog/sadat-city-golden-zone-investment`) navigates to the 404 fallback (existing behavior; verify it still works).
- **Edge case:** language toggle from `/en/blog/<slug>` to `/ar/blog/<slug>` re-renders content in Arabic with RTL direction.
- **Integration:** SSR — `npm run build && npm run start:ssr`, then curl `/ar/blog` and a sample `/ar/blog/<new-slug>` — both return 200 with content present in the initial HTML.
- **Integration:** image fallback — temporarily reference a missing image path on one post, confirm `ImageFallbackDirective` swaps in `logo-transparent.png` (existing behavior; smoke check only).

**Verification:**
- All test scenarios pass.
- `git status` shows changes limited to the 3 expected files plus deletion of the temporary draft folder.

- [ ] **Unit 4: Verify sitemap, SSR routes, and SEO outputs**

**Goal:** Confirm post-swap that the site infrastructure surfaces the new content correctly to crawlers and SSR consumers.

**Requirements:** R7, R8

**Dependencies:** Unit 3.

**Files:**
- Inspect (no edit): `public/sitemap.xml` (regenerated by `scripts/generate-sitemap.js`).
- Inspect (no edit): `src/app/app.routes.server.ts` — confirm `:locale/blog/:slug` Server-mode route covers all new slugs (no list to update).
- Inspect (no edit): a sample SSR HTML response for a new slug.

**Approach:**
- Run `npm run build` to trigger the `prebuild` sitemap regeneration.
- Open `public/sitemap.xml` and confirm: each new slug appears under `/ar/blog/<slug>` and `/en/blog/<slug>`; each has 3 `xhtml:link` alternates (`ar`, `en`, `x-default`); old slugs are absent.
- Boot SSR (`npm run start:ssr`), curl 2-3 random new-slug URLs in each locale, and grep the response for: the post title, the JSON-LD `BlogPosting` script tag, the canonical link tag with the locale prefix.
- Run `npm run lint` once more to catch any straggler.

**Patterns to follow:**
- Existing memory note: "Sitemap covers ~32 URLs (16 routes × 2 locales) with `xhtml:link` hreflang alternates" — verify the new total = (16 base routes − 10 old blog slugs + N new blog slugs) × 2.

**Test scenarios:**
- **Happy path:** sitemap entry count matches expected total.
- **Happy path:** SSR response for a new slug returns 200 and includes the localized title in `<title>` and Open Graph tags.
- **Happy path:** SSR response includes a `<link rel="canonical" href=".../{lang}/blog/{slug}">` matching the active locale.
- **Edge case:** sitemap contains zero references to the 10 old slugs.
- **Edge case:** SSR response for an old slug (`/ar/blog/sadat-city-golden-zone-investment`) renders the 404 fallback HTML (existing behavior).
- **Integration:** Google Rich Results test (manual, optional) on one new slug — JSON-LD parses without warnings.

**Verification:**
- All test scenarios pass.
- No regressions in non-blog routes (spot-check `/ar`, `/en`, `/ar/projects`).

## System-Wide Impact

- **Interaction graph:** Listing component reads `BLOG_POSTS` directly; detail component reads it; sitemap script reads the file as text. No other code references the array.
- **Error propagation:** Bad translation key references render the literal key path on screen — caught by manual smoke test in Unit 3. Bad `imageUrl` falls back via `ImageFallbackDirective`. Bad `slug` produces a 404 navigation.
- **State lifecycle risks:** None — content is static at build time. SSR prerender list does not include `:locale/blog/:slug` (it's `RenderMode.Server`), so no stale prerender artifacts.
- **API surface parity:** No public API surface; data file is a private export consumed only by the blog feature and the sitemap script.
- **Integration coverage:** The sitemap regex parser in `scripts/generate-sitemap.js` is the only fragile coupling — it depends on `slug:` and `date:` field formatting in `blog.data.ts`. Keep field formatting identical to the existing entries (single quotes, `slug: 'kebab-case'`, `date: 'YYYY-MM-DD'`).
- **Unchanged invariants:** `BlogCategory` union, `BlogPost` interface shape, blog routes (`/blog`, `/blog/:slug`), filter UI, `SeoService.updateSeo()` behavior, JSON-LD shape on detail pages, hreflang alternate structure, and translation namespace for `blog.hero`/`blog.filters`/etc. All preserved.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Content originality challenge — paraphrased phrasing too close to source | Spot-check Unit 2 outputs against source URLs; reject any draft with >7 consecutive shared words and rewrite. |
| Sitemap regex parser breaks on a non-standard slug/date format | Mirror existing field formatting exactly; verify `public/sitemap.xml` content explicitly in Unit 4. |
| Translation drift between `ar.json` and `en.json` (key in one but not the other) | After Unit 3 swap, run a quick diff of the two JSON `blog.posts` blocks to confirm identical key sets. |
| Catalog scope creep — chasing 50 entries pads quality | Treat 50 as a ceiling, not a target. Drop topics that don't genuinely earn placement. |
| Old-slug 404s dent any external backlinks | Pre-launch branch; backlink risk is negligible. Document for SEO team if the situation changes. |
| Image directory is empty — bare-file-not-found errors in dev console | `ImageFallbackDirective` already handles this; cosmetic console noise is acceptable until images land. |

## Documentation / Operational Notes

- After Unit 3 lands, update the project memory note (`MEMORY.md`) entry under "Project Zone/Category Hierarchy" or add a new line under blog notes if any non-obvious decision crystallizes (e.g., final post count, category distribution).
- No CHANGELOG, runbook, or rollout flag needed — content swap deploys with the next release.
- If a future iteration wants to reintroduce some old slugs as redirects, add a `legacySlugs: string[]` map and a small `BlogDetailComponent` lookup before the 404 fallback. Tracked as a follow-up, not in this plan.

## Sources & References

- Current data: `src/app/features/blog/data/blog.data.ts`
- Current translations: `src/assets/i18n/ar.json`, `src/assets/i18n/en.json`
- Components: `src/app/features/blog/blog-list/blog-list.component.ts`, `src/app/features/blog/blog-detail/blog-detail.component.ts`
- Sitemap generator: `scripts/generate-sitemap.js`
- SSR config: `src/app/app.routes.server.ts`
- Topic-research sources (paraphrased only): `https://aqargroup.org/blog/`, `https://bussmarealestate.com/blog/`, `https://www.gafi.gov.eg/English/StartaBusiness/InvestmentZones/`, `https://invest-gate.me/features/egypts-future-is-industrial-real-estate/`, `https://www.egygatenews.com/2026/04/gedix-developments-introduces-its.html`
