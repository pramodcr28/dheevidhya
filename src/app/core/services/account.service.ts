import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Account } from '../model/auth';
import { addBranch, loadUserProfile } from '../store/user-profile/user-profile.actions';
import { UserProfileState } from '../store/user-profile/user-profile.reducer';
import { ApplicationConfigService } from './application-config.service';

@Injectable({ providedIn: 'root' })
export class AccountService {
    private readonly http = inject(HttpClient);
    private readonly applicationConfigService = inject(ApplicationConfigService);
    private store = inject(Store<{ userProfile: UserProfileState }>);

    save(account: Account): Observable<{}> {
        return this.http.post(this.applicationConfigService.getEndpointFor('api/account'), account);
    }

    getAccountClaims(token: string | null): any {
        if (!token) return null;
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    }

    identity(): Observable<Account | null> {
        return this.store
            .select((state) => {
                return state?.userProfile?.token;
            })
            .pipe(
                map((token) => {
                    const claims = this.getAccountClaims(token);

                    if (claims) {
                        this.http.get<any>(this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.UAA_BASE_URL + 'api/config/' + claims.id)).subscribe((result) => {
                            let branch = null;
                            for (let department of result.departments) {
                                branch = JSON.parse(JSON.stringify(department.branch));
                                delete department.branch;
                            }
                            this.store.dispatch(addBranch({ branch: branch }));
                            this.store.dispatch(loadUserProfile({ userConfig: result }));
                        });
                        return {
                            ...claims,
                            login: claims.username,
                            langKey: 'en'
                        } as Account;
                    }
                    return null;
                }),
                shareReplay()
            );
    }

    private fetch(): Observable<Account> {
        return this.http.get<Account>(this.applicationConfigService.getEndpointFor(environment.ServerUrl + 'api/account'));
    }
}
