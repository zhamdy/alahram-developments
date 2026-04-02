import { Routes } from '@angular/router';
import { adminAuthGuard, adminGuestGuard } from './guards/admin-auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [adminGuestGuard],
    loadComponent: () =>
      import('./login/admin-login.component').then(m => m.AdminLoginComponent),
  },
  {
    path: '',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./projects/project-list.component').then(m => m.ProjectListComponent),
      },
      {
        path: 'projects/new',
        loadComponent: () =>
          import('./projects/project-form.component').then(m => m.ProjectFormComponent),
      },
      {
        path: 'projects/:id/edit',
        loadComponent: () =>
          import('./projects/project-form.component').then(m => m.ProjectFormComponent),
      },
      {
        path: 'zones',
        loadComponent: () =>
          import('./zones/zone-list.component').then(m => m.ZoneListComponent),
      },
      {
        path: 'zones/new',
        loadComponent: () =>
          import('./zones/zone-form.component').then(m => m.ZoneFormComponent),
      },
      {
        path: 'zones/:id/edit',
        loadComponent: () =>
          import('./zones/zone-form.component').then(m => m.ZoneFormComponent),
      },
      {
        path: 'gallery',
        loadComponent: () =>
          import('./gallery/gallery-manage.component').then(m => m.GalleryManageComponent),
      },
      {
        path: 'contacts',
        loadComponent: () =>
          import('./contacts/contact-list.component').then(m => m.ContactListComponent),
      },
    ],
  },
];
