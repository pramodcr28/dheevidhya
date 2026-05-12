import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, tap, throwError } from 'rxjs';
import { clearUserProfile } from '../store/user-profile/user-profile.actions';
import { UserProfileState } from '../store/user-profile/user-profile.reducer';
import { ApiLoaderService } from './../services/loaderService';

export const errorHandlerInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const loader = inject(ApiLoaderService);
    const store = inject(Store<{ userProfile: UserProfileState }>);
    return next(req).pipe(
        tap((response) => {
            // Optionally log responses
            // console.log('Response:', response);
        }),
        catchError((err) => {
            if (err.status === 401 || err.status === 403) {
                store.dispatch(clearUserProfile());
                router.navigate(['/auth/login']);
                loader.hide();
            }
            return throwError(() => err);
        })
    );
};
