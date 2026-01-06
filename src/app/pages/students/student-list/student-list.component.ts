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
import { IProfileConfig, ITenantUser, NewTenantUser } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantAuthorityService } from '../../service/tenant-authority.service';
import { UserService } from '../../service/user.service';
import { GuardianDialogComponent } from '../guardian-dialog/guardian-dialog.component';
import { StudentDialogComponent } from '../student-dialog/student-dialog.component';

@Component({
    selector: 'app-student-list',
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
        GuardianDialogComponent,
        StudentDialogComponent
    ],
    templateUrl: './student-list.component.html',
    providers: [MessageService, ConfirmationService]
})
export class StudentListComponent {
    studentDialog: boolean = false;
    guardianDialog: boolean = false;
    student!: NewTenantUser | ITenantUser;
    selectedGaurdian!: NewTenantUser | ITenantUser;
    selectedGaurdianProfile!: IProfileConfig | any;
    selectedStudentProfile!: IProfileConfig | any;
    submitted: boolean = false;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    subscription: Subscription | null = null;
    tenantAuthorities = signal<[]>([]);
    isLoading = false;
    students = signal<any[] | null>([]);

    router = inject(Router);
    studentService = inject(UserService);
    profileService = inject(ProfileConfigService);
    authorityService = inject(TenantAuthorityService);
    activatedRoute = inject(ActivatedRoute);
    sortService = inject(SortService);
    ngZone = inject(NgZone);
    messageService = inject(MessageService);
    confirmationService = inject(ConfirmationService);
    loader = inject(ApiLoaderService);
    commonService = inject(CommonService);
    // pagination related code
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 0;
    sortField = 'id';
    sortOrder: 'ASC' | 'DESC' = 'ASC';
    // ----------------------------------
    ngOnInit() {
        this.authorityService.query().subscribe((result: any) => {
            this.tenantAuthorities.set(result.body);
        });
        this.load();
    }

    load(): void {
        this.loader.show('Fetching Student Data');
        this.studentService
            .userSearch(this.page, this.itemsPerPage, this.sortField, this.sortOrder, {
                'branch_id.eq': this.commonService.branch?.id,
                'authorities.name.in': ['STUDENT']
            })
            .subscribe({
                next: (res: any) => {
                    this.students.set(res.content);
                    this.totalItems = res.totalElements || 0;
                    this.loader.hide();
                },
                error: (error) => {
                    this.loader.hide();
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load student data'
                    });
                }
            });
    }

    onPageChange(event: any): void {
        this.itemsPerPage = event.rows;
        this.page = Math.floor(event.first / event.rows);
        this.load();
    }

    onSort(event: any): void {
        this.sortField = event.field || 'id';
        this.sortOrder = event.order === 1 ? 'ASC' : 'DESC';
        this.page = 0; // Reset to first page on sort
        this.load();
    }

    openNew() {
        this.student = {
            authorities: [this.tenantAuthorities().find((a: any) => a.name === 'STUDENT')],
            isTenantUser: true,
            activated: true,
            imageUrl: '',
            email: 'NA',
            firstName: '',
            lastName: '',
            login: '',
            passwordHash: 'User@123'
        } as NewTenantUser | any;

        this.submitted = false;
        this.studentDialog = true;
    }

    hideDialog() {
        this.studentDialog = false;
        this.submitted = false;
        this.loader.hide();
    }

    onStudentSave(data: { user: NewTenantUser | ITenantUser; profile: IProfileConfig }) {
        this.submitted = true;

        if (!data.profile) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Profile configuration is required'
            });
            return;
        }

        this.loader.show('Saving Student Data');

        // Clean up profile roles
        if (data.profile.roles) {
            for (let role in data.profile.roles) {
                if (data.profile.roles[role] == null) {
                    delete data.profile.roles[role];
                }
            }
        }
        data.profile.profileType = 'STUDENT';

        if (!data.user.id) {
            data.user.passwordHash = 'User@123';
        }

        const userConfig = {
            user: data.user,
            profile: data.profile
        };

        this.studentService.create(userConfig).subscribe({
            next: (result) => {
                this.hideDialog();
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Student profile saved successfully'
                });
            },
            error: (error) => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save student data'
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

        this.studentService.create(userConfig).subscribe({
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

    deleteStudent(student: IProfileConfig) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${student.fullName}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.loader.show('Deleting Student');
                this.studentService.delete(+student.userId, +student.roles?.student?.guardianId).subscribe({
                    next: (res) => {
                        this.load();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Student deleted successfully'
                        });
                    },
                    error: (error) => {
                        this.loader.hide();
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete student'
                        });
                    }
                });
            }
        });
    }

    editStudent(student: IProfileConfig) {
        this.studentDialog = true;
        this.student = { ...student };
    }

    addOrEditGuardian(student: IProfileConfig) {
        let gaurdianId = student.roles?.student?.guardianId;
        this.selectedStudentProfile = student as any;

        if (gaurdianId) {
            this.studentService.find(gaurdianId).subscribe((result: any) => {
                this.studentService.userSearch(0, 10, 'id', 'ASC', { 'user_id.in': [gaurdianId] }).subscribe((profiles) => {
                    if (profiles.content) {
                        this.selectedGaurdianProfile = profiles.content[0];
                        this.selectedGaurdian = { ...result.body };
                        this.guardianDialog = true;
                    } else {
                        this.loader.hide();
                    }
                });
            });
        } else {
            this.selectedGaurdian = {
                authorities: [this.tenantAuthorities().find((a: any) => a.name === 'GUARDIAN')],
                isTenantUser: true,
                activated: true,
                imageUrl: '',
                email: '',
                firstName: '',
                lastName: '',
                login: '',
                passwordHash: 'User@1234'
            } as NewTenantUser | any;

            this.selectedGaurdianProfile = {
                departments: student.departments
            } as any;
            this.guardianDialog = true;
        }
    }

    hideGuardianDialog() {
        this.guardianDialog = false;
    }

    onGuardianSave(userConfig: { user: NewTenantUser | ITenantUser; profile: IProfileConfig | any }) {
        this.loader.show('Updating Guardian Info');

        if (!userConfig.user.id) {
            for (let role in userConfig.profile?.roles) {
                if (userConfig.profile.roles[role] == null) {
                    delete userConfig.profile.roles[role];
                }
            }

            userConfig.user.branchId = this.commonService.branch.id;
            userConfig.profile.profileType = 'GUARDIAN';

            this.studentService.create(userConfig).subscribe({
                next: (result: any) => {
                    if (this.selectedStudentProfile.roles?.student) {
                        this.selectedStudentProfile.roles.student.guardianId = result.body?.user.id.toString();
                    }
                    this.profileService.update(this.selectedStudentProfile as IProfileConfig).subscribe((result) => {
                        setTimeout(() => {
                            this.hideGuardianDialog();
                            this.load();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail: 'Guardian information saved successfully'
                            });
                        });
                    });
                },
                error: (error) => {
                    this.loader.hide();
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to save guardian information'
                    });
                }
            });
        }
    }
}
