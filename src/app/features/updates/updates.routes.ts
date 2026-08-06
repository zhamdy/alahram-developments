import { Routes } from '@angular/router';

export const UPDATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./updates.component').then((m) => m.UpdatesComponent),
  },
];
