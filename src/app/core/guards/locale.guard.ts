import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { I18nService, type AppLocale } from '../services/i18n.service';

const SUPPORTED_LOCALES: readonly string[] = ['ar', 'en'];

export const localeGuard: CanActivateFn = (route) => {
  const i18n = inject(I18nService);
  const router = inject(Router);
  const locale = route.paramMap.get('locale');

  if (locale && SUPPORTED_LOCALES.includes(locale)) {
    i18n.initializeFromUrl(locale as AppLocale);
    return true;
  }

  return router.createUrlTree(['/ar']);
};
