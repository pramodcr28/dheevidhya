import { Component, ElementRef, inject } from '@angular/core';
import { CommonService } from '../services/common.service';
import { AppMenu } from './app.menu';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [AppMenu],
    template: ` <div class="layout-sidebar">
        <app-menu></app-menu>
    </div>`
})
export class AppSidebar {
    commonService = inject(CommonService);
    constructor(public el: ElementRef) {}
}
