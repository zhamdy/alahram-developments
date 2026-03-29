import { Routes } from '@angular/router';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./projects-list/projects-list.component').then(
        (m) => m.ProjectsListComponent,
      ),
  },
  {
    path: ':zoneSlug',
    loadComponent: () =>
      import('./zone-projects/zone-projects.component').then(
        (m) => m.ZoneProjectsComponent,
      ),
  },
  {
    path: ':zoneSlug/:slug',
    loadComponent: () =>
      import('./project-detail/project-detail.component').then(
        (m) => m.ProjectDetailComponent,
      ),
  },
];
