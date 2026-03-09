import { Routes } from '@angular/router';

export const INVESTORS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./investors.component').then((m) => m.InvestorsComponent),
  },
];
