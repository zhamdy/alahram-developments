# 11 — Content Strategy & SEO Plan

## Content Pillars

| Pillar | Purpose | % of Content |
|--------|---------|-------------|
| **Construction Progress** | Build trust, show execution | 30% |
| **Market & Investment** | Attract investors, show value | 25% |
| **Area Guide & Lifestyle** | SEO, educate newcomers | 20% |
| **Company & Community** | Brand building, human connection | 15% |
| **Tips & Education** | SEO, position as expert | 10% |

---

## Content Repurposing Strategy

### Facebook → Website Pipeline

Al-Ahram already creates content for Facebook. Here's how to repurpose it:

| Facebook Content | Website Content |
|-----------------|----------------|
| Construction photo posts | Gallery updates + Construction Timeline entries |
| Reels with commentary | Blog articles with embedded video |
| Promotional posts | Project page updates |
| Community events (Quran competition) | Blog article + community section |
| Customer comments | Testimonial quotes on project pages |

### One Piece → Multiple Formats

```
Construction Reel
    ├── Blog article: "تحديثات البناء — مشروع 865 (مارس 2026)"
    ├── Gallery: 4-8 still frames added to project gallery
    ├── Timeline: Milestone entry on project detail page
    ├── Social: Shared from website link (drives traffic back)
    └── Newsletter: Weekly construction update email
```

---

## Arabic SEO Strategy

### Primary Keywords (صفحات أساسية)

| Keyword | Search Intent | Target Page | Priority |
|---------|--------------|-------------|----------|
| شقق مدينة السادات | Transactional | Projects Listing | Critical |
| شقق للبيع مدينة السادات | Transactional | Projects Listing | Critical |
| اسعار الشقق في مدينة السادات | Commercial | Payment Plans | Critical |
| المنطقة 21 مدينة السادات | Informational | Projects / Sadat Guide | High |
| استثمار عقاري مدينة السادات | Commercial | Investors Page | High |
| الأهرام للتطوير العقاري | Brand | Homepage | High |
| شقق بالتقسيط مدينة السادات | Commercial | Payment Plans | High |
| كمبوند مدينة السادات | Transactional | Projects Listing | Medium |

### Long-tail Keywords (مدونة)

| Keyword | Target Content |
|---------|---------------|
| شقة 3 غرف مدينة السادات بالتقسيط | Blog article |
| مميزات السكن في مدينة السادات | Sadat Guide |
| اسعار المتر في المنطقة 21 | Blog article |
| افضل مناطق مدينة السادات للاستثمار | Blog article |
| مستقبل مدينة السادات العقاري | Blog article |
| مقارنة اسعار مدينة السادات والقاهرة الجديدة | Blog article |
| خطوات شراء شقة في مدينة السادات | Blog article |
| التمويل العقاري مدينة السادات | Payment Plans / Blog |

### English Keywords (Phase 3)

| Keyword | Target Page |
|---------|-------------|
| Sadat City apartments for sale | Projects (en) |
| real estate investment Sadat City Egypt | Investors (en) |
| property prices Sadat City | Blog (en) |
| buy apartment Monufia Egypt | Projects (en) |

---

## Blog Content Plan — First 15 Articles

### Phase 2 Launch (Articles 1-5)

| # | Title (Arabic) | Category | Target Keyword | Est. Words |
|---|---------------|----------|---------------|-----------|
| 1 | دليل شامل عن مدينة السادات — كل ما تحتاج معرفته | Area Guide | مدينة السادات | 2,000 |
| 2 | أسعار الشقق في مدينة السادات 2026 — تحديث شامل | Market | اسعار الشقق مدينة السادات | 1,500 |
| 3 | لماذا المنطقة 21 هي المنطقة الذهبية في مدينة السادات؟ | Area Guide | المنطقة 21 مدينة السادات | 1,200 |
| 4 | 7 أسباب تجعل مدينة السادات أفضل استثمار عقاري في 2026 | Investment | استثمار عقاري مدينة السادات | 1,500 |
| 5 | كيف تختار الشقة المناسبة — دليل المشتري الأول | Education | شراء شقة مدينة السادات | 1,800 |

### Ongoing (Articles 6-15)

| # | Title (Arabic) | Category |
|---|---------------|----------|
| 6 | مقارنة أسعار: مدينة السادات vs القاهرة الجديدة vs أكتوبر | Market |
| 7 | تحديثات البناء — مشروع 865 و 868 (الربع الأول 2026) | Construction |
| 8 | التمويل العقاري في مصر — كل ما تحتاج معرفته | Education |
| 9 | مستقبل مدينة السادات — خطط التنمية حتى 2030 | Area Guide |
| 10 | 5 نصائح قبل شراء شقة بالتقسيط | Education |
| 11 | الحياة في مدينة السادات — المدارس والجامعات والخدمات | Lifestyle |
| 12 | لماذا يختار المستثمرون مدينة السادات؟ | Investment |
| 13 | مشروع 76 — بالقرب من جامعة الريادة | Project Spotlight |
| 14 | كيف تقيّم العائد على الاستثمار العقاري | Education |
| 15 | الأهرام للتطوير — قصتنا ورؤيتنا | Brand |

---

## On-Page SEO Checklist

### Every Page Must Have

- [ ] Unique Arabic title tag (50-60 chars)
- [ ] Unique meta description (150-160 chars, Arabic)
- [ ] One H1 tag containing primary keyword
- [ ] Logical heading hierarchy (H1 → H2 → H3)
- [ ] Internal links to related pages (2-3 minimum)
- [ ] Alt text on all images (Arabic)
- [ ] Canonical URL set
- [ ] Open Graph tags (og:title, og:description, og:image)
- [ ] Schema.org structured data where applicable

### Every Blog Article Must Have

- [ ] All of the above +
- [ ] Focus keyword in first paragraph
- [ ] Focus keyword in URL slug
- [ ] 1,000+ words
- [ ] At least 1 image with alt text
- [ ] Internal links to project pages
- [ ] CTA at end (WhatsApp / Contact)
- [ ] `article` Schema.org structured data
- [ ] Published date and author

---

## Technical SEO Requirements

### Sitemap Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://alahram-developments.com/</loc><priority>1.0</priority></url>
  <url><loc>https://alahram-developments.com/من-نحن</loc><priority>0.8</priority></url>
  <url><loc>https://alahram-developments.com/مشاريعنا</loc><priority>0.9</priority></url>
  <url><loc>https://alahram-developments.com/تواصل-معنا</loc><priority>0.8</priority></url>
  <url><loc>https://alahram-developments.com/معرض-الصور</loc><priority>0.7</priority></url>
  <!-- Dynamic: project pages, blog posts -->
</urlset>
```

### Robots.txt

```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://alahram-developments.com/sitemap.xml
```

### Schema.org — Key Types

| Page | Schema Type |
|------|-------------|
| Homepage | `RealEstateAgent` + `Organization` |
| Project Detail | `RealEstateListing` |
| Blog Article | `Article` + `BreadcrumbList` |
| FAQ | `FAQPage` |
| Contact | `ContactPage` + `LocalBusiness` |

---

## Social Media Integration

### Website → Social Sharing

- Open Graph tags on every page for rich Facebook shares
- Twitter Card tags (optional, for future Twitter presence)
- Share buttons on blog articles and project pages
- UTM-tagged links from social back to website

### Social → Website Traffic

| Channel | Strategy |
|---------|----------|
| Facebook | Add website link to all posts, profile, and bio |
| WhatsApp | Share website links in conversations |
| Google Business | Link to website |
| Future Instagram | Link in bio to website |
