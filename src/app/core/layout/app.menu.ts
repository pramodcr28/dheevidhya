import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonService } from '../services/common.service';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `
        <ul class="layout-menu">
            <ng-container *ngFor="let item of commonService.menuModel(); let i = index">
                <li app-menuitem *ngIf="item.visible !== false" [item]="item" [index]="i" [root]="true"></li>
            </ng-container>
        </ul>
    `
})
export class AppMenu {
    protected commonService = inject(CommonService);
}
