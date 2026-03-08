import { Routes } from '@angular/router';
import { NotFoundComponent } from './core/layout/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES),
  },
  {
    path: 'projects',
    loadChildren: () =>
      import('./features/projects/projects.routes').then(
        (m) => m.PROJECTS_ROUTES,
      ),
  },
  {
    path: 'about',
    loadChildren: () =>
      import('./features/about/about.routes').then(
        (m) => m.ABOUT_ROUTES,
      ),
  },
  {
    path: 'contact',
    loadChildren: () =>
      import('./features/contact/contact.routes').then(
        (m) => m.CONTACT_ROUTES,
      ),
  },
  {
    path: 'gallery',
    loadChildren: () =>
      import('./features/gallery/gallery.routes').then(
        (m) => m.GALLERY_ROUTES,
      ),
  },
  {
    path: 'blog',
    loadChildren: () =>
      import('./features/blog/blog.routes').then(
        (m) => m.BLOG_ROUTES,
      ),
  },
  {
    path: 'privacy',
    loadChildren: () =>
      import('./features/privacy/privacy.routes').then(
        (m) => m.PRIVACY_ROUTES,
      ),
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
