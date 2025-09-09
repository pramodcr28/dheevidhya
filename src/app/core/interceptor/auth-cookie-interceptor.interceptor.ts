import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { switchMap, take, tap, throwError } from 'rxjs';
import { getToken } from '../store/user-profile/user-profile.selectors';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const router = inject(Router);
  
  return store.select(getToken).pipe(
    take(1),
    switchMap(token => {
      let modifiedReq = req;
      if (token &&  !req.url.includes('/generate-timetable')) {
        modifiedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }else{
        if (!req.url.includes('/api/authenticate')) {
          router.navigate(['/auth/login']);
           throwError(() => new Error('No token, redirecting to login'));
        }
      }
      
      return next(modifiedReq);
    })
  );
};