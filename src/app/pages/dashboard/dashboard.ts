import { Component, inject } from '@angular/core';
import { getBranch } from '../../core/store/user-profile/user-profile.selectors';
import { Store } from '@ngrx/store';
import { UserProfileState } from '../../core/store/user-profile/user-profile.reducer';

@Component({
    selector: 'app-dashboard',
    imports: [],
    template: `
        <div class="grid grid-cols-12 gap-8 items-center justify-center h-full">
           <span>   Dheevidhya</span>
            <!-- <app-stats-widget class="contents" />
            <div class="col-span-12 xl:col-span-6">
                <app-recent-sales-widget />
                <app-best-selling-widget />
            </div>
            <div class="col-span-12 xl:col-span-6">
                <app-revenue-stream-widget />
                <app-notifications-widget />
            </div> -->
        </div>
    `
})
export class Dashboard {

      private store = inject(Store<{ userProfile: UserProfileState }>);
    
    constructor(){
        this.store.select(getBranch).subscribe(result=>{
          console.log( result);
        })
     
    }
}
