import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { Column, ExportColumn } from '../../../core/model/table.model';
import { CommonService } from '../../../core/services/common.service';
import { DheeConfirmationService } from '../../../core/services/dhee-confirmation.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { MasterDepartmentService } from '../../../core/services/master-department.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { SortService } from '../../../shared/sort';
import { IProfileConfig, ITenantAuthority, ITenantUser, NewTenantUser } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantAuthorityService } from '../../service/tenant-authority.service';
import { UserService } from '../../service/user.service';
import { EmployeeDialogComponent } from './../employee-dialog/employee-dialog.component';

@Component({
    selector: 'app-employee-list',
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        EmployeeDialogComponent,
        MultiSelectModule,
        ConfirmationDialogComponent
    ],
    templateUrl: './employee-list.component.html',
    styles: ``,
    providers: [MessageService, DheeConfirmationService]
})
export class EmployeeListComponent {
    studentDialog = false;
    employee!: NewTenantUser | ITenantUser;
    submitted = false;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    tenantAuthorities = signal<ITenantAuthority[]>([]);
    isLoading = false;
    employees = signal<ITenantUser[]>([]);
    selectedDepartment: any = null;
    selectedRoles: string[] = [];
    router = inject(Router);
    employeeService = inject(UserService);
    profileService = inject(ProfileConfigService);
    authorityService = inject(TenantAuthorityService);
    activatedRoute = inject(ActivatedRoute);
    sortService = inject(SortService);
    messageService = inject(MessageService);
    confirmationService = inject(DheeConfirmationService);
    loader = inject(ApiLoaderService);
    commonService = inject(CommonService);
    page = 0;
    itemsPerPage = 10;
    totalItems = 0;
    sortField = 'lastModifiedDate';
    sortOrder: 'ASC' | 'DESC' = 'DESC';
    availableAuthorities: any[] = [];
    roleOptions: any[] = [];
    masterDepartments: any[] = [];
    masterDepartmentService = inject(MasterDepartmentService);

