import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuth = req.url.includes('/auth/');
      const status = err.status;

      // Ignore expected auth errors za auth rute (401/403)
      const shouldIgnore = isAuth && (status === 401 || status === 403);

      if (!shouldIgnore) {
        if (status === 429) {
          // Posebna stranica za rate limit
          router.navigate(['/rate-limit-page'], { replaceUrl: true });
        } else {
          // Sve ostale greške idu na standardnu error page
          router.navigate(['/error'], {
            state: {
              status,
              message: err.error?.message || 'Unexpected error',
              path: req.url
            },
            replaceUrl: true
          });
        }
      }

      return throwError(() => err);
    })
  );
};
