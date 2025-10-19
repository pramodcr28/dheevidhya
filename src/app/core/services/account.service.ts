import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
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
    // private readonly userIdentity = signal<Account | null>(null);
    // private readonly authenticationState = new ReplaySubject<Account | null>(1);
    private accountCache$?: Observable<Account> | null;

    private readonly http = inject(HttpClient);
    // private readonly stateStorageService = inject(StateStorageService);
    private readonly router = inject(Router);
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

    //  identity(force?: boolean): Observable<Account | null> {
    //   const token = this.stateStorageService.getAuthenticationToken();
    //   const claims = this.getAccountClaims(token);
    //   console.log(claims);
    //   let account : Account | null = null;
    //   if(claims){
    //   account = {...claims,login: claims?.username,langKey:'en'} as Account;
    //   }

    //   return of(account);
    // }

    identity(): Observable<Account | null> {
        return this.store
            .select((state) => {
                return state?.userProfile?.token;
            })
            .pipe(
                map((token) => {
                    const claims = this.getAccountClaims(token);
                    console.log(claims);

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

    // isAuthenticated(): boolean {
    //   return this.userIdentity() !== null;
    // }

    // getAuthenticationState(): Observable<Account | null> {
    //   return this.authenticationState.asObservable();
    // }

    // identity(force?: boolean): Observable<Account | null> {
    //   if (!this.accountCache$ || force) {
    //     this.accountCache$ = this.fetch().pipe(
    //       map((account: any) => {
    //         this.http.get<any>(this.applicationConfigService.getEndpointFor( environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/config/'+ account.id)).subscribe(result=>{
    //           let branch = null;
    //           for(let department of result.departments){
    //             branch = JSON.parse(JSON.stringify(department.branch));
    //             delete department.branch;
    //           }
    //           this.store.dispatch(addBranch({branch:branch}));
    //           this.store.dispatch(loadUserProfile({ userConfig: result }));
    //         })
    //           return account;
    //       }),
    //       shareReplay(),
    //     );
    //   }

    //   return this.accountCache$.pipe(catchError(() => of(null)));
    // }

    private fetch(): Observable<Account> {
        return this.http.get<Account>(this.applicationConfigService.getEndpointFor(environment.ServerUrl + 'api/account'));
    }
}
