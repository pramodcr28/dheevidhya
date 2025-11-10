import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
// import { CategoryManagementComponent } from '../../pages/inventory-management/category-management/category-management.component';
// import { AssetsManagementComponent } from '../../pages/inventory-management/inventory-management.component';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
                    { label: 'Students', icon: 'pi pi-fw pi-users', routerLink: ['/students'] },
                    { label: 'bulk student upload', icon: 'pi pi-fw pi-upload', routerLink: ['/bulk-student-upload'] },
                    { label: 'Staff', icon: 'pi pi-fw pi-graduation-cap', routerLink: ['/employees'] },
                    { label: 'Calendar', icon: 'pi pi-fw pi-calendar', routerLink: ['/staff-calendar'] },
                    { label: 'Attendance Management', icon: 'pi pi-fw pi-calendar-times', routerLink: ['/attendance-management'] }
                ]
            },
            {
                label: 'Academics',
                items: [
                    { label: 'Time Table', icon: 'pi pi-fw pi-table', routerLink: ['/time-table-list'] },
                    { label: 'Student Attendence', icon: 'pi pi-fw pi-home', routerLink: ['/student-attendence'] },
                    { label: 'Examination', icon: 'pi pi-fw pi-verified', routerLink: ['/examination'] },
                    { label: 'Assignment', icon: 'pi pi-fw pi-book', routerLink: ['/assignment'] },
                    { label: 'Notification', icon: 'pi pi-fw pi-bell', routerLink: ['/notice-board'] }
                ]
            },
            {
                label: 'Organization',
                items: [
                    { label: 'Department Setup', icon: 'pi pi-fw pi-building-columns', routerLink: ['/department-setup'] },
                    { label: 'Org Tree', icon: 'pi pi-fw pi-sitemap', routerLink: ['/org'] }
                ]
            },
            {
                label: 'Inventory',
                items: [
                    {
                        label: 'Categories',
                        icon: 'pi pi-fw pi-tags',
                        routerLink: ['/inventory/categories']
                    },
                    {
                        label: 'Items',
                        icon: 'pi pi-fw pi-box',
                        routerLink: ['/inventory/assets']
                    }
                ]
            }
        ];
    }
}
