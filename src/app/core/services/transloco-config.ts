import { ApplicationConfig } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-loader';
import { environment } from '../../../environments/environment';

export function provideTranslocoConfig(): ApplicationConfig['providers'] {
  return [
    provideTransloco({
      config: {
        availableLangs: ['ar', 'en'],
        defaultLang: environment.defaultLocale,
        reRenderOnLangChange: true,
        prodMode: environment.production,
        fallbackLang: 'ar',
        missingHandler: {
          logMissingKey: !environment.production,
        },
      },
      loader: TranslocoHttpLoader,
    }),
  ];
}
