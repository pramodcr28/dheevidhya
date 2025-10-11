import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { ApiLoaderService } from './../services/loaderService';

export const errorHandlerInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const loader = inject(ApiLoaderService);
    return next(req).pipe(
        tap((response) => {
            // Optionally log responses
            // console.log('Response:', response);
        }),
        catchError((err) => {
            if (err.status === 401 || err.status === 403) {
                router.navigate(['/auth/login']);
                loader.hide();
            }
            return throwError(() => err);
        })
    );
};
