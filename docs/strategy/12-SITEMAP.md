# 12 — Sitemap & Information Architecture

## Visual Sitemap

> **Note:** The site uses path-based locale routing with English slugs prefixed by locale (`/ar/...`, `/en/...`). Both locales share the same URL structure.

```
/ (redirects to /ar)
│
├── /ar (Arabic — default)                    /en (English)
│   ├── /ar/about                             /en/about
│   ├── /ar/projects                          /en/projects
│   │   ├── /ar/projects/project-865          /en/projects/project-865
│   │   ├── /ar/projects/project-868          /en/projects/project-868
│   │   └── /ar/projects/project-76           /en/projects/project-76
│   ├── /ar/gallery                           /en/gallery
│   ├── /ar/contact                           /en/contact
│   ├── /ar/blog                              /en/blog
│   │   ├── /ar/blog/:slug                    /en/blog/:slug
│   │   └── ... (dynamic)
│   ├── /ar/privacy                           /en/privacy
│   ├── /ar/payment-plans      [Phase 2]      /en/payment-plans
│   ├── /ar/construction       [Phase 2]      /en/construction
│   ├── /ar/sadat-guide        [Phase 2]      /en/sadat-guide
│   ├── /ar/investors          [Phase 3]      /en/investors
│   └── /ar/faq                [Phase 3]      /en/faq
```

---

## Navigation Structure

### Primary Navigation (Header)

```
┌─────────────────────────────────────────────────┐
│ [Logo]  الرئيسية | مشاريعنا | من نحن | المدونة | تواصل معنا  [AR|EN] │
└─────────────────────────────────────────────────┘
```

| Nav Item | Dropdown/Children | Phase |
|----------|-------------------|-------|
| الرئيسية (Home) | — | 1 |
| مشاريعنا (Projects) | Project 865, Project 868, Project 76 | 1 |
| من نحن (About) | — | 1 |
| معرض الصور (Gallery) | — | 1 |
| المدونة (Blog) | — | 2 |
| تواصل معنا (Contact) | — (CTA button style) | 1 |

### Mobile Navigation

- Hamburger menu (right side for RTL)
- Full-screen overlay
- Same items as desktop
- WhatsApp shortcut button at bottom

### Footer Navigation

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  الشركة          المشاريع        الموارد          تواصل معنا │
│  ──────          ────────        ──────          ────────── │
│  من نحن          مشروع 865      المدونة          010 31198677│
│  معرض الصور      مشروع 868      خطط السداد       واتساب      │
│  سياسة الخصوصية  مشروع 76       دليل السادات     info@...    │
│                                 الأسئلة الشائعة   العنوان     │
│                                                              │
│  ──────────────────────────────────────────────────────────  │
│  [Facebook] [WhatsApp]              © 2026 الأهرام للتطوير   │
└──────────────────────────────────────────────────────────────┘
```

---

## Page Hierarchy & Depth

| Depth | Pages | Notes |
|-------|-------|-------|
| Level 0 | Homepage | Entry point |
| Level 1 | About, Projects, Gallery, Contact, Blog, Payment, Guide, Investors, FAQ, Privacy | Main sections |
| Level 2 | Project Detail, Blog Post, Construction Update | Content pages |
| Max depth | 2 levels | Keep flat for SEO |

**SEO Rule**: No page should be more than 2 clicks from the homepage.

---

## URL Strategy

### Path-Based Locale Routing (Implemented)

All routes use English slugs prefixed by locale. This approach:
- Avoids URL encoding issues with Arabic characters
- Gives each locale its own indexable URL
- Enables proper hreflang alternate linking
- Supports SSR prerendering of both locale variants

### URL Patterns

| Type | Pattern | Arabic Example | English Example |
|------|---------|----------------|-----------------|
| Homepage | `/:locale` | `/ar` | `/en` |
| Static page | `/:locale/:slug` | `/ar/about` | `/en/about` |
| Project listing | `/:locale/projects` | `/ar/projects` | `/en/projects` |
| Project detail | `/:locale/projects/:slug` | `/ar/projects/project-865` | `/en/projects/project-865` |
| Blog listing | `/:locale/blog` | `/ar/blog` | `/en/blog` |
| Blog post | `/:locale/blog/:slug` | `/ar/blog/sadat-guide` | `/en/blog/sadat-guide` |

### Legacy Redirects

Old URLs without locale prefix redirect to Arabic:
- `/projects` → `/ar/projects`
- `/about` → `/ar/about`
- `/contact` → `/ar/contact`

### Canonical URLs

Every page has a locale-prefixed canonical URL with hreflang alternates:
- Arabic canonical: `https://alahram-developments.com/ar/projects`
- English canonical: `https://alahram-developments.com/en/projects`
- Hreflang: `ar`, `en`, `x-default` (→ Arabic)

---

## Breadcrumbs

Implement breadcrumbs with Schema.org `BreadcrumbList` on all pages below Level 0:

```
الرئيسية > مشاريعنا > مشروع 865
الرئيسية > المدونة > أسعار الشقق في مدينة السادات 2026
```

---

## Internal Linking Strategy

| From Page | Link To | Purpose |
|-----------|---------|---------|
| Homepage | All project detail pages | Discovery |
| Homepage | Contact page | Conversion |
| Project detail | Payment Plans | Move down funnel |
| Project detail | Related projects | Cross-sell |
| Blog articles | Project pages | SEO + conversion |
| Blog articles | Other blog articles | SEO + engagement |
| Sadat Guide | Projects listing | Conversion |
| All pages | Contact / WhatsApp | Conversion |
