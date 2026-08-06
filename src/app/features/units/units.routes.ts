import { Routes } from '@angular/router';

export const UNITS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./units-list/units-list.component').then(
        (m) => m.UnitsListComponent,
      ),
  },
];
