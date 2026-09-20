import { Routes } from '@angular/router';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./blog-list/blog-list.component').then(
        (m) => m.BlogListComponent,
      ),
  },
  {
    // Must precede :slug, or "page" is taken for a post slug.
    path: 'page/:page',
    loadComponent: () =>
      import('./blog-list/blog-list.component').then(
        (m) => m.BlogListComponent,
      ),
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./blog-detail/blog-detail.component').then(
        (m) => m.BlogDetailComponent,
      ),
  },
];
