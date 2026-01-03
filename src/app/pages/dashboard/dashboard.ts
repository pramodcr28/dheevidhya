import { Component } from '@angular/core';

@Component({
    selector: 'app-dashboard',
    imports: [],
    template: `
        <div class="grid grid-cols-12 gap-8 items-center justify-center h-full">
            <span> Dheevidhya</span>
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
    constructor() {}
}
