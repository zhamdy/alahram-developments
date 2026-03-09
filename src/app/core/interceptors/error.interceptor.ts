import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const transloco = inject(TranslocoService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = transloco.translate('errors.unexpected');

      if (error.error instanceof ErrorEvent) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 0:
            errorMessage = transloco.translate('errors.noConnection');
            break;
          case 400:
            errorMessage = error.error?.error ?? transloco.translate('errors.badRequest');
            break;
          case 403:
            errorMessage = transloco.translate('errors.forbidden');
            break;
          case 404:
            errorMessage = transloco.translate('errors.notFound');
            break;
          case 500:
            errorMessage = transloco.translate('errors.serverError');
            break;
        }
      }

      console.error(`[API Error] ${req.method} ${req.url}:`, errorMessage);

      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error,
      }));
    })
  );
};
