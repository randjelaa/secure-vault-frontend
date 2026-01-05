import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuth = req.url.includes('/auth/');
      const is401 = err.status === 401;

      if (!is401 && !isAuth) {
        router.navigate(['/error'], {
          state: {
            status: err.status,
            message: err.error?.message || 'Unexpected error',
            path: req.url
          }
        });
      }

      return throwError(() => err);
    })
  );
};
