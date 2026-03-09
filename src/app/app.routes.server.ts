import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Root redirect
  { path: '', renderMode: RenderMode.Prerender },

  // Legacy redirects — handle via Server since they redirect
  { path: 'projects', renderMode: RenderMode.Server },
  { path: 'projects/**', renderMode: RenderMode.Server },
  { path: 'about', renderMode: RenderMode.Server },
  { path: 'contact', renderMode: RenderMode.Server },
  { path: 'gallery', renderMode: RenderMode.Server },
  { path: 'blog', renderMode: RenderMode.Server },
  { path: 'blog/**', renderMode: RenderMode.Server },
  { path: 'privacy', renderMode: RenderMode.Server },

  // Locale-prefixed static routes — prerender both ar and en
  {
    path: ':locale',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/about',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/contact',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/gallery',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/privacy',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/projects',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/projects/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: ':locale/sadat-guide',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/construction',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/payment-plans',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/faq',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/investors',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/blog',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { locale: 'ar' },
      { locale: 'en' },
    ],
  },
  {
    path: ':locale/blog/:slug',
    renderMode: RenderMode.Server,
  },

  // Catch-all
  { path: '**', renderMode: RenderMode.Server },
];
