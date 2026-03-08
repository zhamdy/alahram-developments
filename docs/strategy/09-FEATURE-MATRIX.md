# 09 — Feature Matrix

## Features by Category

### Lead Generation Features

| Feature | Phase | Priority | Description |
|---------|-------|----------|-------------|
| WhatsApp floating button | 1 | Critical | Persistent on all pages, deep link with pre-filled message |
| Contact form | 1 | Critical | Name, phone, email, project interest, message |
| Click-to-call | 1 | Critical | Phone numbers as `tel:` links on mobile |
| Project inquiry form | 1 | High | Project-specific form on detail pages |
| Newsletter signup | 2 | Medium | Email capture in footer |
| Payment calculator | 2 | High | Interactive calculator with lead capture |
| Callback request | 2 | Medium | Schedule a call form |
| Live chat | 3 | Low | Optional — WhatsApp may suffice |

### Search & Discovery

| Feature | Phase | Priority | Description |
|---------|-------|----------|-------------|
| Project listing with filters | 1 | High | Filter by status, location |
| Gallery with categories | 1 | High | Filter by project, type |
| Blog search | 2 | Medium | Search blog articles |
| Site search | 3 | Low | Global search across all content |

### Trust & Transparency

| Feature | Phase | Priority | Description |
|---------|-------|----------|-------------|
| Construction photo gallery | 1 | Critical | Watermarked, dated photos |
| Project progress timeline | 2 | High | Visual milestone tracker per project |
| Customer testimonials | 1 | High | Quotes from Facebook comments |
| Company story/about | 1 | High | Founding story, values, team |
| Facebook feed embed | 2 | Medium | Show latest Facebook posts on site |

### SEO & Performance

| Feature | Phase | Priority | Description |
|---------|-------|----------|-------------|
| SSR (Server-Side Rendering) | 1 | Critical | Angular SSR for SEO and performance |
| Meta tags management | 1 | Critical | Dynamic OG tags, title, description per page |
| Schema.org structured data | 1 | High | RealEstateAgent, RealEstateListing, FAQPage |
| Sitemap.xml | 1 | High | Auto-generated XML sitemap |
| robots.txt | 1 | High | Proper crawl directives |
| Canonical URLs | 1 | High | Prevent duplicate content |
| Image optimization | 1 | High | WebP/AVIF, lazy loading, blur placeholders |
| Core Web Vitals | 1 | Critical | LCP < 2.5s, FID < 100ms, CLS < 0.1 |

### i18n & Accessibility

| Feature | Phase | Priority | Description |
|---------|-------|----------|-------------|
| Arabic (RTL) default | 1 | Critical | Full RTL layout with Arabic content |
| English toggle | 3 | Medium | Full English translation |
| Language switcher | 3 | Medium | Header toggle ar ↔ en |
| Keyboard navigation | 1 | Medium | Tab order, focus management |
| Screen reader support | 1 | Medium | ARIA labels, semantic HTML |
| Responsive design | 1 | Critical | Mobile → Tablet → Desktop |

### Content Management

| Feature | Phase | Priority | Description |
|---------|-------|----------|-------------|
| Blog system | 2 | High | Markdown or CMS-backed articles |
| Construction updates | 2 | High | Date-stamped photo updates per project |
| Sadat City guide | 2 | Medium | Static content page with SEO value |
| FAQ management | 3 | Medium | Accordion-based FAQ page |
| Investor resources | 3 | Low | Investment-focused content |

### Analytics & Tracking

| Feature | Phase | Priority | Description |
|---------|-------|----------|-------------|
| Google Analytics 4 | 1 | Critical | Page views, user behavior |
| Facebook Pixel | 1 | High | Conversion tracking for future ads |
| Event tracking | 1 | High | WhatsApp clicks, form submissions, calls |
| UTM parameter handling | 2 | Medium | Track campaign sources |
| Heatmap integration | 3 | Low | Hotjar or similar |

### Performance & Infrastructure

| Feature | Phase | Priority | Description |
|---------|-------|----------|-------------|
| CDN delivery | 1 | High | Static assets via CDN |
| Image CDN | 1 | High | On-the-fly image resizing |
| Service Worker | 2 | Medium | Offline support, caching |
| Error monitoring | 2 | Medium | Sentry or similar |
| Uptime monitoring | 2 | Medium | Ensure site availability |

---

## Phase Feature Summary

### Phase 1 — MVP (4 weeks)

| Category | Features |
|----------|----------|
| Pages | Homepage, About, Projects (list + detail), Contact, Gallery, Privacy |
| Lead Gen | WhatsApp button, contact form, click-to-call, inquiry form |
| SEO | SSR, meta tags, schema.org, sitemap, robots.txt |
| Analytics | GA4, Facebook Pixel, event tracking |
| Design | Responsive, RTL, brand colors, accessibility basics |
| Performance | Image optimization, CDN, Core Web Vitals |

### Phase 2 — Growth (6 weeks)

| Category | Features |
|----------|----------|
| Pages | Payment Plans, Construction Updates, Sadat Guide, Blog |
| Lead Gen | Payment calculator, newsletter, callback request |
| Content | Blog system, construction timeline, area guide |
| Trust | Progress tracker, Facebook feed embed |
| Analytics | UTM handling |
| Performance | Service Worker, error monitoring |

### Phase 3 — Leadership (6 weeks)

| Category | Features |
|----------|----------|
| Pages | Investors, FAQ, English versions |
| i18n | Full English translation, language switcher |
| Content | FAQ page, investor resources |
| Search | Site-wide search |
| Analytics | Heatmaps |
| Lead Gen | Live chat (optional) |
