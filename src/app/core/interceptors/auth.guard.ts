import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const accessToken = localStorage.getItem('accessToken');

  // 1️⃣ Ako već ima access token → pusti
  if (accessToken) {
    return true;
  }

  // 2️⃣ Nema tokena → pokušaj refresh
  return authService.refresh().pipe(
    map(res => {
      if (res?.token) {
        localStorage.setItem('accessToken', res.token);
        return true;
      }

      router.navigate(['/login']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
