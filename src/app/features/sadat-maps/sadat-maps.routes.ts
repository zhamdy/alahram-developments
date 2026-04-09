import { Routes } from '@angular/router';

export const SADAT_MAPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./sadat-maps.component').then((m) => m.SadatMapsComponent),
  },
];
