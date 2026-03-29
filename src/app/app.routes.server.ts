import { RenderMode, ServerRoute } from '@angular/ssr';

const LOCALES = [{ locale: 'ar' }, { locale: 'en' }];

const ZONE_SLUGS = [
  'zone-7-strip', 'zone-7-homeland', 'zone-14', 'zone-21',
  'zone-22', 'zone-29', 'al-rawda', 'zone-35',
];

const ZONE_PROJECTS: { zoneSlug: string; slug: string }[] = [
  // Zone 7 Strip
  { zoneSlug: 'zone-7-strip', slug: 'project-255' },
  // Zone 7 Homeland
  { zoneSlug: 'zone-7-homeland', slug: 'project-29' },
  // Zone 14
  { zoneSlug: 'zone-14', slug: 'project-336' },
  { zoneSlug: 'zone-14', slug: 'project-331' },
  { zoneSlug: 'zone-14', slug: 'project-348' },
  // Zone 21
  { zoneSlug: 'zone-21', slug: 'mini-compound' },
  { zoneSlug: 'zone-21', slug: 'project-629' },
  { zoneSlug: 'zone-21', slug: 'project-584' },
  { zoneSlug: 'zone-21', slug: 'project-865' },
  { zoneSlug: 'zone-21', slug: 'project-868' },
  { zoneSlug: 'zone-21', slug: 'project-947' },
  { zoneSlug: 'zone-21', slug: 'project-791' },
  { zoneSlug: 'zone-21', slug: 'project-794' },
  { zoneSlug: 'zone-21', slug: 'project-799' },
  { zoneSlug: 'zone-21', slug: 'project-870' },
  // Zone 22
  { zoneSlug: 'zone-22', slug: 'project-1102' },
  // Zone 29
  { zoneSlug: 'zone-29', slug: 'project-1290' },
  // Al-Rawda
  { zoneSlug: 'al-rawda', slug: 'project-94' },
  { zoneSlug: 'al-rawda', slug: 'project-76' },
  // Zone 35
  { zoneSlug: 'zone-35', slug: 'project-137' },
];

const BLOG_SLUGS = [
  'sadat-city-golden-zone-investment',
  'project-865-construction-update',
  'real-estate-market-egypt-2026',
  'choosing-right-apartment-size',
  'project-868-launch-announcement',
  'benefits-of-new-cities-egypt',
];

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
    path: ':locale/construction',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/faq',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/blog',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES.flatMap(l => BLOG_SLUGS.map(slug => ({ ...l, slug }))),
  },

  // Catch-all — client-side rendering for unknown routes (404 page)
  { path: '**', renderMode: RenderMode.Client },
];
