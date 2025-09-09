import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { switchMap, take, tap, throwError } from 'rxjs';
import { getToken } from '../store/user-profile/user-profile.selectors';
import { Router } from '@angular/router';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (!exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
  } catch (e) {
    return true;
  }
}
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const router = inject(Router);
  
  return store.select(getToken).pipe(
    take(1),
    switchMap(token => {
      let modifiedReq = req;
      if (token) {

        if(isTokenExpired(token)){
           router.navigate(['/auth/login']);
           throwError(() => new Error('No token, redirecting to login'));
        }
        if(!req.url.includes('/generate-timetable')){
         modifiedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        }
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