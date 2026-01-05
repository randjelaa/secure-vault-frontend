import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        // Svi ostali errori osim 401 idu na error page
        if (err.status !== 401) {
          this.router.navigate(['/error'], {
            state: { status: err.status, message: err.error?.message, path: req.url }
          });
        }
        return throwError(() => err);
      })
    );
  }
}
