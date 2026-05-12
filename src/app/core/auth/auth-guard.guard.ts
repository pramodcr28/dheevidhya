import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { clearUserProfile } from '../store/user-profile/user-profile.actions';
import { getToken } from '../store/user-profile/user-profile.selectors';

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

export const authGuard: CanActivateFn = (route, state) => {
    const store = inject(Store);
    const router = inject(Router);

    return store.select(getToken).pipe(
        take(1),
        map((token) => {
            if (token && !isTokenExpired(token)) {
                return true;
            }
            store.dispatch(clearUserProfile());
            router.navigate(['/auth/login']);
            return false;
        })
    );
};
