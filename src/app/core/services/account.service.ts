import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { Account } from '../model/auth';
import { ApplicationConfigService } from './application-config.service';
import { environment } from '../../../environments/environment';
import { loadUserProfile } from '../store/user-profile/user-profile.actions';
import { UserProfileState } from '../store/user-profile/user-profile.reducer';
import { Store } from '@ngrx/store';


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

  identity(force?: boolean): Observable<Account | null> {
    if (!this.accountCache$ || force) {
      this.accountCache$ = this.fetch().pipe(
        map((account: any) => {
          this.http.get<any>(this.applicationConfigService.getEndpointFor( environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/config/'+ account.id)).subscribe(result=>{
              this.store.dispatch(loadUserProfile({ userConfig: result }));
          })
            return account;
        }),
        shareReplay(),
      );
    }
  
    return this.accountCache$.pipe(catchError(() => of(null)));
  }

  private fetch(): Observable<Account> {
    return this.http.get<Account>(this.applicationConfigService.getEndpointFor( environment.ServerUrl + 'api/account'));
  }
}
