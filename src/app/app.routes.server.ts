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
  // Root redirect
  { path: '', renderMode: RenderMode.Prerender },

  // Legacy redirects — prerender so they exist as static HTML
  { path: 'projects', renderMode: RenderMode.Prerender },
  { path: 'projects/**', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'gallery', renderMode: RenderMode.Prerender },
  { path: 'blog', renderMode: RenderMode.Prerender },
  { path: 'blog/**', renderMode: RenderMode.Prerender },
  { path: 'privacy', renderMode: RenderMode.Prerender },

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
