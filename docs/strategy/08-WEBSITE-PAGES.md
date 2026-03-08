# 08 — Website Pages Specification

## Page Map Overview

| # | Page | URL (ar) | URL (en) | Phase |
|---|------|----------|----------|-------|
| 1 | Homepage | `/` | `/en` | 1 - MVP |
| 2 | About Us | `/من-نحن` | `/en/about` | 1 - MVP |
| 3 | Projects Listing | `/مشاريعنا` | `/en/projects` | 1 - MVP |
| 4 | Project Detail | `/مشاريعنا/:slug` | `/en/projects/:slug` | 1 - MVP |
| 5 | Contact | `/تواصل-معنا` | `/en/contact` | 1 - MVP |
| 6 | Gallery | `/معرض-الصور` | `/en/gallery` | 1 - MVP |
| 7 | Payment Plans | `/خطط-السداد` | `/en/payment-plans` | 2 - Growth |
| 8 | Construction Updates | `/تحديثات-البناء` | `/en/construction-updates` | 2 - Growth |
| 9 | Sadat City Guide | `/دليل-مدينة-السادات` | `/en/sadat-city-guide` | 2 - Growth |
| 10 | Blog | `/المدونة` | `/en/blog` | 2 - Growth |
| 11 | Blog Post | `/المدونة/:slug` | `/en/blog/:slug` | 2 - Growth |
| 12 | Investors | `/المستثمرين` | `/en/investors` | 3 - Leadership |
| 13 | FAQ | `/الأسئلة-الشائعة` | `/en/faq` | 3 - Leadership |
| 14 | Privacy Policy | `/سياسة-الخصوصية` | `/en/privacy` | 1 - MVP |

---

## Page Specifications

### 1. Homepage (`/`)

**Purpose**: First impression, lead generation funnel entry

**Hero Section**:
- Full-width background: drone shot of Zone 21 or 3D render
- Arabic headline: "الأهرام للتطوير والاستثمار العقاري — بنبني مستقبلك"
- Two CTAs: "تصفح المشاريع" (Browse Projects) + "تواصل معنا" (Contact Us)
- WhatsApp floating button (persistent across all pages)

**Sections**:
1. **Hero** — headline + CTAs + background image/video
2. **Trust Bar** — key numbers: 3 مشاريع | 1800+ متابع | المنطقة الذهبية
3. **Featured Projects** — 3 project cards with images, names, status badges
4. **Why Al-Ahram** — 4 pillars: Trust, Transparency, Execution, Community
5. **Construction Gallery** — Recent photos slider with watermarks
6. **Testimonials** — Customer quotes (extracted from Facebook comments)
7. **CTA Banner** — "احجز وحدتك الآن" with WhatsApp + phone + form
8. **Location Map** — Embedded Google Map of Sadat City / Zone 21
9. **Footer** — Contact info, social links, quick links, newsletter signup

**SEO**:
- Title: `الأهرام للتطوير والاستثمار العقاري | شقق مدينة السادات`
- Meta: `شقق للبيع في مدينة السادات المنطقة 21 - الأهرام للتطوير العقاري. مشاريع سكنية بأسعار مميزة وخطط تقسيط مرنة.`
- H1: `الأهرام للتطوير والاستثمار العقاري`

**Key Features**:
- WhatsApp floating button
- Sticky header with language toggle
- Lazy-loaded images with blur placeholders
- Schema.org RealEstateAgent structured data

---

### 2. About Us (`/من-نحن`)

**Purpose**: Build trust, tell the company story

**Sections**:
1. **Company Story** — founding, vision, mission
2. **Key Numbers** — projects, units, years, zone coverage
3. **Values** — Trust, Transparency, Quality, Community
4. **Team** — founder/leadership photos (optional)
5. **Timeline** — company milestones with dates
6. **CTA** — Contact or view projects

**SEO**:
- Title: `من نحن | الأهرام للتطوير والاستثمار العقاري`
- Focus keyword: `شركة الأهرام للتطوير العقاري`

---

### 3. Projects Listing (`/مشاريعنا`)

**Purpose**: Showcase all projects, enable comparison

**Layout**: Grid of project cards (responsive: 3 cols → 2 → 1)

**Each Card**:
- Hero image
- Project name (e.g., "مشروع 865")
- Location badge (e.g., "المنطقة 21")
- Status badge (Under Construction / Completed)
- Starting price (when available)
- Unit count
- CTA button → detail page

**Filters**:
- Status: All / Under Construction / Completed
- Location: Zone 21 / University Area / All

**SEO**:
- Title: `مشاريعنا | شقق مدينة السادات - الأهرام للتطوير`
- Focus keyword: `مشاريع مدينة السادات`

---

### 4. Project Detail (`/مشاريعنا/:slug`)

