# 09 — Feature Matrix

## Features by Category

### Lead Generation Features

| Feature | Phase | Priority | Status | Description |
|---------|-------|----------|--------|-------------|
| WhatsApp floating button | 1 | Critical | Done | Persistent on all pages, deep link with pre-filled message |
| Contact form | 1 | Critical | Done | Reusable `ContactFormComponent` — name, phone, email, project interest, message |
| Click-to-call | 1 | Critical | Done | Phone numbers as `tel:` links on mobile |
| Project inquiry form | 1 | High | Done | Project-specific form on detail pages |
| Newsletter signup | 2 | Medium | Done | Email capture in footer via `NewsletterComponent` |
| Payment calculator | 2 | High | Done | Interactive `InstallmentCalculatorComponent` on payment plans page |
| Callback request | 2 | Medium | — | Schedule a call form |
| Live chat | 3 | Low | — | Optional — WhatsApp may suffice |

### Search & Discovery

| Feature | Phase | Priority | Status | Description |
|---------|-------|----------|--------|-------------|
| Project listing with filters | 1 | High | Done | Filter by status, location |
| Gallery with categories | 1 | High | Done | Filter by project, type + lightbox with keyboard navigation |
| Blog search | 2 | Medium | — | Search blog articles |
| Site search | 3 | Low | — | Global search across all content |

### Trust & Transparency

| Feature | Phase | Priority | Status | Description |
|---------|-------|----------|--------|-------------|
| Construction photo gallery | 1 | Critical | Done | Photo gallery with filter + lightbox |
| Project progress timeline | 2 | High | Done | Construction updates page with photo timelines |
| Customer testimonials | 1 | High | Done | Testimonials section on homepage |
| Company story/about | 1 | High | Done | Founding story, values, team, milestones |
| Facebook feed embed | 2 | Medium | — | Show latest Facebook posts on site |

### SEO & Performance

| Feature | Phase | Priority | Status | Description |
|---------|-------|----------|--------|-------------|
| SSR (Server-Side Rendering) | 1 | Critical | Done | Angular SSR with 25 prerendered routes |
| Meta tags management | 1 | Critical | Done | Dynamic OG tags, title, description per page via `SeoService` |
| Schema.org structured data | 1 | High | Done | RealEstateAgent, RealEstateListing, FAQPage, BreadcrumbList |
| Sitemap.xml | 1 | High | Done | Auto-generated with 32 URLs + hreflang alternates |
| robots.txt | 1 | High | Done | Proper crawl directives |
| Canonical URLs | 1 | High | Done | Locale-aware canonical URLs with hreflang |
| Image optimization | 1 | High | Done | NgOptimizedImage, lazy loading, `ImageFallbackDirective` |
| Core Web Vitals | 1 | Critical | Done | LCP < 2.5s, FID < 100ms, CLS < 0.1 |

### i18n & Accessibility

| Feature | Phase | Priority | Status | Description |
|---------|-------|----------|--------|-------------|
| Arabic (RTL) default | 1 | Critical | Done | Full RTL layout with Arabic content |
| English toggle | 3 | Medium | Done | Full English translation (~700+ keys) |
| Language switcher | 3 | Medium | Done | Path-based locale routing (`/ar/...` ↔ `/en/...`) |
| Keyboard navigation | 1 | Medium | Done | Tab order, focus management, skip-to-content link |
| Screen reader support | 1 | Medium | Done | ARIA labels, semantic HTML, roles |
| Responsive design | 1 | Critical | Done | Mobile → Tablet → Desktop |

### Content Management

| Feature | Phase | Priority | Status | Description |
|---------|-------|----------|--------|-------------|
| Blog system | 2 | High | Done | Blog listing + detail pages with share buttons |
| Construction updates | 2 | High | Done | Photo timelines per project with date-stamped updates |
| Sadat City guide | 2 | Medium | Done | Comprehensive area guide (amenities, distances, lifestyle) |
| FAQ management | 3 | Medium | Done | 5 categories, 18 questions, accordion UI, Schema.org FAQPage |
| Investor resources | 3 | Low | Done | ROI data, market analysis, investment packages, inquiry form |

### Analytics & Tracking

| Feature | Phase | Priority | Status | Description |
|---------|-------|----------|--------|-------------|
| Google Analytics 4 | 1 | Critical | Done | Page views, user behavior (placeholder ID in index.html) |
| Facebook Pixel | 1 | High | — | Conversion tracking for future ads |
| Event tracking | 1 | High | Done | WhatsApp clicks, form submissions, calls |
| UTM parameter handling | 2 | Medium | — | Track campaign sources |
| Heatmap integration | 3 | Low | — | Hotjar or similar |

### Performance & Infrastructure

| Feature | Phase | Priority | Status | Description |
|---------|-------|----------|--------|-------------|
| CDN delivery | 1 | High | — | Static assets via CDN |
| Image CDN | 1 | High | — | On-the-fly image resizing |
| Service Worker | 2 | Medium | — | Offline support, caching |
| Error monitoring | 2 | Medium | — | Sentry or similar |
| Uptime monitoring | 2 | Medium | — | Ensure site availability |

---

## Phase Feature Summary

### Phase 1 — MVP (4 weeks) — COMPLETE

| Category | Features | Status |
|----------|----------|--------|
| Pages | Homepage, About, Projects (list + detail), Contact, Gallery, Privacy | Done |
| Lead Gen | WhatsApp button, contact form, click-to-call, inquiry form | Done |
| SEO | SSR, meta tags, schema.org, sitemap, robots.txt, canonical URLs | Done |
| Analytics | GA4, event tracking | Done (Facebook Pixel pending) |
| Design | Responsive, RTL, brand colors, accessibility basics | Done |
| Performance | Image optimization, Core Web Vitals | Done (CDN pending) |

### Phase 2 — Growth (6 weeks) — COMPLETE

| Category | Features | Status |
|----------|----------|--------|
| Pages | Payment Plans, Construction Updates, Sadat Guide, Blog | Done |
| Lead Gen | Payment calculator, newsletter | Done (callback request pending) |
| Content | Blog system, construction timeline, area guide | Done |
| Trust | Progress tracker | Done (Facebook feed embed pending) |
| Analytics | UTM handling | Pending |
| Performance | Service Worker, error monitoring | Pending |

### Phase 3 — Leadership (6 weeks) — MOSTLY COMPLETE

| Category | Features | Status |
|----------|----------|--------|
| Pages | Investors, FAQ | Done |
| i18n | Full English translation (~700+ keys), path-based language switcher | Done |
| Content | FAQ page (18 questions, Schema.org), investor resources | Done |
| Search | Site-wide search | Pending |
| Analytics | Heatmaps | Pending |
| Lead Gen | Live chat (optional) | Pending |
