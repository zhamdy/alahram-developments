import { Routes } from '@angular/router';
import { NotFoundComponent } from './core/layout/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./core/layout/not-found/not-found.component').then(m => m.NotFoundComponent),
    // TODO: Replace with home/landing page feature when created
  },
  // Feature routes will be lazy-loaded here:
  // {
  //   path: 'projects',
  //   loadChildren: () => import('./features/projects/projects.routes').then(m => m.PROJECTS_ROUTES),
  // },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
