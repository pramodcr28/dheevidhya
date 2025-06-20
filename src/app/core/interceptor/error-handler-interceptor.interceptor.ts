import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';

export const errorHandlerInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
  return next(req).pipe(
    tap(response => {
      // Optionally log responses
      // console.log('Response:', response);
    }),
    catchError(err => {
      if (err.status === 401 || err.status === 403) {
        router.navigate(['/auth/login']);
      }
      return throwError(() => err);
    })
  );
};
