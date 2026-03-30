import { Routes } from '@angular/router';
import { localeGuard } from './core/guards';

export const routes: Routes = [
  // Admin panel (no locale prefix)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },

  // Root redirect to default locale
  { path: '', redirectTo: 'ar', pathMatch: 'full' },

  // Legacy redirects (pre-locale URLs)
  { path: 'projects', redirectTo: 'ar/projects', pathMatch: 'prefix' },
  { path: 'about', redirectTo: 'ar/about', pathMatch: 'full' },
  { path: 'contact', redirectTo: 'ar/contact', pathMatch: 'full' },
  { path: 'gallery', redirectTo: 'ar/gallery', pathMatch: 'full' },
  { path: 'blog', redirectTo: 'ar/blog', pathMatch: 'prefix' },
  { path: 'privacy', redirectTo: 'ar/privacy', pathMatch: 'full' },

  // Locale-prefixed routes
  {
    path: ':locale',
    canActivate: [localeGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES),
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/projects.routes').then(m => m.PROJECTS_ROUTES),
      },
      {
        path: 'about',
        loadChildren: () => import('./features/about/about.routes').then(m => m.ABOUT_ROUTES),
      },
      {
        path: 'contact',
        loadChildren: () => import('./features/contact/contact.routes').then(m => m.CONTACT_ROUTES),
      },
      {
        path: 'gallery',
        loadChildren: () => import('./features/gallery/gallery.routes').then(m => m.GALLERY_ROUTES),
      },
      {
        path: 'blog',
        loadChildren: () => import('./features/blog/blog.routes').then(m => m.BLOG_ROUTES),
      },
      {
        path: 'sadat-guide',
        loadChildren: () => import('./features/guide/guide.routes').then(m => m.GUIDE_ROUTES),
      },
      {
        path: 'construction',
        loadChildren: () => import('./features/updates/updates.routes').then(m => m.UPDATES_ROUTES),
      },
      {
        path: 'faq',
        loadChildren: () => import('./features/faq/faq.routes').then(m => m.FAQ_ROUTES),
      },
      {
        path: 'privacy',
        loadChildren: () => import('./features/privacy/privacy.routes').then(m => m.PRIVACY_ROUTES),
      },
    ],
  },

  // 404 catch-all
  {
    path: '**',
    loadComponent: () =>
      import('./core/layout/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
