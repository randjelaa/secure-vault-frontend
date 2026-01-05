import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ako je auth ruta → preskoči refresh
    if (req.url.includes('/auth/login') || req.url.includes('/auth/login/mfa') || 
        req.url.includes('/auth/refresh') || req.url.includes('/auth/logout')) {
      return next.handle(req);
    }

    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      req = this.addToken(req, accessToken);
      return next.handle(req).pipe(
        catchError(err => this.handle401Error(req, next, err))
      );
    }

    // Nema tokena → pokušaj refresh
    return from(this.authService.refresh().toPromise()).pipe(
      switchMap(res => {
        if (res?.token) {
          localStorage.setItem('accessToken', res.token);
          req = this.addToken(req, res.token);
        }
        return next.handle(req);
      }),
      catchError(err => throwError(() => err))
    );
  }


  private addToken(req: HttpRequest<any>, token: string) {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler, err: any): Observable<HttpEvent<any>> {
    if (err instanceof HttpErrorResponse && err.status === 401 && !this.isRefreshing) {
      this.isRefreshing = true;

      return from(this.authService.refresh().toPromise()).pipe(
        switchMap(res => {
          this.isRefreshing = false;
          if (res?.token) {
            localStorage.setItem('accessToken', res.token);
            req = this.addToken(req, res.token);
            return next.handle(req);
          }
          return throwError(() => err);
        }),
        catchError(e => {
          this.isRefreshing = false;
          // Refresh nije uspeo → logout korisnika
          this.authService.logout().subscribe();
          return throwError(() => e);
        })
      );
    }

    return throwError(() => err);
  }
}
