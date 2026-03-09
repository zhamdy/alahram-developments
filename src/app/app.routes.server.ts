import { RenderMode, ServerRoute } from '@angular/ssr';

const LOCALES = [{ locale: 'ar' }, { locale: 'en' }];

const PROJECT_SLUGS = ['project-865', 'project-868', 'project-76'];

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
  {
    path: ':locale/projects/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      LOCALES.flatMap(l =>
        PROJECT_SLUGS.map(slug => ({ ...l, slug })),
      ),
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
    path: ':locale/payment-plans',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/faq',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LOCALES,
  },
  {
    path: ':locale/investors',
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
    getPrerenderParams: async () =>
      LOCALES.flatMap(l =>
        BLOG_SLUGS.map(slug => ({ ...l, slug })),
      ),
  },

  // Catch-all — client-side rendering for unknown routes (404 page)
  { path: '**', renderMode: RenderMode.Client },
];
