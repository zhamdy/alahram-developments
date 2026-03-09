# Internationalization (i18n) Guide

This guide covers the internationalization system for the Al-Ahram Developments project using Transloco, the `I18nService`, locale-aware formatting, and RTL/LTR direction switching.

---

## Table of Contents

1. [Overview](#overview)
2. [Transloco Setup](#transloco-setup)
3. [Translation Files](#translation-files)
4. [Using Translations in Templates](#using-translations-in-templates)
5. [Using Translations in TypeScript](#using-translations-in-typescript)
6. [Adding New Translation Keys](#adding-new-translation-keys)
7. [The I18nService](#the-i18nservice)
8. [Language Switching](#language-switching)
9. [RTL/LTR Direction Switching](#rtlltr-direction-switching)
10. [Date, Number, and Currency Formatting](#date-number-and-currency-formatting)
11. [Best Practices for Arabic UI](#best-practices-for-arabic-ui)
12. [SSR Considerations](#ssr-considerations)

---

## Overview

| Aspect | Detail |
|--------|--------|
| Library | `@jsverse/transloco` v8 |
| Default locale | `ar` (Arabic, RTL) |
| Supported locales | `ar`, `en` |
| Translation format | JSON |
| Translation files | `src/assets/i18n/ar.json`, `src/assets/i18n/en.json` |
| Direction switching | Automatic via `I18nService` |
| Number/currency locale | `ar-EG` for Arabic, `en-US` for English |

---

## Transloco Setup

### Configuration

Transloco is configured through a provider function in `src/app/core/services/transloco-config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-loader';
import { environment } from '../../../environments/environment';

export function provideTranslocoConfig(): ApplicationConfig['providers'] {
  return [
    provideTransloco({
      config: {
        availableLangs: ['ar', 'en'],
        defaultLang: environment.defaultLocale,  // 'ar'
        reRenderOnLangChange: true,
        prodMode: environment.production,
        fallbackLang: 'ar',
        missingHandler: {
          logMissingKey: !environment.production,
        },
      },
      loader: TranslocoHttpLoader,
    }),
  ];
}
```

Key options:
- **`defaultLang`**: Set to `'ar'` from the environment config.
- **`reRenderOnLangChange: true`**: Templates re-render when the language changes.
- **`fallbackLang: 'ar'`**: If a key is missing in the active language, fall back to Arabic.
- **`missingHandler.logMissingKey`**: In development, missing keys are logged to the console.

### Translation Loader

```typescript
// src/app/core/services/transloco-loader.ts
import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): Observable<Translation> {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}
```

The loader fetches translation files via `HttpClient`. In SSR mode, this request is captured by the HTTP Transfer State, so the translation file is fetched once on the server and reused on the client without a duplicate network call.

### Registration in App Config

```typescript
// src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    ...provideTranslocoConfig(),
  ],
};
```

---

## Translation Files

### File Location

```
src/
  assets/
    i18n/
      ar.json    # Arabic (default)
      en.json    # English
```

### File Structure

Both files share the same key structure. Keys are organized by feature/section using nested objects:

```json
{
  "app": {
    "name": "الأهرام للتطوير العقاري",
    "description": "شركة رائدة في مجال التطوير العقاري في مصر",
    "tagline": "نبني المستقبل بأيدٍ أمينة"
  },
  "header": {
    "home": "الرئيسية",
    "about": "من نحن",
    "projects": "المشاريع",
    "contact": "تواصل معنا",
    "toggleTheme": "تبديل المظهر",
    "login": "تسجيل الدخول"
  },
  "footer": {
    "rights": "جميع الحقوق محفوظة.",
    "privacy": "سياسة الخصوصية",
    "terms": "الشروط والأحكام",
    "contact": "اتصل بنا"
  },
  "common": {
    "loading": "جاري التحميل...",
    "error": "حدث خطأ",
    "save": "حفظ",
    "cancel": "إلغاء"
  },
  "validation": {
    "required": "هذا الحقل مطلوب",
    "email": "البريد الإلكتروني غير صحيح",
    "minLength": "يجب أن يكون على الأقل {{min}} أحرف",
    "maxLength": "يجب ألا يتجاوز {{max}} أحرف"
  }
}
```

### Key Naming Conventions

| Pattern | Example | Use |
|---------|---------|-----|
| `section.key` | `header.home` | Simple labels |
| `section.subsection.key` | `projects.detail.title` | Nested feature keys |
| `common.key` | `common.save` | Shared across features |
| `validation.key` | `validation.required` | Form validation messages |

---

## Using Translations in Templates

### Structural Directive: `*transloco`

The primary way to use translations in templates is the `*transloco` structural directive:

```typescript
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'ahram-footer',
  standalone: true,
  imports: [TranslocoDirective],
  template: `
    <footer *transloco="let t">
      <p>{{ t('footer.rights') }}</p>
      <a href="#">{{ t('footer.privacy') }}</a>
      <a href="#">{{ t('footer.terms') }}</a>
    </footer>
  `,
})
export class FooterComponent {}
```

The `*transloco="let t"` directive provides a translation function `t` that you call with the key.

### With Interpolation Parameters

Translation keys can include `{{param}}` placeholders:

```json
{
  "validation": {
    "minLength": "يجب أن يكون على الأقل {{min}} أحرف"
  }
}
```

```html
<p *transloco="let t">
  {{ t('validation.minLength', { min: 8 }) }}
</p>
<!-- Output: يجب أن يكون على الأقل 8 أحرف -->
```

### Pipe: `transloco`

For simple cases, you can use the `transloco` pipe:

```typescript
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  imports: [TranslocoPipe],
  template: `
    <button [attr.aria-label]="'header.toggleTheme' | transloco">
      Toggle
    </button>

    <input [placeholder]="'common.search' | transloco" />
  `,
})
```

### When to Use Directive vs Pipe

| Approach | Use When |
|----------|----------|
| `*transloco="let t"` | Multiple translations in one template block; better performance |
| `transloco` pipe | Single isolated translation, attribute bindings |

Prefer the structural directive when a template section has many translated strings, as it creates a single subscription for the language change rather than one per pipe.

---

## Using Translations in TypeScript

### Injecting TranslocoService

```typescript
import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly transloco = inject(TranslocoService);

  showError(key: string, params?: Record<string, unknown>): void {
    const message = this.transloco.translate(key, params);
    // Display the translated message
    console.error(message);
  }
}
```

### Synchronous vs Asynchronous Translation

```typescript
// Synchronous -- returns the value immediately if the language is loaded
const label = this.transloco.translate('common.save');

// With parameters
const message = this.transloco.translate('validation.minLength', { min: 8 });

// Asynchronous -- returns an Observable, useful when language might not be loaded yet
this.transloco.selectTranslate('common.save').subscribe(value => {
  console.log(value);
});
```

---

## Adding New Translation Keys

### Step 1: Add Keys to Both Files

When adding a new feature or component, add translation keys to **both** `ar.json` and `en.json` simultaneously.

For a new "Projects" feature:

**`src/assets/i18n/ar.json`** -- add:
```json
{
  "projects": {
    "title": "مشاريعنا",
    "subtitle": "اكتشف أحدث مشاريعنا العقارية",
    "filter": {
      "all": "الكل",
      "upcoming": "قادمة",
      "inProgress": "قيد التنفيذ",
      "completed": "مكتملة"
    },
    "detail": {
      "location": "الموقع",
      "price": "السعر",
      "area": "المساحة",
      "units": "الوحدات المتاحة",
      "contactSales": "تواصل مع المبيعات",
      "downloadBrochure": "تحميل البروشور"
    },
    "empty": "لا توجد مشاريع حالياً"
  }
}
```

**`src/assets/i18n/en.json`** -- add:
```json
{
  "projects": {
    "title": "Our Projects",
    "subtitle": "Discover our latest real estate projects",
    "filter": {
      "all": "All",
      "upcoming": "Upcoming",
      "inProgress": "In Progress",
      "completed": "Completed"
    },
    "detail": {
      "location": "Location",
      "price": "Price",
      "area": "Area",
      "units": "Available Units",
      "contactSales": "Contact Sales",
      "downloadBrochure": "Download Brochure"
    },
    "empty": "No projects available"
  }
}
```

### Step 2: Use in Template

```html
<section *transloco="let t">
  <h1 class="text-3xl font-bold font-display">{{ t('projects.title') }}</h1>
  <p class="text-muted-foreground">{{ t('projects.subtitle') }}</p>

  <div class="flex gap-2">
    <button class="rounded-md px-3 py-1.5 text-sm">{{ t('projects.filter.all') }}</button>
    <button class="rounded-md px-3 py-1.5 text-sm">{{ t('projects.filter.upcoming') }}</button>
    <button class="rounded-md px-3 py-1.5 text-sm">{{ t('projects.filter.inProgress') }}</button>
    <button class="rounded-md px-3 py-1.5 text-sm">{{ t('projects.filter.completed') }}</button>
  </div>
</section>
```

### Step 3: Verify Missing Keys

In development mode, missing keys are logged to the browser console:

```
Missing translation for key: "projects.newKey" in lang: "ar"
```

Check the console after adding new keys to ensure nothing was missed.

---

## The I18nService

The `I18nService` wraps Transloco and manages locale state, direction, and DOM updates:

```typescript
// src/app/core/services/i18n.service.ts
export type AppLocale = 'ar' | 'en';
export type AppDirection = 'rtl' | 'ltr';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly transloco = inject(TranslocoService);
  private readonly platform = inject(PlatformService);
  private readonly document = inject(DOCUMENT);

  private readonly _locale = signal<AppLocale>('ar');

  readonly locale = this._locale.asReadonly();
  readonly direction = computed<AppDirection>(() =>
    this._locale() === 'ar' ? 'rtl' : 'ltr'
  );
  readonly isRtl = computed(() => this.direction() === 'rtl');

  initialize(): void {
    const stored = this.getStoredLocale();
    const locale = stored ?? 'ar';
    this.setLocale(locale);
  }

  /** Called by localeGuard to set locale from the URL parameter. */
  initializeFromUrl(locale: AppLocale): void {
    this.setLocale(locale);
  }

  /** Returns the URL with the locale segment swapped (ar↔en). */
  switchLocaleUrl(currentUrl: string): string {
    const next: AppLocale = this._locale() === 'ar' ? 'en' : 'ar';
    const segments = currentUrl.split('/').filter(Boolean);
    if (segments.length > 0 && (segments[0] === 'ar' || segments[0] === 'en')) {
      segments[0] = next;
    } else {
      segments.unshift(next);
    }
    return '/' + segments.join('/');
  }

  setLocale(locale: AppLocale): void {
    this._locale.set(locale);
    this.transloco.setActiveLang(locale);
    this.applyLocaleToDocument(locale);
    this.storeLocale(locale);
  }

  toggleLocale(): void {
    const next: AppLocale = this._locale() === 'ar' ? 'en' : 'ar';
    this.setLocale(next);
  }

  private applyLocaleToDocument(locale: AppLocale): void {
    const html = this.document.documentElement;
    html.lang = locale;
    html.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }

  private getStoredLocale(): AppLocale | null {
    if (!this.platform.isBrowser) return null;
    const stored = localStorage.getItem('ahram-locale');
    return stored === 'ar' || stored === 'en' ? stored : null;
  }

  private storeLocale(locale: AppLocale): void {
    this.platform.runInBrowser(() => {
      localStorage.setItem('ahram-locale', locale);
    });
  }
}
```

### Key Features

- **`locale` signal**: Reactive read-only signal of the current locale.
- **`direction` computed signal**: Automatically derives `'rtl'` or `'ltr'` from the locale.
- **`isRtl` computed signal**: Boolean convenience for RTL checks.
- **`initializeFromUrl(locale)`**: Called by the `localeGuard` to set the locale from the URL path (e.g., `/ar/projects` → `'ar'`).
- **`switchLocaleUrl(currentUrl)`**: Returns the current URL with the locale segment swapped (e.g., `/ar/projects` → `/en/projects`). Used by the header language toggle.
- **`initialize()`**: Fallback for non-guard contexts. Reads from `localStorage`.
- **`toggleLocale()`**: Switches between Arabic and English (legacy, prefer `switchLocaleUrl` for route-based switching).
- **Persistence**: The selected locale is saved to `localStorage` and restored on the next visit.
- **SSR-safe**: `localStorage` access is guarded with `PlatformService`.

---

## Language Switching

### Path-Based Locale Routing

The site uses **path-based locale routing** where each locale has its own URL prefix:

- Arabic: `alahram-developments.com/ar/projects`
- English: `alahram-developments.com/en/projects`

All routes are wrapped under a `:locale` parameter. A `localeGuard` validates the locale and calls `i18n.initializeFromUrl()`. A `LocalizeRoutePipe` transforms all `routerLink` values to include the locale prefix.

### In the Header

The header component provides a language toggle that navigates to the alternate locale URL:

```typescript
@Component({
  selector: 'ahram-header',
  template: `
    <button (click)="switchLocale()">
      {{ i18n.locale() === 'ar' ? 'EN' : 'عربي' }}
    </button>
  `,
})
export class HeaderComponent {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  switchLocale(): void {
    const newUrl = this.i18n.switchLocaleUrl(this.router.url);
    this.router.navigateByUrl(newUrl);
  }
}
```

When clicked:
1. `I18nService.switchLocaleUrl()` swaps the locale segment in the current URL.
2. `Router.navigateByUrl()` navigates to the new locale URL (e.g., `/ar/projects` → `/en/projects`).
3. The `localeGuard` fires on the new route, calling `i18n.initializeFromUrl()`.
4. `TranslocoService.setActiveLang()` is called.
5. Transloco triggers a re-render of all templates using `*transloco` or the `transloco` pipe.
6. The `<html>` element's `lang` and `dir` attributes are updated.
7. The locale is persisted to `localStorage`.

### LocalizeRoutePipe

All `routerLink` values must use the `localizeRoute` pipe to prepend the locale prefix:

```html
<!-- Before (legacy) -->
<a routerLink="/projects">Projects</a>
<a [routerLink]="['/blog', post.slug]">Read</a>

<!-- After (locale-aware) -->
<a [routerLink]="'/projects' | localizeRoute">Projects</a>
<a [routerLink]="['/blog', post.slug] | localizeRoute">Read</a>
```

The pipe is `pure: false` (depends on the `i18n.locale()` signal) and accepts both `string` and `string[]` inputs.

### Programmatic Switching

```typescript
const i18n = inject(I18nService);
const router = inject(Router);

// Route-based switching (preferred)
const newUrl = i18n.switchLocaleUrl(router.url);
router.navigateByUrl(newUrl);

// Direct locale set (for non-routing contexts)
i18n.setLocale('en');
i18n.setLocale('ar');
```

### Reacting to Locale Changes

```typescript
@Component({
  template: `
    <p>Current direction: {{ i18n.direction() }}</p>
    <p>Is RTL: {{ i18n.isRtl() }}</p>
  `,
})
export class SomeComponent {
  readonly i18n = inject(I18nService);

  constructor() {
    // React to locale changes with an effect
    effect(() => {
      const locale = this.i18n.locale();
      console.log('Locale changed to:', locale);
    });
  }
}
```

---

## RTL/LTR Direction Switching

### Automatic Direction via I18nService

When the locale changes, `I18nService` automatically updates the `<html>` element:

```typescript
// Arabic
<html dir="rtl" lang="ar">

// English
<html dir="ltr" lang="en">
```

### CSS-Level Direction Support

The global stylesheet includes a base rule:

```css
[dir="rtl"] {
  direction: rtl;
}
```

Combined with Tailwind's logical property utilities (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`), the entire layout flips automatically when the direction changes.

### Conditional Direction Logic

For cases where layout needs explicit direction handling:

```typescript
@Component({
  template: `
    <!-- Sheet slides from the end (left in RTL, right in LTR) -->
    <div [class]="i18n.isRtl() ? 'slide-from-left' : 'slide-from-right'">
      Panel content
    </div>
  `,
})
export class PanelComponent {
  readonly i18n = inject(I18nService);
}
```

---

## Date, Number, and Currency Formatting

### TranslateNumber Pipe

The project includes a custom `translateNumber` pipe that formats numbers based on the current locale:

```typescript
// src/app/shared/pipes/translate-number.pipe.ts
@Pipe({ name: 'translateNumber', standalone: true, pure: false })
export class TranslateNumberPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: number | string, format: 'decimal' | 'currency' | 'percent' = 'decimal'): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);

    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'EGP',
        }).format(num);
      case 'percent':
        return new Intl.NumberFormat(locale, {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(num);
      default:
        return new Intl.NumberFormat(locale).format(num);
    }
  }
}
```

Usage:

```html
<!-- Decimal: ١٢٣٬٤٥٦ (Arabic) / 123,456 (English) -->
{{ 123456 | translateNumber }}

<!-- Currency: ١٢٣٬٤٥٦٫٠٠ ج.م. (Arabic) / EGP 123,456.00 (English) -->
{{ 123456 | translateNumber:'currency' }}

<!-- Percent: ٨٥٪ (Arabic) / 85% (English) -->
{{ 0.85 | translateNumber:'percent' }}
```

### RelativeTime Pipe

```typescript
// src/app/shared/pipes/relative-time.pipe.ts
@Pipe({ name: 'relativeTime', standalone: true, pure: false })
export class RelativeTimePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    // ... calculation logic
  }
}
```

Usage:

```html
<!-- Arabic: منذ ٣ ساعات / English: 3 hours ago -->
{{ someDate | relativeTime }}
```

### Formatting in TypeScript

For formatting in services or stores:

```typescript
@Injectable({ providedIn: 'root' })
export class FormatService {
  private readonly i18n = inject(I18nService);

  formatCurrency(amount: number): string {
    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  }

  formatDate(date: Date | string, style: 'short' | 'long' = 'long'): string {
    const d = date instanceof Date ? date : new Date(date);
    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';

    if (style === 'short') {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(d);
    }

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(d);
  }

  formatArea(sqMeters: number): string {
    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';
    const formatted = new Intl.NumberFormat(locale).format(sqMeters);
    const unit = this.i18n.locale() === 'ar' ? 'م²' : 'sqm';
    return `${formatted} ${unit}`;
  }
}
```

### Locale-Aware Formatting Table

| Format | ar-EG Example | en-US Example |
|--------|---------------|---------------|
| Decimal | ١٢٣٬٤٥٦٫٧٨ | 123,456.78 |
| Currency | ١٢٣٬٤٥٦٫٠٠ ج.م. | EGP 123,456.00 |
| Percent | ٨٥٪ | 85% |
| Date (short) | ١٥ مارس ٢٠٢٦ | Mar 15, 2026 |
| Date (long) | السبت، ١٥ مارس ٢٠٢٦ | Saturday, March 15, 2026 |
| Relative time | منذ ٣ ساعات | 3 hours ago |

---

## Best Practices for Arabic UI

### 1. Always Start with Arabic

Arabic is the default locale. Write the Arabic translation first, then the English one. This ensures the primary audience sees polished text.

### 2. Use Logical Properties Exclusively

Never use `pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`, `text-left`, or `text-right` in templates. Always use the logical equivalents (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `text-start`, `text-end`).

### 3. Test Both Directions

After implementing any layout, toggle the locale to verify the layout works in both RTL and LTR. Pay attention to:
- Navigation flow
- Icon placement (back arrows should flip)
- Form layouts
- Dialog/sheet slide direction
- Scroll direction

### 4. Use Cairo Font for Arabic Text

Cairo is specifically designed for Arabic with proper glyph shaping and diacritical mark support. It is loaded as the primary font in the project.

### 5. Handle Text Overflow in Arabic

Arabic text can be longer or shorter than the English equivalent. Design layouts to accommodate both:

```html
<!-- Use truncation classes for overflow -->
<p class="truncate">{{ t('projects.longDescription') }}</p>

<!-- Or use line clamp -->
<p class="line-clamp-3">{{ t('projects.description') }}</p>
```

### 6. Avoid Hardcoded Strings

Never hardcode Arabic or English strings in templates or TypeScript. Always use translation keys:

```html
<!-- Bad -->
<button>حفظ</button>

<!-- Good -->
<button>{{ t('common.save') }}</button>
```

### 7. Handle Bidirectional Text

When mixing Arabic and English in the same text (e.g., brand names, technical terms), use the Unicode bidirectional algorithm:

```html
<p dir="auto">مشروع Al-Ahram Heights في القاهرة الجديدة</p>
```

### 8. Phone Number Display

Egyptian phone numbers should be displayed in LTR even within an RTL context:

```html
<span dir="ltr" class="inline-block">+20 123 456 7890</span>
```

### 9. Translation Key Organization

Keep translation files organized by feature. When a feature is removed, its keys should be cleaned up:

```json
{
  "app": {},
  "header": {},
  "footer": {},
  "common": {},
  "validation": {},
  "projects": {},
  "contact": {},
  "about": {}
}
```

---

## SSR Considerations

### Translation Files in SSR

Because `TranslocoHttpLoader` uses `HttpClient`, translation file requests are captured by Angular's HTTP Transfer State. The translation JSON is fetched once on the server and serialized into the HTML, so the client does not make a duplicate request.

### Locale Detection via URL Path

With path-based locale routing, the locale is determined from the URL, not `localStorage`. Each locale gets its own prerendered HTML:

- `/ar/projects` → rendered with Arabic (`lang="ar" dir="rtl"`)
- `/en/projects` → rendered with English (`lang="en" dir="ltr"`)

The `localeGuard` reads the `:locale` route parameter and calls `i18n.initializeFromUrl(locale)`, which works identically on both server and client. This eliminates the need for cookie-based or `Accept-Language` header detection.

### Prerendering Both Locales

Static routes are prerendered for both locales at build time using `getPrerenderParams`:

```typescript
// app.routes.server.ts
{
  path: ':locale/projects',
  renderMode: RenderMode.Prerender,
  getPrerenderParams: async () => [
    { locale: 'ar' },
    { locale: 'en' },
  ],
}
```

This produces 15 prerendered HTML files (root + 7 routes x 2 locales), each with the correct `lang`/`dir` attributes and translated content.

### Hydration Mismatches

Because the locale is encoded in the URL path, the server and client always agree on the active locale. There is no hydration mismatch between server-rendered Arabic and client-side English — the URL determines the locale on both sides.

### Hreflang Alternates

The `SeoService.updateHreflang()` method generates 3 `<link>` tags for each page:

```html
<link rel="alternate" hreflang="ar" href="https://alahram-developments.com/ar/projects" />
<link rel="alternate" hreflang="en" href="https://alahram-developments.com/en/projects" />
<link rel="alternate" hreflang="x-default" href="https://alahram-developments.com/ar/projects" />
```

The `x-default` points to Arabic (the default locale). These tags help search engines discover and index both locale variants.
