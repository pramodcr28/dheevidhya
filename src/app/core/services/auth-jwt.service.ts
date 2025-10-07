import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Login, PasswordChangeDTO } from '../model/auth';
import { environment } from '../../../environments/environment';
import { Store } from '@ngrx/store';
import { UserProfileState } from '../store/user-profile/user-profile.reducer';
import { addToken } from '../store/user-profile/user-profile.actions';


type JwtToken = {
  token: string;
};

@Injectable({ providedIn: 'root' })
export class AuthServerProvider {
  private readonly http = inject(HttpClient);
  private store = inject(Store<{ userProfile: UserProfileState }>);

  login(credentials: Login): Observable<void> {
    return this.http
      .post<JwtToken>(environment.ServerUrl + 'uaa/login', credentials)
      .pipe(map(response => this.authenticateSuccess(response, credentials.rememberMe)));
  }

  logout(): Observable<void> {
    return new Observable(observer => {
      observer.complete();
    });
  }

  private authenticateSuccess(response: JwtToken, rememberMe: boolean): void {
    // const user: UserProfile = this.parseUserFromToken(response.token); // Extract user info from token

    this.store.dispatch(addToken({ token: response.token }));
  }

  changePassword(passwordChangeDTO: PasswordChangeDTO): Observable<any> {
    return this.http.post(`${environment.ServerUrl}api/account/change-password`, passwordChangeDTO);
  }

  save(key: string, newPassword: string): Observable<{}> {
    return this.http.post(`${environment.ServerUrl}api/account/reset-password/finish`, { key, newPassword });
  }
  
}
