import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'حدث خطأ غير متوقع';

      if (error.error instanceof ErrorEvent) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 0:
            errorMessage = 'لا يمكن الاتصال بالخادم';
            break;
          case 400:
            errorMessage = error.error?.error ?? 'طلب غير صالح';
            break;
          case 403:
            errorMessage = 'غير مصرح لك بالوصول';
            break;
          case 404:
            errorMessage = 'المورد غير موجود';
            break;
          case 500:
            errorMessage = 'خطأ في الخادم الداخلي';
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
