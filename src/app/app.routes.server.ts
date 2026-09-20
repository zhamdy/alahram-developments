import { RenderMode, ServerRoute } from '@angular/ssr';

// Generated from the live API by scripts/generate-content-manifest.js (npm prebuild).
// Do not hand-edit: stale entries here become 404s or dead prerendered pages.
import contentManifest from './content-manifest.json';

const LOCALES = [{ locale: 'ar' }, { locale: 'en' }];

const ZONE_SLUGS = contentManifest.zones;

const ZONE_PROJECTS: { zoneSlug: string; slug: string }[] = contentManifest.projects;

// Keep in step with PAGE_SIZE in blog-list.component.ts.
const BLOG_PAGE_SIZE = 9;

const BLOG_SLUGS = [
  'alahram-10-years-sadat-city',
  'alahram-after-sale-support',
  'alahram-customer-experience-stories',
  'alahram-delivery-commitment',
  'alahram-sustainable-building-practices',
  'alahram-why-sadat-city-strategic-choice',
  'apartment-size-selection-guide',
  'apartment-vs-villa-sadat-city',
  'commercial-unit-investment-sadat',
  'construction-phases-residential-egypt',
  'egypt-new-cities-advantages',
  'egypt-real-estate-market-outlook-2026',
  'family-vs-investor-property-mindset',
  'how-to-choose-a-real-estate-developer',
  'off-plan-vs-ready-property-sadat',
  'payment-plans-sadat-city-guide',
  'property-contract-due-diligence-egypt',
  'real-estate-mortgage-guide-egypt',
  'roi-calculation-sadat-city-property',
  'sadat-city-cairo-alex-road-advantage',
  'sadat-city-central-axis-impact',
  'sadat-city-compounds-complete-guide',
  'sadat-city-distinguished-district',
  'sadat-city-future-expansion-2030',
  'sadat-city-gafi-investment-incentives',
  'sadat-city-golden-zone-guide',
  'sadat-city-green-belt-lifestyle',
  'sadat-city-healthcare-facilities',
  'sadat-city-industrial-zones',
  'sadat-city-infrastructure-property-values',
  'sadat-city-malls-commercial-guide',
  'sadat-city-master-plan-explained',
  'sadat-city-mosques-religious-community',
  'sadat-city-noise-environment',
  'sadat-city-overview-2026',
  'sadat-city-private-university-guide',
  'sadat-city-property-market-2025-2026',
  'sadat-city-schools-family-living',
  'sadat-city-sports-clubs-leisure',
  'sadat-city-technology-zone',
  'sadat-city-textile-complex-impact',
  'sadat-city-transportation-links',
  'sadat-city-universities-education',
  'sadat-city-vs-6th-october',
  'sadat-city-vs-new-capital',
  'sadat-city-zone-14-investment',
  'sadat-city-zone-21-guide',
  'utilities-services-sadat-city-property',
];

const BLOG_PAGES = Math.ceil(BLOG_SLUGS.length / BLOG_PAGE_SIZE);

export const serverRoutes: ServerRoute[] = [
  // Root and legacy redirects — handled by Cloudflare _redirects, not prerendered
  { path: '', renderMode: RenderMode.Client },
  { path: 'projects', renderMode: RenderMode.Client },
  { path: 'projects/**', renderMode: RenderMode.Client },
  { path: 'about', renderMode: RenderMode.Client },
  { path: 'contact', renderMode: RenderMode.Client },
  { path: 'gallery', renderMode: RenderMode.Client },
  { path: 'blog', renderMode: RenderMode.Client },
  { path: 'blog/**', renderMode: RenderMode.Client },
  { path: 'privacy', renderMode: RenderMode.Client },
  { path: 'sadat-city-maps', renderMode: RenderMode.Client },
  { path: 'خارطة-مدينة-السادات', renderMode: RenderMode.Client },

  // Locale-prefixed static routes — prerender both ar and en
  {
    path: ':locale',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/about',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/contact',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/gallery',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/privacy',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/projects',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  // Zone pages
  {
    path: ':locale/projects/:zoneSlug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      LOCALES.flatMap(l => ZONE_SLUGS.map(zoneSlug => ({ ...l, zoneSlug }))),
  },
  // Project detail pages
  {
    path: ':locale/projects/:zoneSlug/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      LOCALES.flatMap(l => ZONE_PROJECTS.map(p => ({ ...l, zoneSlug: p.zoneSlug, slug: p.slug }))),
  },
  {
    path: ':locale/sadat-guide',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/sadat-city-maps',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/construction',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/blog',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    // Page 1 is /blog/, so only 2..N need their own prerendered document.
    path: ':locale/blog/page/:page',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      LOCALES.flatMap(l =>
        Array.from({ length: BLOG_PAGES - 1 }, (_, i) => ({ ...l, page: String(i + 2) })),
      ),
  },
  {
    path: ':locale/blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES.flatMap(l => BLOG_SLUGS.map(slug => ({ ...l, slug }))),
  },

  // Admin — client-side only (no SSR/prerender)
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },

  // Catch-all — client-side rendering for unknown routes (404 page)
  { path: '**', renderMode: RenderMode.Client },
];
