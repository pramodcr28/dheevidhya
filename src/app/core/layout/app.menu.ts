import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { CommonService } from '../services/common.service';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `
        <ul class="layout-menu">
            <ng-container *ngFor="let item of model; let i = index">
                <li app-menuitem *ngIf="!item.separator && item.visible !== false" [item]="item" [index]="i" [root]="true"></li>

                <li *ngIf="item.separator" class="menu-separator"></li>
            </ng-container>
        </ul>
    `
})
export class AppMenu {
    model: MenuItem[] = [];
    commonService = inject(CommonService);
    private authorities: string[] = [];

    ngOnInit() {
        this.authorities = this.commonService.getUserAuthorities;
        this.buildMenu();
    }

    private hasRoles(roles: string[], mode: 'ANY' | 'ALL' = 'ANY'): boolean {
        if (!roles || roles.length === 0) return true;

        if (mode === 'ALL') {
            return roles.every((role) => this.authorities.includes(role));
        }

        return roles.some((role) => this.authorities.includes(role));
    }

    private buildMenu() {
        this.model = [
            {
                label: 'Home',
                visible: true,
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/'],
                        visible: true
                    },
                    {
                        label: 'Students',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/students'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER'])
                    },
                    {
                        label: 'Bulk Student Upload',
                        icon: 'pi pi-fw pi-upload',
                        routerLink: ['/bulk-student-upload'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER'])
                    },
                    {
                        label: 'Staff',
                        icon: 'pi pi-fw pi-graduation-cap',
                        routerLink: ['/employees'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR'])
                    },
                    {
                        label: 'Calendar',
                        icon: 'pi pi-fw pi-calendar',
                        routerLink: ['/staff-calendar'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER', 'STUDENT'])
                    },
                    {
                        label: 'Staff Attendence',
                        icon: 'pi pi-fw pi-calendar-times',
                        routerLink: ['/attendance-management'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR'])
                    }
                ]
            },
            {
                label: 'Tenant Management',
                icon: 'pi pi-fw pi-home',
                routerLink: ['/tenant'],
                visible: this.hasRoles(['SUPER_ADMIN']),
                items: [
                    {
                        label: 'Tenant Setup',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/tenant/list'],
                        visible: true
                    },
                    {
                        label: 'Staff',
                        icon: 'pi pi-fw pi-graduation-cap',
                        routerLink: ['/employees'],
                        visible: true
                    }
                ]
            },
            {
                label: 'Academics',
                visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER', 'STUDENT']),
                items: [
                    {
                        label: 'Time Table',
                        icon: 'pi pi-fw pi-table',
                        routerLink: ['/time-table-list'],
                        visible: true
                    },
                    {
                        label: 'Student Attendence',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/student-attendence'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER'])
                    },
                    {
                        label: 'Examination',
                        icon: 'pi pi-fw pi-verified',
                        routerLink: ['/examination'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER', 'STUDENT'])
                    },
                    {
                        label: 'Assignment',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/assignment'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER', 'STUDENT'])
                    },
                    {
                        label: 'Notification',
                        icon: 'pi pi-fw pi-bell',
                        routerLink: ['/notice-board'],
                        visible: true
                    }
                ]
            },

            {
                label: 'Organization',
                visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER', 'STUDENT']),
                items: [
                    {
                        label: 'Department Setup',
                        icon: 'pi pi-fw pi-building-columns',
                        routerLink: ['/departments'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR'])
                    },
                    {
                        label: 'Org Tree',
                        icon: 'pi pi-fw pi-sitemap',
                        routerLink: ['/org'],
                        visible: this.hasRoles(['LECTURER', 'TEACHER', 'HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'STUDENT'])
                    }
                ]
            },
            {
                label: 'Inventory',
                visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR']),
                items: [
                    {
                        label: 'Categories',
                        icon: 'pi pi-fw pi-tags',
                        routerLink: ['/inventory/categories'],
                        visible: true
                    },
                    {
                        label: 'Items',
                        icon: 'pi pi-fw pi-box',
                        routerLink: ['/inventory/assets'],
                        visible: true
                    }
                ]
            }
        ];
    }
}
