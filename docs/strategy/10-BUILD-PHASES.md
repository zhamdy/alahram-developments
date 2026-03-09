# 10 — Build Phases Roadmap

## Overview

| Phase | Duration | Focus | Outcome |
|-------|----------|-------|---------|
| **Phase 1: MVP** | 4 weeks | Core website with lead generation | Live website, Google-indexed |
| **Phase 2: Growth** | 6 weeks | Content, tools, engagement | SEO traffic, qualified leads |
| **Phase 3: Leadership** | 6 weeks | Advanced features, bilingual | Market-leading digital presence |

**Total timeline**: ~16 weeks (4 months)

---

## Phase 1 — MVP (Weeks 1-4)

### Goal
Launch a professional, SEO-optimized website that captures leads and establishes web presence.

### Deliverables

| Week | Tasks |
|------|-------|
| **Week 1** | Project setup, architecture, SSR configuration, Tailwind v4 theming, i18n setup (Arabic), layout shell (header/footer/sidebar), responsive navigation |
| **Week 2** | Homepage (all sections), About page, Contact page with form + map, WhatsApp floating button, click-to-call |
| **Week 3** | Projects listing page, Project detail page (gallery, info, map, CTA), Gallery page with lightbox, Privacy policy |
| **Week 4** | SEO optimization (meta tags, schema.org, sitemap.xml), Google Analytics 4 + Facebook Pixel, performance optimization (Core Web Vitals), testing + QA, deployment |

### Definition of Done — Phase 1

- [x] 7 pages live and functional
- [x] Arabic RTL layout throughout
- [x] Responsive on mobile, tablet, desktop
- [x] SSR working — pages render on server
- [ ] Google Search Console submitted
- [ ] Google Business Profile created and linked
- [x] WhatsApp button functional on all pages
- [x] Contact form submitting successfully
- [x] Lighthouse score: Performance > 90, SEO > 95
- [x] Schema.org structured data validated
- [x] All images optimized (WebP, lazy loaded)

### Digital Score After Phase 1: **6/10** (up from 3/10)

---

## Phase 2 — Growth (Weeks 5-10)

### Goal
Add content depth, engagement tools, and SEO content to drive organic traffic.

### Deliverables

| Week | Tasks |
|------|-------|
| **Week 5** | Payment Plans page with interactive calculator, lead capture integration |
| **Week 6** | Construction Updates page with photo timeline, progress milestones per project |
| **Week 7** | Sadat City Guide page (comprehensive area content for SEO), nearby amenities integration |
| **Week 8** | Blog infrastructure (listing + detail pages), first 5 blog articles published |
| **Week 9** | Newsletter signup, Facebook feed embed, callback request form, UTM tracking |
| **Week 10** | Service Worker (offline support), error monitoring, performance tuning, QA |

### Definition of Done — Phase 2

- [x] 4 new pages/sections live (Payment Plans, Construction Updates, Sadat Guide, Blog)
- [x] Payment calculator functional (`InstallmentCalculatorComponent`)
- [x] Construction timeline showing progress data
- [x] Blog with listing + detail pages
- [x] Newsletter capturing email addresses (`NewsletterComponent` in footer)
- [ ] Organic traffic from Google measurable
- [ ] Service Worker caching key assets

### Digital Score After Phase 2: **8/10**

---

## Phase 3 — Leadership (Weeks 11-16)

### Goal
Become the #1 digital real estate brand in Sadat City.

### Deliverables

| Week | Tasks |
|------|-------|
| **Week 11** | English translation (all pages), language switcher in header — **DONE** (implemented early via path-based locale routing: `/ar/...`, `/en/...`) |
| **Week 12** | Investors page with ROI data and market analysis, dedicated investor inquiry form — **DONE** |
| **Week 13** | FAQ page with Schema.org FAQPage structured data, accordion UI — **DONE** (5 categories, 18 questions) |
| **Week 14** | Site-wide search, heatmap integration, additional blog content (10+ articles total) |
| **Week 15** | Performance optimization pass, accessibility audit (WCAG 2.1 AA), security hardening |
| **Week 16** | Final QA, documentation, handover, maintenance plan |

### Definition of Done — Phase 3

- [x] Full English translation live (~700+ keys)
- [x] Language switcher working (ar ↔ en) — path-based locale routing (`/ar/...` ↔ `/en/...`)
- [x] Investors page live (ROI data, market analysis, investment packages)
- [x] FAQ page with 18 questions across 5 categories + Schema.org FAQPage
- [ ] Site search functional
- [ ] 10+ blog articles indexed
- [ ] WCAG 2.1 AA compliance
- [ ] Lighthouse: all scores > 90
- [x] Comprehensive documentation

### Digital Score After Phase 3: **9/10**

---

## Resource Requirements

### Phase 1

| Resource | Effort |
|----------|--------|
| Angular Developer | Full-time, 4 weeks |
| Designer | Part-time, Week 1-2 (design system + key pages) |
| Content Writer (Arabic) | Part-time, Week 2-4 (page content) |
| DevOps | 2-3 days (deployment setup) |

### Phase 2

| Resource | Effort |
|----------|--------|
| Angular Developer | Full-time, 6 weeks |
| Content Writer (Arabic) | Part-time, ongoing (blog articles, guide) |
| SEO Specialist | Part-time, Week 5 + Week 10 (audit) |

### Phase 3

| Resource | Effort |
|----------|--------|
| Angular Developer | Full-time, 6 weeks |
| Translator (Arabic → English) | Part-time, Week 11-12 |
| QA Tester | Part-time, Week 15-16 |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Content not ready on time | Start content writing in Week 1; use placeholder content if needed |
| Design revisions delaying development | Approve design system in Week 1 before building |
| SSR complexity | Use Angular's built-in SSR; avoid complex browser-only dependencies |
| Image assets not available | Use existing Facebook photos + watermarks initially |
| Scope creep | Strict phase boundaries; features not in current phase go to backlog |

---

## Success Metrics

### Phase 1 KPIs (Month 1-2)

| Metric | Target |
|--------|--------|
| Website live | Yes |
| Google indexed pages | 7+ |
| Lighthouse Performance | > 90 |
| WhatsApp clicks/month | > 50 |
| Contact form submissions/month | > 10 |

### Phase 2 KPIs (Month 3-4)

| Metric | Target |
|--------|--------|
| Organic search traffic | > 500 visits/month |
| Blog articles indexed | 5+ |
| Payment calculator usage | > 100/month |
| Newsletter signups | > 50 |

### Phase 3 KPIs (Month 5-6)

| Metric | Target |
|--------|--------|
| Organic search traffic | > 2,000 visits/month |
| English language visitors | > 10% of traffic |
| Total leads/month | > 100 |
| #1 ranking for "شقق مدينة السادات" | Achieved |
