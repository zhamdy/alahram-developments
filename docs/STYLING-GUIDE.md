# Styling Guide

This guide covers the styling system for the Al-Ahram Developments project: Tailwind CSS v4 with CSS-first configuration, OKLCH colors, RTL/LTR support via logical properties, dark mode, responsive design, and component styling patterns.

---

## Table of Contents

1. [Tailwind CSS v4 Setup](#tailwind-css-v4-setup)
2. [Theme Configuration](#theme-configuration)
3. [Color System (OKLCH)](#color-system-oklch)
4. [Dark Mode](#dark-mode)
5. [Typography and Fonts](#typography-and-fonts)
6. [RTL/LTR with Logical Properties](#rtlltr-with-logical-properties)
7. [Responsive Breakpoints](#responsive-breakpoints)
8. [Container Utility](#container-utility)
9. [Border Radius Tokens](#border-radius-tokens)
10. [Component Styling Patterns](#component-styling-patterns)
11. [Animation and Transitions](#animation-and-transitions)
12. [Common Recipes](#common-recipes)

---

## Tailwind CSS v4 Setup

Tailwind CSS v4 uses a CSS-first configuration approach. There is no `tailwind.config.js` file. All configuration happens directly in `src/styles.css` using the `@theme` directive.

### PostCSS Configuration

> **Critical**: Angular's `@angular/build` only reads JSON PostCSS configs. It ignores `postcss.config.js` entirely. You **must** use `.postcssrc.json`.

```json
// .postcssrc.json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

Without this file, `@tailwindcss/postcss` never runs — you'll get theme variables but **zero utility classes** (`flex`, `grid`, `sticky`, etc. won't work).

### Global Stylesheet Entry

```css
/* src/styles.css */
@import "tailwindcss";

@theme {
  /* Custom theme tokens defined here */
}
```

The `@import "tailwindcss"` directive loads the entire Tailwind framework. The `@theme` directive defines custom design tokens that extend or override the defaults.

---

## Theme Configuration

The full theme is defined in `src/styles.css`:

```css
@import "tailwindcss";

@theme {
  /* Colors - Brand */
  --color-primary: oklch(0.72 0.15 55);         /* Orange/amber — brand color */
  --color-primary-foreground: oklch(0.99 0 0);
  --color-secondary: oklch(0.25 0.06 50);        /* Dark brown — footer, CTA bg */
  --color-secondary-foreground: oklch(0.92 0.02 70);
  --color-accent: oklch(0.85 0.18 90);           /* Construction yellow */
  --color-accent-foreground: oklch(0.20 0.05 55);
  --color-destructive: oklch(0.55 0.2 25);
  --color-destructive-foreground: oklch(0.98 0 0);
  --color-whatsapp: oklch(0.62 0.17 155);        /* WhatsApp green */

  /* Colors - Surfaces (warm-shifted) */
  --color-background: oklch(0.99 0.005 80);
  --color-foreground: oklch(0.18 0.03 55);
  --color-card: oklch(0.99 0.005 80);
  --color-card-foreground: oklch(0.18 0.03 55);
  --color-muted: oklch(0.95 0.01 80);
  --color-muted-foreground: oklch(0.50 0.02 55);
  --color-border: oklch(0.88 0.02 80);
  --color-input: oklch(0.88 0.02 80);
  --color-ring: oklch(0.72 0.15 55);

  /* Fonts */
  --font-display: "Cairo", "Inter", system-ui, sans-serif;
  --font-body: "Cairo", "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;

  /* Breakpoints */
  --breakpoint-xs: 475px;
}
```

### How @theme Works in Tailwind v4

Tokens defined inside `@theme` automatically generate corresponding utility classes:

| Token | Generated Classes |
|-------|------------------|
| `--color-primary` | `bg-primary`, `text-primary`, `border-primary`, etc. |
| `--color-primary-foreground` | `text-primary-foreground`, `bg-primary-foreground`, etc. |
| `--font-display` | `font-display` |
| `--font-body` | `font-body` |
| `--radius-lg` | `rounded-lg` |
| `--breakpoint-xs` | `xs:` prefix for responsive utilities |

You do **not** need to reference CSS variables manually. Write `bg-primary` in your template and Tailwind resolves it to `oklch(0.72 0.15 55)`.

---

## Color System (OKLCH)

The project uses the OKLCH color space rather than hex or HSL. OKLCH produces more perceptually uniform colors and is the modern standard in CSS.

### OKLCH Format

```
oklch(Lightness Chroma Hue)
```

| Parameter | Range | Description |
|-----------|-------|-------------|
| Lightness | 0 (black) to 1 (white) | Perceived brightness |
| Chroma | 0 (gray) to ~0.4 (vivid) | Color intensity/saturation |
| Hue | 0-360 degrees | Color wheel position |

### Project Color Palette

| Token | OKLCH Value | Description |
|-------|-------------|-------------|
| `primary` | `oklch(0.72 0.15 55)` | Orange/amber — brand color |
| `secondary` | `oklch(0.25 0.06 50)` | Dark brown — footer, dark surfaces |
| `accent` | `oklch(0.85 0.18 90)` | Construction yellow |
| `destructive` | `oklch(0.55 0.2 25)` | Red for errors/danger |
| `whatsapp` | `oklch(0.62 0.17 155)` | WhatsApp green |
| `background` | `oklch(0.99 0.005 80)` | Warm near-white page background |
| `foreground` | `oklch(0.18 0.03 55)` | Dark text |
| `muted` | `oklch(0.95 0.01 80)` | Subtle warm background |
| `muted-foreground` | `oklch(0.50 0.02 55)` | Secondary text |

### Foreground Convention

Each color token has a corresponding `-foreground` token. This makes it easy to ensure text contrast:

```html
<!-- The button background is primary; the text is primary-foreground -->
<button class="bg-primary text-primary-foreground">Submit</button>

<!-- Card surfaces use card/card-foreground -->
<div class="bg-card text-card-foreground">Content</div>
```

### Opacity Modifier

Tailwind v4 supports the `/` opacity modifier with OKLCH colors:

```html
<div class="bg-primary/90">90% opacity primary</div>
<div class="bg-primary/50">50% opacity primary</div>
<div class="border-border/60">60% opacity border</div>
```

---

## Dark Mode

Dark mode is implemented via a `.dark` class on the `<html>` element. The `AppStore` manages the theme state, and the `@theme` tokens are overridden in the `.dark` selector.

### Dark Mode Color Overrides

```css
.dark {
  --color-primary: oklch(0.75 0.14 55);
  --color-primary-foreground: oklch(0.12 0.02 55);
  --color-secondary: oklch(0.22 0.05 50);
  --color-secondary-foreground: oklch(0.90 0.02 70);
  --color-accent: oklch(0.82 0.16 90);
  --color-accent-foreground: oklch(0.15 0.04 55);
  --color-destructive: oklch(0.6 0.2 25);
  --color-destructive-foreground: oklch(0.98 0 0);
  --color-background: oklch(0.14 0.02 55);
  --color-foreground: oklch(0.93 0.01 55);
  --color-card: oklch(0.18 0.02 55);
  --color-card-foreground: oklch(0.93 0.01 55);
  --color-muted: oklch(0.23 0.02 55);
  --color-muted-foreground: oklch(0.62 0.02 55);
  --color-border: oklch(0.30 0.02 55);
  --color-input: oklch(0.30 0.02 55);
  --color-ring: oklch(0.75 0.14 55);
}
```

Key design principle: In dark mode, lightness values are **inverted** (background becomes dark, foreground becomes light), while the hue and chroma remain in the same family. This ensures consistent brand identity across modes.

### Toggling Dark Mode

The `AppStore` provides `toggleTheme()` and `setTheme()`:

```typescript
// In a component
protected readonly appStore = inject(AppStore);

// Toggle
this.appStore.toggleTheme();

// Set explicitly
this.appStore.setTheme('dark');
```

The `.dark` class must be applied to the `<html>` element for the CSS overrides to take effect. This is typically done by watching the store and updating the DOM:

```typescript
afterNextRender(() => {
  effect(() => {
    const isDark = this.appStore.isDarkMode();
    document.documentElement.classList.toggle('dark', isDark);
  });
});
```

### Writing Dark-Mode-Aware Styles

Because the color tokens automatically change under `.dark`, you rarely need `dark:` variants. Simply use the semantic tokens:

```html
<!-- These automatically adapt to dark mode -->
<div class="bg-background text-foreground">Always correct</div>
<div class="bg-card text-card-foreground border border-border">Card</div>
<p class="text-muted-foreground">Secondary text</p>
```

Only use `dark:` when you need a value that **does not** map to a semantic token:

```html
<!-- Explicit dark mode override for a one-off case -->
<div class="shadow-lg dark:shadow-none">Shadows disappear in dark mode</div>
```

---

## Typography and Fonts

### Font Families

| Token | Fonts | Usage |
|-------|-------|-------|
| `font-display` | Cairo, Inter, system-ui | Headings, brand text |
| `font-body` | Cairo, Inter, system-ui | Body text, paragraphs |
| `font-mono` | JetBrains Mono, Fira Code | Code blocks, technical data |

Cairo is loaded first because the default locale is Arabic (ar-EG). Cairo has excellent Arabic glyph support and also renders Latin characters well. Inter serves as a fallback for Latin-script contexts.

### Font Loading

Fonts are loaded via Google Fonts in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

The `display=swap` parameter ensures text is visible immediately using a system font, then swaps to Cairo/Inter once loaded.

### Typography in Templates

```html
<!-- Display font for headings -->
<h1 class="text-4xl font-bold font-display">المشاريع</h1>

<!-- Body font for content (applied globally via body class) -->
<p class="text-base text-foreground">وصف المشروع هنا</p>

<!-- Mono font for technical data -->
<code class="font-mono text-sm">REF-2024-001</code>
```

### Font Weight Scale

| Class | Weight | Use |
|-------|--------|-----|
| `font-light` | 300 | Subtle labels |
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | UI labels, buttons |
| `font-semibold` | 600 | Section headers |
| `font-bold` | 700 | Page titles |
| `font-extrabold` | 800 | Hero text |

---

## RTL/LTR with Logical Properties

The application defaults to Arabic (RTL). Tailwind CSS v4 provides logical property utilities that work correctly in both RTL and LTR layouts without any manual switching.

### The Default Direction

```html
<!-- index.html -->
<html dir="rtl" lang="ar">
```

The `I18nService` dynamically updates `dir` and `lang` when the locale changes:

```typescript
private applyLocaleToDocument(locale: AppLocale): void {
  const html = this.document.documentElement;
  html.lang = locale;
  html.dir = locale === 'ar' ? 'rtl' : 'ltr';
}
```

### Logical Property Utilities

**Always use logical properties instead of physical ones.** This ensures the layout flips correctly between RTL and LTR.

| Physical (avoid) | Logical (use) | RTL Behavior | LTR Behavior |
|-------------------|---------------|--------------|--------------|
| `pl-4` | `ps-4` | padding-right: 1rem | padding-left: 1rem |
| `pr-4` | `pe-4` | padding-left: 1rem | padding-right: 1rem |
| `ml-4` | `ms-4` | margin-right: 1rem | margin-left: 1rem |
| `mr-4` | `me-4` | margin-left: 1rem | margin-right: 1rem |
| `left-0` | `start-0` | right: 0 | left: 0 |
| `right-0` | `end-0` | left: 0 | right: 0 |
| `text-left` | `text-start` | text-align: right | text-align: left |
| `text-right` | `text-end` | text-align: left | text-align: right |
| `border-l` | `border-s` | border-right | border-left |
| `border-r` | `border-e` | border-left | border-right |
| `rounded-l-lg` | `rounded-s-lg` | rounded-right | rounded-left |
| `rounded-r-lg` | `rounded-e-lg` | rounded-left | rounded-right |
| `float-left` | `float-start` | float: right | float: left |
| `float-right` | `float-end` | float: left | float: right |

### Examples

```html
<!-- Correct: Uses logical properties -->
<div class="flex items-center gap-3 ps-4 pe-6">
  <img class="h-10 w-10 rounded-full" />
  <div class="ms-2">
    <p class="text-sm font-medium">اسم المستخدم</p>
    <p class="text-xs text-muted-foreground text-start">مشرف</p>
  </div>
</div>

<!-- Incorrect: Uses physical properties -- breaks in RTL -->
<div class="flex items-center gap-3 pl-4 pr-6">
  <!-- ... -->
</div>
```

### Properties That Do NOT Need Logical Versions

Some properties are direction-agnostic and work the same in RTL and LTR:

- `px-4`, `py-4` -- horizontal/vertical padding
- `mx-auto` -- centers in both directions
- `gap-4` -- flex/grid gap
- `space-x-4` -- spacing between children (Tailwind handles this)
- `w-*`, `h-*` -- width and height
- `top-*`, `bottom-*` -- vertical positioning

### Inline CSS Direction Override

For the rare case where you need explicit physical positioning (e.g., a fixed layout element):

```css
/* Use with caution -- only when logical properties cannot achieve the desired result */
[dir="rtl"] .force-left {
  left: 0;
}
[dir="ltr"] .force-left {
  left: 0;
}
```

---

## Responsive Breakpoints

### Default Breakpoints

| Prefix | Min Width | Target |
|--------|-----------|--------|
| `xs:` | 475px | Large phones (custom) |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Small desktops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large desktops |

The `xs` breakpoint is a custom addition defined in `@theme`:

```css
@theme {
  --breakpoint-xs: 475px;
}
```

### Mobile-First Approach

All styles are mobile-first. Write base styles for the smallest screen, then layer on responsive overrides:

```html
<!-- Mobile: single column, small text -->
<!-- Tablet (md): two columns -->
<!-- Desktop (lg): three columns, larger text -->
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
  <ahram-project-card />
  <ahram-project-card />
  <ahram-project-card />
</div>

<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold font-display">
  المشاريع
</h1>
```

---

## Container Utility

A custom `.container` utility is defined in `styles.css`:

```css
@layer utilities {
  .container {
    width: 100%;
    margin-inline: auto;
    padding-inline: 1rem;
  }

  @media (min-width: 640px) {
    .container { max-width: 640px; }
  }
  @media (min-width: 768px) {
    .container { max-width: 768px; }
  }
  @media (min-width: 1024px) {
    .container { max-width: 1024px; }
  }
  @media (min-width: 1280px) {
    .container { max-width: 1280px; }
  }
}
```

Note: `margin-inline: auto` and `padding-inline: 1rem` are logical properties and work correctly in both RTL and LTR.

Usage:

```html
<div class="container px-4">
  <!-- Content is centered with max-width at each breakpoint -->
</div>
```

---

## Border Radius Tokens

| Class | Token | Value |
|-------|-------|-------|
| `rounded-sm` | `--radius-sm` | 0.25rem (4px) |
| `rounded-md` | `--radius-md` | 0.375rem (6px) |
| `rounded-lg` | `--radius-lg` | 0.5rem (8px) |
| `rounded-xl` | `--radius-xl` | 0.75rem (12px) |
| `rounded-2xl` | `--radius-2xl` | 1rem (16px) |

Usage pattern:

```html
<!-- Buttons: medium radius -->
<button class="rounded-md bg-primary px-4 py-2 text-primary-foreground">Submit</button>

<!-- Cards: large radius -->
<div class="rounded-lg border border-border bg-card p-6">Card content</div>

<!-- Modals/dialogs: extra-large radius -->
<div class="rounded-xl bg-background p-8 shadow-lg">Modal content</div>

<!-- Avatars: full radius -->
<img class="h-10 w-10 rounded-full" src="avatar.jpg" />
```

---

## Component Styling Patterns

### Pattern 1: Separate Template + Tailwind Classes

All components use separate `.ts`, `.html`, and `.scss` files. Styles are applied as Tailwind classes in the HTML template. The `.scss` file handles host styles and animations only:

```typescript
// card.component.ts
@Component({
  selector: 'ahram-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  readonly title = input<string>();
}
```

```html
<!-- card.component.html -->
<div class="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
  @if (title()) {
    <div class="flex flex-col space-y-1.5 p-6">
      <h3 class="text-2xl font-semibold leading-none tracking-tight font-display">
        {{ title() }}
      </h3>
    </div>
  }
  <div class="p-6 pt-0">
    <ng-content />
  </div>
</div>
```

```scss
// card.component.scss
:host {
  display: block;
}
```

### Pattern 2: Variant Maps for Multi-Variant Components

For components with multiple visual variants, use a Record/map of class strings:

```typescript
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

@Component({
  selector: 'ahram-button',
  template: `
    <button
      [ngClass]="[baseClasses, variantClasses[variant()], sizeClasses[size()]]"
    >
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');

  protected readonly baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

  protected readonly variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  protected readonly sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-11 px-8 text-base',
    icon: 'h-10 w-10',
  };
}
```

### Pattern 3: Conditional Classes with NgClass

```html
<input
  [ngClass]="[
    'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
    error() ? 'border-destructive' : 'border-input'
  ]"
/>
```

### Pattern 4: Accepting Custom Classes via Input

```typescript
@Component({
  selector: 'ahram-card',
  template: `
    <div [ngClass]="['rounded-lg border border-border bg-card shadow-sm', className()]">
      <ng-content />
    </div>
  `,
})
export class CardComponent {
  readonly className = input('');
}
```

Usage:

```html
<ahram-card className="p-8 md:p-12">
  Custom padded card
</ahram-card>
```

---

## Animation and Transitions

### Transition Utilities

```html
<!-- Color transition on hover -->
<button class="transition-colors hover:bg-accent">Hover me</button>

<!-- All transitions -->
<div class="transition-all duration-200 hover:scale-105">Scale on hover</div>

<!-- Opacity transition -->
<div class="transition-opacity duration-300" [class.opacity-0]="!isVisible()">
  Fade in/out
</div>
```

### Tailwind Animation Classes

```html
<!-- Spin (used in loading spinners) -->
<svg class="animate-spin h-5 w-5">...</svg>

<!-- Pulse (used in skeleton loaders) -->
<div class="h-4 w-full animate-pulse rounded bg-muted"></div>

<!-- Bounce -->
<div class="animate-bounce">Arrow down</div>
```

### View Transitions

The app uses Angular's `withViewTransitions()` router feature:

```typescript
provideRouter(routes, withViewTransitions())
```

This enables CSS view transitions when navigating between routes, providing smooth cross-fade effects without custom animation code.

---

## Common Recipes

### Sticky Header

```html
<header class="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div class="container flex h-16 items-center justify-between px-4">
    <!-- Header content -->
  </div>
</header>
```

### Responsive Grid Layout

```html
<div class="grid grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  @for (project of projects(); track project.id) {
    <ahram-project-card [project]="project" />
  }
</div>
```

### Skeleton Loading State

```html
@if (isLoading()) {
  <div class="space-y-4">
    @for (i of [1, 2, 3]; track i) {
      <div class="flex gap-4">
        <div class="h-24 w-24 animate-pulse rounded-lg bg-muted"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
          <div class="h-4 w-1/2 animate-pulse rounded bg-muted"></div>
          <div class="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
        </div>
      </div>
    }
  </div>
}
```

### Focus Ring Pattern

All interactive elements should use consistent focus styling:

```html
<button class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Accessible button
</button>
```

The base styles in `styles.css` also set a global focus-visible style:

```css
:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}
```

### Two-Column Layout with Sidebar

```html
<div class="flex min-h-screen">
  <!-- Sidebar -->
  <aside class="hidden w-64 border-e border-border bg-card p-4 lg:block">
    <!-- Navigation -->
  </aside>

  <!-- Main content -->
  <main class="flex-1 p-4 lg:p-8">
    <router-outlet />
  </main>
</div>
```

Note the use of `border-e` (logical end border) which renders as `border-left` in RTL and `border-right` in LTR.
