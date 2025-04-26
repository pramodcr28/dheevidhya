import { Injectable, Signal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, of } from 'rxjs';
import { catchError, concatMap, map, shareReplay, tap } from 'rxjs/operators';
import { Account } from '../model/auth';
import { ApplicationConfigService } from './application-config.service';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class AccountService {
  // private readonly userIdentity = signal<Account | null>(null);
  // private readonly authenticationState = new ReplaySubject<Account | null>(1);
  private accountCache$?: Observable<Account> | null;

  private readonly http = inject(HttpClient);
  // private readonly stateStorageService = inject(StateStorageService);
  private readonly router = inject(Router);
  private readonly applicationConfigService = inject(ApplicationConfigService);

  save(account: Account): Observable<{}> {
    return this.http.post(this.applicationConfigService.getEndpointFor('api/account'), account);
  }

  // authenticate(identity: Account | null): void {
  //   this.userIdentity.set(identity);
  //   this.authenticationState.next(this.userIdentity());
  //   if (!identity) {
  //     this.accountCache$ = null;
  //   }
  // }

  // trackCurrentAccount(): Signal<Account | null> {
  //   return this.userIdentity.asReadonly();
  // }

  // hasAnyAuthority(authorities: string[] | string): boolean {
  //   const userIdentity = this.userIdentity();
  //   if (!userIdentity) {
  //     return false;
  //   }
  //   if (!Array.isArray(authorities)) {
  //     authorities = [authorities];
  //   }
  //   return userIdentity.authorities.some((authority: string) => authorities.includes(authority));
  // }

  identity(force?: boolean): Observable<Account | null> {
    if (!this.accountCache$ || force) {
      this.accountCache$ = this.fetch().pipe(
        map((account: any) => {
          console.log('First API account:', account.id);
  
          // Call second API here
          // return this.fetchOtherDetails(account.id).pipe(
          //   map(otherDetails => {
          //     // You can combine `account` + `otherDetails` if needed
              return account;
          //   })
          // );
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
