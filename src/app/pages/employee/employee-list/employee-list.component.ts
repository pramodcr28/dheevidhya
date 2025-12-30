import { CommonModule } from '@angular/common';
import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { Subscription } from 'rxjs';
import { ITEMS_PER_PAGE } from '../../../core/model/pagination.constants';
import { Column, ExportColumn } from '../../../core/model/table.model';
import { CommonService } from '../../../core/services/common.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { SortService } from '../../../shared/sort';
import { IProfileConfig, ITenantAuthority, ITenantUser, NewTenantUser } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantAuthorityService } from '../../service/tenant-authority.service';
import { UserService } from '../../service/user.service';
import { EmployeeDialogComponent } from './../employee-dialog/employee-dialog.component';

@Component({
    selector: 'app-employee-list',
    imports: [CommonModule, TableModule, FormsModule, ButtonModule, RippleModule, ToastModule, ToolbarModule, RatingModule, InputTextModule, DialogModule, TagModule, InputIconModule, IconFieldModule, ConfirmDialogModule, EmployeeDialogComponent],
    templateUrl: './employee-list.component.html',
    styles: ``,
    providers: [MessageService, ConfirmationService]
})
export class EmployeeListComponent {
    studentDialog: boolean = false;
    employee!: NewTenantUser | ITenantUser;
    submitted: boolean = false;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    subscription: Subscription | null = null;
    tenantAuthorities = signal<ITenantAuthority[]>([]);
    isLoading = false;
    employees = signal<ITenantUser[]>([]);
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 1;
    router = inject(Router);
    employeeService = inject(UserService);
    profileService = inject(ProfileConfigService);
    authorityService = inject(TenantAuthorityService);
    activatedRoute = inject(ActivatedRoute);
    sortService = inject(SortService);
    ngZone = inject(NgZone);
    messageService = inject(MessageService);
    confirmationService = inject(ConfirmationService);
    loader = inject(ApiLoaderService);
    commonService = inject(CommonService);

    ngOnInit() {
        this.authorityService.query().subscribe((result: any) => {
            this.tenantAuthorities.set(result.body);
        });
        this.load();
    }

    load(): void {
        this.loader.show('Fetching Staff Data');
        let filterParams = {};

        if (this.commonService.getUserAuthorities.includes('SUPER_ADMIN')) {
            filterParams = {
                'authorities.name.equals': 'IT_ADMINISTRATOR'
            };
        } else {
            filterParams = {
                'branch_id.eq': this.commonService.branch?.id,
                'authorities.name.nin': ['IT_ADMINISTRATOR', 'STUDENT']
            };
        }

        this.employeeService.userSearch(0, 100, 'id', 'ASC', filterParams).subscribe({
            next: (res: any) => {
                this.employees.set(res.content);
                this.loader.hide();
            },
            error: (error) => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load staff data'
                });
            }
        });
    }

    openNew() {
        this.employee = {
            authorities: [],
            isTenantUser: true,
            activated: true,
            imageUrl: '',
            email: '',
            firstName: '',
            lastName: '',
            login: '',
            passwordHash: 'User@123'
        } as NewTenantUser;

        this.submitted = false;
        this.studentDialog = true;
    }

    hideDialog() {
        this.studentDialog = false;
        this.submitted = false;
        this.loader.hide();
    }

    onEmployeeSave(data: { user: NewTenantUser | ITenantUser; profile: IProfileConfig }) {
        this.submitted = true;

        if (!data.profile) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Profile configuration is required'
            });
            return;
        }

        this.loader.show('Saving Staff Data');

        // Clean up profile roles
        if (data.profile.roles) {
            for (let role in data.profile.roles) {
                if (data.profile.roles[role] == null) {
                    delete data.profile.roles[role];
                }
            }
        }
        data.profile.profileType = 'STAFF';

        if (!data.user.id) {
            data.user.passwordHash = 'User@123';
        }

        const userConfig = {
            user: data.user,
            profile: data.profile
        };

        this.employeeService.create(userConfig).subscribe({
            next: (result) => {
                this.hideDialog();
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Staff profile saved successfully'
                });
            },
            error: (error) => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save staff data'
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

        // Send only user data (no profile)
        const userConfig = {
            user: user,
            profile: null
        };

        this.employeeService.create(userConfig).subscribe({
            next: (result) => {
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'User information updated successfully'
                });
                this.loader.hide();
            },
            error: (error) => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update user information'
                });
            }
        });
    }

    deleteEmployee(employee: ITenantUser) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.loader.show('Deleting Staff');
                this.employeeService.delete(+employee.id!, null).subscribe({
                    next: (res) => {
                        this.load();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Staff deleted successfully'
                        });
                    },
                    error: (error) => {
                        this.loader.hide();
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete staff'
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
}
