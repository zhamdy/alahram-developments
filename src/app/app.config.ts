import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions, withComponentInputBinding } from '@angular/router';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideTranslocoConfig } from './core/services/transloco-config';
import { authInterceptor, errorInterceptor, loadingInterceptor } from './core/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withViewTransitions(),
      withComponentInputBinding()
    ),
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({ includePostRequests: true })
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])
    ),
    ...provideTranslocoConfig(),
  ],
};