**Purpose**: Full project information, lead conversion

**Sections**:
1. **Image Gallery** — full-screen capable, swipeable
2. **Project Overview** — name, location, status, description
3. **Key Facts** — unit types, sizes, floor count, amenities
4. **Floor Plans** — downloadable PDFs (when available)
5. **Location Map** — Google Maps embed with nearby landmarks
6. **Construction Progress** — photo timeline with dates
7. **Payment Plans** — table or interactive calculator
8. **Nearby Amenities** — schools, hospitals, malls, transport
9. **Contact Form** — project-specific inquiry form
10. **Related Projects** — cards for other projects

**SEO**:
- Title: `مشروع 865 | المنطقة 21 مدينة السادات - الأهرام`
- Schema.org: `RealEstateListing` structured data
- Focus keyword: `مشروع 865 المنطقة 21 مدينة السادات`

---

### 5. Contact (`/تواصل-معنا`)

**Purpose**: Multi-channel lead capture

**Sections**:
1. **Contact Form** — Name, Phone, Email, Project Interest, Message
2. **Direct Channels** — WhatsApp button, Phone numbers (clickable), Email
3. **Office Location** — Google Maps embed + address text
4. **Working Hours** — (to be set)
5. **Social Media Links** — Facebook (+ future platforms)

**Features**:
- Form validation with Arabic error messages
- WhatsApp deep link with pre-filled message
- Click-to-call phone numbers on mobile
- reCAPTCHA protection

---

### 6. Gallery (`/معرض-الصور`)

**Purpose**: Visual proof of construction progress

**Layout**: Masonry grid with lightbox

**Categories/Filters**:
- All
- Project 865
- Project 868
- Project 76
- Construction Progress
- Aerial Views

**Features**:
- Lazy loading with blur placeholders
- Lightbox with swipe navigation
- Photo watermarks (matching Facebook watermark style)
- Video gallery tab (embed Facebook reels)

---

### 7. Payment Plans (`/خطط-السداد`) — Phase 2

**Purpose**: Remove pricing friction, generate qualified leads

**Sections**:
1. **Interactive Calculator** — inputs: unit size, down payment %, installment period
2. **Plan Comparison Table** — side-by-side plan options
3. **Financing Options** — bank mortgage info, developer plans
4. **FAQ** — common payment questions
5. **CTA** — "تواصل مع مستشار المبيعات"

---

### 8. Construction Updates (`/تحديثات-البناء`) — Phase 2

**Purpose**: Build transparency, keep existing buyers informed

**Layout**: Blog-style chronological updates per project

**Each Update**:
- Date
- Project name
- Photo gallery (4-8 photos)
- Progress description
- Milestone indicator (Foundation → Structure → Finishing → Delivery)

---

### 9. Sadat City Guide (`/دليل-مدينة-السادات`) — Phase 2

**Purpose**: SEO content, educate buyers unfamiliar with the area

**Sections**:
1. **City Overview** — history, location, significance
2. **Why Sadat City** — investment case with market data
3. **Infrastructure** — roads, transport, utilities
4. **Education** — universities, schools
5. **Healthcare** — hospitals, clinics
6. **Commercial** — malls, markets, shops
7. **Industry** — factory zones, employment
8. **Residential Zones** — Zone 21 feature, other zones overview
9. **Price Comparison** — vs Cairo, October, other cities

**SEO**: This page targets informational keywords and positions Al-Ahram as a local authority.

---

### 10-11. Blog (`/المدونة` + `/المدونة/:slug`) — Phase 2

**Purpose**: SEO, thought leadership, content marketing

**Categories**:
- Market News (أخبار السوق)
- Investment Tips (نصائح استثمارية)
- Construction Updates (تحديثات البناء)
- Sadat City News (أخبار مدينة السادات)
- Home Buying Guide (دليل شراء المنزل)

---

### 12. Investors (`/المستثمرين`) — Phase 3

**Purpose**: Target investor segment specifically

**Sections**:
1. **Investment Case** — ROI data, market growth, population trends
2. **Available Units** — investment-grade units listing
3. **Rental Yield Data** — expected rental returns
4. **Area Growth Map** — planned infrastructure, upcoming projects
5. **Investor CTA** — dedicated contact form

---

### 13. FAQ (`/الأسئلة-الشائعة`) — Phase 3

**Purpose**: Answer common questions, reduce support load, SEO

**Categories**:
- About the Company
- About Projects
- Payment & Financing
- Location & Area
- After-Sales

**Format**: Accordion (expandable) with Schema.org `FAQPage` structured data

---

### 14. Privacy Policy (`/سياسة-الخصوصية`)

**Purpose**: Legal compliance

**Content**: Standard privacy policy in Arabic covering data collection, usage, cookies, contact forms.
