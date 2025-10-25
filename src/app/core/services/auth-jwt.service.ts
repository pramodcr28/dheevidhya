import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Login, PasswordChangeDTO } from '../model/auth';
import { addToken } from '../store/user-profile/user-profile.actions';
import { UserProfileState } from '../store/user-profile/user-profile.reducer';

type JwtToken = {
    token: string;
};

@Injectable({ providedIn: 'root' })
export class AuthServerProvider {
    private readonly http = inject(HttpClient);
    private store = inject(Store<{ userProfile: UserProfileState }>);

    login(credentials: Login): Observable<void> {
        return this.http.post<JwtToken>(environment.ServerUrl + environment.UAA_BASE_URL + 'login', credentials).pipe(map((response) => this.authenticateSuccess(response, credentials.rememberMe)));
    }

    logout(): Observable<void> {
        return new Observable((observer) => {
            observer.complete();
        });
    }

    private authenticateSuccess(response: JwtToken, rememberMe: boolean): void {
        // const user: UserProfile = this.parseUserFromToken(response.token); // Extract user info from token
        this.store.dispatch(addToken({ token: response.token }));
    }

    changePassword(passwordChangeDTO: PasswordChangeDTO): Observable<any> {
        return this.http.post(environment.ServerUrl + environment.UAA_BASE_URL + `change-password`, passwordChangeDTO);
    }

    save(token: string, newPassword: string): Observable<{}> {
        return this.http.post(environment.ServerUrl + environment.UAA_BASE_URL + `reset-password`, { token, newPassword });
    }
}
