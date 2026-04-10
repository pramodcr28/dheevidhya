import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { MenuItem, MessageService } from 'primeng/api';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IDepartmentConfig, Section } from '../../pages/models/org.model';
import { IBranch } from '../../pages/models/tenant.model';
import { IProfileConfig } from '../../pages/models/user.model';
import { UserProfileState } from '../store/user-profile/user-profile.reducer';
import { getAllSectionEntities, getAssociatedDepartments, getAuthorities, getBranch, getSubjectsByFilters, selectUserConfig } from '../store/user-profile/user-profile.selectors';
import { getUserAssociatedSubjects } from './../store/user-profile/user-profile.selectors';
import { ApplicationConfigService } from './application-config.service';

export type EntityResponseType = HttpResponse<IProfileConfig>;

@Injectable({
    providedIn: 'root'
})
export class CommonService {
    dateTimeFormate = "yyyy-MM-dd'T'HH:mm:ss.SSS";
    dateFormate = 'yyyy-MM-dd';
    TimeFormate = 'HH:mm:ss.SSS';
    displayDateTimeFormate = 'dd MMMM yyyy, hh:mm a';

    themeGradients: string[] = [
        'linear-gradient(180deg, #2196F3, #64B5F6)',
        'linear-gradient(135deg, #4CAF50, #81C784)',
        'linear-gradient(135deg, #FF9800, #FFB74D)',
        'linear-gradient(135deg, #F44336, #EF9A9A)',
        'linear-gradient(135deg, #9C27B0, #BA68C8)',
        'linear-gradient(135deg, #00BCD4, #4DD0E1)',
        'linear-gradient(135deg, #FFC107, #FFD54F)',
        'linear-gradient(135deg, #E91E63, #F06292)',
        'linear-gradient(135deg, #8BC34A, #AED581)',
        'linear-gradient(135deg, #3F51B5, #7986CB)',
        'linear-gradient(135deg, #607D8B, #90A4AE)'
    ];

    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);
    private store = inject(Store<{ userProfile: UserProfileState }>);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ADMIN_BASE_URL + 'profile-configs');

    branch: IBranch | null = null;
    associatedDepartments: IDepartmentConfig[] = [];
    associatedSections: Section[] = [];
    associatedSubjects: any[] = [];
    currentUser: any = null;
    userAssociatedSubjects: any[] = [];
    getStudentInfo = null;
    getUserInfo = null;
    getUserAuthorities: string[] = [];
    isStudent: boolean = true;
    messageService = inject(MessageService);

    menuModel = signal<MenuItem[]>([]);

    constructor() {
        this.store.select(getBranch).subscribe((res) => {
            this.branch = res;
        });

        this.store.select(getAssociatedDepartments).subscribe((res) => {
            this.associatedDepartments =
                res?.map((department: any) => ({
                    ...department,
                    name: department.department?.name
                })) ?? [];
        });

        this.store.select(getAllSectionEntities).subscribe((res) => {
            this.associatedSections = res ?? [];
        });

        this.store.select(getSubjectsByFilters([])).subscribe((res) => {
            this.associatedSubjects = res ?? [];
        });

        this.store.select(selectUserConfig).subscribe((res) => {
            this.currentUser = res;
        });

        this.store.select(getAuthorities).subscribe((res) => {
            this.getUserAuthorities = res ?? [];
            this.isStudent = this.getUserAuthorities?.includes('STUDENT');
            this.buildMenuModel();
        });

        this.store.select(getUserAssociatedSubjects).subscribe((res) => {
            this.userAssociatedSubjects = res ?? [];
        });
    }

    private hasRoles(roles: string[]): boolean {
        return roles.some((r) => this.getUserAuthorities.includes(r));
    }

    private buildMenuModel(): void {
        this.menuModel.set([
            {
                label: 'Home',
                visible: true,
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/home'],
                        visible: true
                    },

                    {
                        label: 'Contact leads',
                        icon: 'pi pi-fw pi-address-book',
                        routerLink: ['/home/contact-leads'],
                        visible: this.hasRoles(['SUPER_ADMIN'])
                    },

                    // {
                    //     label: 'Sats Students',
                    //     icon: 'pi pi-fw pi-users',
                    //     routerLink: ['/stats-student-list'],
                    //     visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER'])
                    // },
                    {
                        label: 'Students',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/home/stats-student-list'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER'])
                    },
                    {
                        label: 'Bulk Student Upload',
                        icon: 'pi pi-fw pi-upload',
                        routerLink: ['/home/bulk-student-upload'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER'])
                    },
                    {
                        label: 'Staff',
                        icon: 'pi pi-fw pi-graduation-cap',
                        routerLink: ['/home/employees'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR'])
                    },
                    {
                        label: 'Calendar',
                        icon: 'pi pi-fw pi-calendar',
                        routerLink: ['/home/staff-calendar'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER', 'STUDENT'])
                    },
                    {
                        label: 'Staff Attendence',
                        icon: 'pi pi-fw pi-calendar-times',
                        routerLink: ['/home/attendance-management'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR'])
                    }
                ]
            },
            {
                label: 'Tenant Management',
                icon: 'pi pi-fw pi-home',
                routerLink: ['/home/tenant'],
                visible: this.hasRoles(['SUPER_ADMIN']),
                items: [
                    {
                        label: 'Tenant Setup',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/home/tenant/list'],
                        visible: true
                    },
                    {
                        label: 'Staff',
                        icon: 'pi pi-fw pi-graduation-cap',
                        routerLink: ['/home/employees'],
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
                        routerLink: ['/home/time-table-list'],
                        visible: true
                    },
                    {
                        label: 'Student Attendence',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/home/student-attendence'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER'])
                    },
                    {
                        label: 'Attendence',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/home/attendence'],
                        visible: this.hasRoles(['STUDENT'])
                    },
                    {
                        label: 'Examination',
                        icon: 'pi pi-fw pi-verified',
                        routerLink: ['/home/examination'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER', 'STUDENT'])
                    },
                    {
                        label: 'Assignment',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/home/assignment'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'LECTURER', 'TEACHER', 'STUDENT'])
                    },
                    {
                        label: 'Notification',
                        icon: 'pi pi-fw pi-bell',
                        routerLink: ['/home/notice-board'],
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
                        routerLink: ['/home/departments'],
                        visible: this.hasRoles(['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR'])
                    },
                    {
                        label: 'Org Tree',
                        icon: 'pi pi-fw pi-sitemap',
                        routerLink: ['/home/org'],
                        visible: this.hasRoles(['LECTURER', 'TEACHER', 'HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR', 'STUDENT'])
                    },
                    // NEW: Student Promotion Menu Item
                    {
                        label: 'Student Promotion',
                        icon: 'pi pi-fw pi-arrow-up',
                        routerLink: ['/home/student-promotion'],
                        visible: this.hasRoles(['LECTURER', 'TEACHER', 'HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR'])
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
                        routerLink: ['/home/inventory/categories'],
                        visible: true
                    },
                    {
                        label: 'Items',
                        icon: 'pi pi-fw pi-box',
                        routerLink: ['/home/inventory/assets'],
                        visible: true
                    }
                ]
            }
        ]);
    }

    findProfileConfig(id: number): Observable<EntityResponseType> {
        return this.http.get<IProfileConfig>(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    post<T>(url: string, body: any): Observable<T> {
        return this.http.post<T>(url, body);
    }

    formatDateTimeForApi(value: Date | string | null | undefined): string | null {
        if (!value) return null;

        let date: Date;

        if (value instanceof Date) {
            date = value;
        } else if (typeof value === 'string') {
            date = new Date(value);
        } else {
            return null;
        }

        if (isNaN(date.getTime())) {
            console.warn('Invalid datetime:', value);
            return null;
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    formatTimeForApi(value: Date | string | null | undefined): string | null {
        if (!value) return null;

        let date: Date;

        if (value instanceof Date) {
            date = value;
        } else if (typeof value === 'string') {
            date = new Date(value);
        } else {
            return null;
        }

        if (isNaN(date.getTime())) {
            console.warn('Invalid time:', value);
            return null;
        }

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${hours}:${minutes}`;
    }

    convertTimeStringToDate(time: string): Date {
        if (!time) return null as any;

        const [hours, minutes, seconds] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, seconds || 0, 0);
        return date;
    }

    formatDateForApi(value: Date | string | null | undefined): string | null {
        if (!value) {
            return null;
        }

        let date: Date;

        if (value instanceof Date) {
            date = value;
        } else if (typeof value === 'string') {
            date = new Date(value);
        } else {
            return null;
        }

        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', value);
            return null;
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
