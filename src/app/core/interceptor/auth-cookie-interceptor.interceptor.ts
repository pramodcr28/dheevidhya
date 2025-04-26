import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { switchMap, take, tap } from 'rxjs';
import { getToken } from '../store/user-profile/user-profile.selectors';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  
  return store.select(getToken).pipe(
    take(1),
    switchMap(token => {
      let modifiedReq = req;
      if (token) {
        modifiedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      return next(modifiedReq);
    })
  );
};