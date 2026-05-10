import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { filter, map, shareReplay, switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ContactLead, SwitchAcademicYearDTO } from '../model/account.model';
import { Account } from '../model/auth';
import { addAuthorities, loadUserProfile } from '../store/user-profile/user-profile.actions';
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
            .select((state) => state?.userProfile?.token)
            .pipe(
                filter((token): token is string => !!token),
                take(1),
                switchMap((token) => {
                    const claims = this.getAccountClaims(token);

                    if (!claims) {
                        return of(null);
                    }

                    return this.http.get<any>(this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.UAA_BASE_URL + 'config')).pipe(
                        map((result) => {
                            let branch = null;

                            for (let department of result.departments) {
                                branch = JSON.parse(JSON.stringify(department.branch));
                                delete department.branch;
                            }

                            this.store.dispatch(loadUserProfile({ userConfig: result }));

                            this.store.dispatch(
                                addAuthorities({
                                    authorities: claims.authorities || []
                                })
                            );

                            return {
                                ...claims,
                                login: claims.username,
                                langKey: 'en'
                            } as Account;
                        })
                    );
                }),

                shareReplay(1)
            );
    }
    // identity(): Observable<Account | null> {
    //     return this.store
    //         .select((state) => {
    //             return state?.userProfile?.token;
    //         })
    //         .pipe(
    //             map((token) => {
    //                 const claims = this.getAccountClaims(token);

    //                 if (claims) {
    //                     this.http.get<any>(this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.UAA_BASE_URL + 'config')).subscribe((result) => {
    //                         let branch = null;
    //                         for (let department of result.departments) {
    //                             branch = JSON.parse(JSON.stringify(department.branch));
    //                             delete department.branch;
    //                         }
    //                         // this.store.dispatch(addBranch({ branch: branch }));
    //                         this.store.dispatch(loadUserProfile({ userConfig: result }));
    //                         this.store.dispatch(addAuthorities({ authorities: claims.authorities || [] }));
    //                     });
    //                     return {
    //                         ...claims,
    //                         login: claims.username,
    //                         langKey: 'en'
    //                     } as Account;
    //                 }
    //                 return null;
    //             }),
    //             shareReplay()
    //         );
    // }
    getAcademicYears(): Observable<string[]> {
        return this.http.get<string[]>(this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.UAA_BASE_URL + 'config/academic-years'));
    }

    switchAcademicYear(academicYear: string): Observable<SwitchAcademicYearDTO> {
        return this.http.post<SwitchAcademicYearDTO>(this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.UAA_BASE_URL + `config/switch/${academicYear}`), {});
    }

    // add here to api connection to save log

    saveContactLead(data: ContactLead): Observable<any> {
        return this.http.post(this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.UAA_BASE_URL + 'public/contact'), data);
    }

    getContactLeads(): Observable<ContactLead[]> {
        return this.http.get<ContactLead[]>(this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.UAA_BASE_URL + 'public/contact'));
    }
}
