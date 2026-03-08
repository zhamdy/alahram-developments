# 12 — Sitemap & Information Architecture

## Visual Sitemap

```
🏠 Homepage (/)
│
├── 📋 About Us (/من-نحن)
│
├── 🏗️ Projects (/مشاريعنا)
│   ├── Project 865 (/مشاريعنا/مشروع-865)
│   ├── Project 868 (/مشاريعنا/مشروع-868)
│   └── Project 76 (/مشاريعنا/مشروع-76)
│
├── 📸 Gallery (/معرض-الصور)
│
├── 📞 Contact (/تواصل-معنا)
│
├── 💰 Payment Plans (/خطط-السداد)                    [Phase 2]
│
├── 🔨 Construction Updates (/تحديثات-البناء)          [Phase 2]
│   ├── Project 865 Updates
│   ├── Project 868 Updates
│   └── Project 76 Updates
│
├── 🗺️ Sadat City Guide (/دليل-مدينة-السادات)         [Phase 2]
│
├── 📝 Blog (/المدونة)                                [Phase 2]
│   ├── Article 1 (/المدونة/دليل-مدينة-السادات-الشامل)
│   ├── Article 2 (/المدونة/اسعار-الشقق-2026)
│   └── ... (dynamic)
│
├── 💼 Investors (/المستثمرين)                         [Phase 3]
│
├── ❓ FAQ (/الأسئلة-الشائعة)                          [Phase 3]
│
└── 📄 Privacy Policy (/سياسة-الخصوصية)
```

### English Mirror (Phase 3)

```
🏠 Homepage (/en)
├── About (/en/about)
├── Projects (/en/projects)
│   ├── Project 865 (/en/projects/project-865)
│   ├── Project 868 (/en/projects/project-868)
│   └── Project 76 (/en/projects/project-76)
├── Gallery (/en/gallery)
├── Contact (/en/contact)
├── Payment Plans (/en/payment-plans)
├── Construction Updates (/en/construction-updates)
├── Sadat City Guide (/en/sadat-city-guide)
├── Blog (/en/blog)
├── Investors (/en/investors)
├── FAQ (/en/faq)
└── Privacy (/en/privacy)
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

### Arabic URLs (Default)

- Use Arabic slugs for SEO and user readability
- Keep URLs short and keyword-rich
- Use hyphens to separate words
- Encode properly for browsers that don't display Arabic URLs

### URL Patterns

| Type | Pattern | Example |
|------|---------|---------|
| Static page | `/:slug` | `/من-نحن` |
| Project listing | `/مشاريعنا` | `/مشاريعنا` |
| Project detail | `/مشاريعنا/:project-slug` | `/مشاريعنا/مشروع-865` |
| Blog listing | `/المدونة` | `/المدونة` |
| Blog post | `/المدونة/:post-slug` | `/المدونة/اسعار-الشقق-2026` |
| English page | `/en/:slug` | `/en/about` |

### Canonical URLs

Every page must have a canonical URL. For bilingual pages:
- Arabic page canonical: `https://alahram-developments.com/مشاريعنا`
- English page canonical: `https://alahram-developments.com/en/projects`
- `hreflang` tags linking both versions

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