    ngOnInit(): void {
        this.employeeService.getAuthorities().subscribe((res: any) => {
            this.availableAuthorities = res.body;
            this.roleOptions = this.availableAuthorities
                .map((auth: any) => ({
                    label: auth.name || auth,
                    value: auth.name || auth
                }))
                ?.filter((auth: any) => auth.value !== 'STUDENT' && auth.value !== 'IT_ADMINISTRATOR' && auth.value !== 'SUPER_ADMIN' && auth.value !== 'GUARDIAN');
        });
        this.load();

        this.masterDepartmentService.query().subscribe(
            (data) => {
                this.masterDepartments = data.body || [];
            },
            (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch departments'
                });
            }
        );
    }

    avatarBg(index: number): string {
        const colors = ['bg-amber-100', 'bg-emerald-100', 'bg-sky-100', 'bg-rose-100', 'bg-indigo-100', 'bg-purple-100', 'bg-teal-100', 'bg-orange-100'];
        return colors[index % colors.length];
    }

    avatarText(index: number): string {
        const colors = ['text-amber-800', 'text-emerald-800', 'text-sky-800', 'text-rose-800', 'text-indigo-800', 'text-purple-800', 'text-teal-800', 'text-orange-800'];
        return colors[index % colors.length];
    }

    load(resetPage = false): void {
        if (resetPage) {
            this.page = 0;
        }
        this.loader.show('Fetching Staff Data');

        const filterParams: Record<string, any> = {};

        if (this.commonService.getUserAuthorities?.includes('SUPER_ADMIN')) {
            filterParams['authorities.name.equals'] = 'IT_ADMINISTRATOR';
        } else {
            filterParams['branch_id.eq'] = this.commonService.branch?.id;
            filterParams['authorities.name.nin'] = ['IT_ADMINISTRATOR', 'STUDENT'];
        }

        if (this.selectedDepartment?.id) {
            filterParams['department.id'] = this.selectedDepartment.id;
        }

        if (this.selectedRoles && this.selectedRoles.length > 0) {
            filterParams['authorities.name.in'] = this.selectedRoles;
        }

        this.employeeService.userSearch(this.page, this.itemsPerPage, this.sortField, this.sortOrder, filterParams).subscribe({
            next: (res: any) => {
                this.employees.set(res.content ?? []);
                this.totalItems = res.totalElements ?? 0;
                this.loader.hide();
            },
            error: () => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load staff data'
                });
            }
        });
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        this.itemsPerPage = event.rows ?? this.itemsPerPage;
        this.page = Math.floor((event.first ?? 0) / this.itemsPerPage);

        if (event.sortField) {
            this.sortField = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
            this.sortOrder = event.sortOrder === 1 ? 'ASC' : 'DESC';
        }

        this.load();
    }

    onSort(event: any): void {
        this.sortField = event.field || 'id';
        this.sortOrder = event.order === 1 ? 'ASC' : 'DESC';
    }

    openNew() {
        this.employee = {
            authorities: [],
            activated: true,
            imageUrl: '',
            email: '',
            firstName: '',
            lastName: '',
            login: ''
        } as NewTenantUser;
        this.submitted = false;
        this.studentDialog = true;
    }

    hideDialog() {
        this.studentDialog = false;
        this.submitted = false;
        this.loader.hide();
    }

    onEmployeeSave(data: { user: NewTenantUser | ITenantUser; latestAcademicYear: IProfileConfig }) {
        this.submitted = true;

        if (!data.latestAcademicYear) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Profile configuration is required'
            });
            return;
        }

        this.loader.show('Saving Staff Data');

        if (data.latestAcademicYear.roles) {
            for (const role in data.latestAcademicYear.roles) {
                if (data.latestAcademicYear.roles[role] == null) delete data.latestAcademicYear.roles[role];
            }
        }
        data.latestAcademicYear.profileType = 'STAFF';

        this.employeeService.create({ user: data.user, latestAcademicYear: data.latestAcademicYear }).subscribe((res: any) => {
            if (res && res.body.status === 200) {
                this.hideDialog();
                this.load(true);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Employee profile saved successfully'
                });
            } else {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: res.body.error || 'Error',
                    detail: res.body.message || 'Failed to save employee data'
                });
            }
        });
    }

    onUserSave(user: NewTenantUser | ITenantUser) {
        this.submitted = true;

        if (!user.id) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Cannot save user without ID. Please create user with profile first.'
            });
            return;
        }

        this.loader.show('Updating User Information');

        this.employeeService.create({ user, profile: null }).subscribe((res: any) => {
            if (res && res.body.status === 200) {
                this.hideDialog();
                this.load(true);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Employee profile saved successfully'
                });
            } else {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: res.body.error || 'Error',
                    detail: res.body.message || 'Failed to save employee data'
                });
            }
        });
    }

    deleteEmployee(employee: ITenantUser) {
        this.confirmationService.confirm({
            message: `Are you sure you want to exit ${employee.firstName} ${employee.lastName}?`,
            header: 'Exit Confirmation',
            icon: 'pi pi-question-circle',
            accept: () => {
                this.loader.show('Exiting Staff');
                this.employeeService.delete(+employee.id!, null).subscribe({
                    next: () => {
                        this.load(true);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Staff exited successfully'
                        });
                    },
                    error: () => {
                        this.loader.hide();
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to exit staff'
                        });
                    }
                });
            }
        });
    }

    getAuthorityNames(authorities: any): string {
        return authorities?.map((a: any) => a.name).join(', ') || 'N/A';
    }

    editEmployee(employee: ITenantUser) {
        this.studentDialog = true;
        this.employee = { ...employee };
    }

    clearFilters() {
        this.selectedDepartment = null;
        this.selectedRoles = [];
        this.load(true);
    }
}
