import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'gallery', renderMode: RenderMode.Prerender },
  { path: 'privacy', renderMode: RenderMode.Prerender },
  { path: 'projects', renderMode: RenderMode.Prerender },
  { path: 'projects/:slug', renderMode: RenderMode.Server },
  { path: 'blog', renderMode: RenderMode.Prerender },
  { path: 'blog/:slug', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Client },
];
