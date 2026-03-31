import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Login, PasswordChangeDTO } from '../model/auth';
import { ApiResponse } from '../model/common.model';
import { addBranch, addToken } from '../store/user-profile/user-profile.actions';
import { UserProfileState } from '../store/user-profile/user-profile.reducer';
import { BranchService } from './branch.service';

@Injectable({ providedIn: 'root' })
export class AuthServerProvider {
    private readonly http = inject(HttpClient);
    private store = inject(Store<{ userProfile: UserProfileState }>);
    branchService = inject(BranchService);
    authenticationError: string;
    getAccountClaims(token: string | null): any {
        if (!token) return null;
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    }

    login(credentials: Login): Observable<ApiResponse<string>> {
        return this.http.post<ApiResponse<string>>(environment.ServerUrl + environment.UAA_BASE_URL + 'login', credentials).pipe(map((response) => this.authenticateSuccess(response, credentials.rememberMe)));
    }

    logout(): Observable<void> {
        return new Observable((observer) => {
            observer.complete();
        });
    }

    private authenticateSuccess(response: ApiResponse<string>, rememberMe: boolean): ApiResponse<string> {
        this.store.dispatch(addToken({ token: response.data }));
        if (response.data) {
            const claims = this.getAccountClaims(response.data);

            this.branchService.find(+claims.branchId).subscribe((res) => {
                this.store.dispatch(addBranch({ branch: res.body }));
            });
        } else {
            this.authenticationError = response?.error;
        }

        return response;
    }

    changePassword(passwordChangeDTO: PasswordChangeDTO): Observable<any> {
        return this.http.post(environment.ServerUrl + environment.UAA_BASE_URL + `change-password`, passwordChangeDTO);
    }

    save(token: string, newPassword: string): Observable<{}> {
        return this.http.post(environment.ServerUrl + environment.UAA_BASE_URL + `reset-password`, {
            token,
            newPassword
        });
    }

    forgotPassword(usernameOrEmail: string): Observable<{}> {
        return this.http.post(environment.ServerUrl + environment.UAA_BASE_URL + `reset-password/init`, usernameOrEmail);
    }
}
