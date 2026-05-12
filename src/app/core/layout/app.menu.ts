
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonService } from '../services/common.service';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [AppMenuitem, RouterModule],
    template: `
        <ul class="layout-menu">
          @for (item of commonService.menuModel(); track item; let i = $index) {
            @if (item.visible !== false) {
              <li app-menuitem [item]="item" [index]="i" [root]="true"></li>
            }
          }
        </ul>
        `
})
export class AppMenu {
    protected commonService = inject(CommonService);
}
