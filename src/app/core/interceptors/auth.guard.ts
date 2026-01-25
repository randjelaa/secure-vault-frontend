import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  const accessToken = localStorage.getItem('accessToken');

  if (accessToken) {
    return true;
  }

  return authService.refresh().pipe(
    map(res => {
      if (res?.token) {
        localStorage.setItem('accessToken', res.token);
        return true;
      }

      authService.logout().subscribe();
      return false;
    }),
    catchError(() => {
      authService.logout().subscribe();
      return of(false);
    })
  );
};
