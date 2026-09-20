import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions, withComponentInputBinding, withInMemoryScrolling, RouteReuseStrategy } from '@angular/router';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions, withIncrementalHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideTranslocoConfig } from './core/services/transloco-config';
import { authInterceptor, errorInterceptor, loadingInterceptor } from './core/interceptors';
import { LocaleRouteReuseStrategy } from './core/routing/locale-route-reuse.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withViewTransitions(),
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
    provideClientHydration(
      withEventReplay(),
      // Deferred blocks render their content on the server and only defer
      // hydration, so sections below the fold stay in the crawlable HTML.
      withIncrementalHydration(),
      withHttpTransferCacheOptions({
        includePostRequests: true,
        filter: (req) => !req.url.includes('/api/'),
      })
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])
    ),
    { provide: RouteReuseStrategy, useClass: LocaleRouteReuseStrategy },
    ...provideTranslocoConfig(),
  ],
};
