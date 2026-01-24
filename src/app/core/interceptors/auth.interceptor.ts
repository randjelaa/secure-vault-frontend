import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const accessToken = localStorage.getItem('accessToken');

  const authReq = accessToken
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${accessToken}` }
      })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return authService.refresh().pipe(
          switchMap(res => {
            localStorage.setItem('accessToken', res.token);
            return next(
              req.clone({
                setHeaders: { Authorization: `Bearer ${res.token}` }
              })
            );
          }),
          catchError(e => {
            authService.logout().subscribe();
            return throwError(() => e);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
