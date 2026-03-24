import { CommonModule } from '@angular/common';
import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
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
import { DheeConfirmationService } from '../../../core/services/dhee-confirmation.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { MasterClassService } from '../../../core/services/master-class.service';
import { MasterSectionService } from '../../../core/services/master-section.service';
import { SortService } from '../../../shared/sort';
import { IProfileConfig, ITenantUser, NewTenantUser } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantAuthorityService } from '../../service/tenant-authority.service';
import { UserService } from '../../service/user.service';
import { GuardianDialogComponent } from '../guardian-dialog/guardian-dialog.component';
import { StudentDialogComponent } from '../student-dialog/student-dialog.component';
import { MasterDepartmentService } from './../../../core/services/master-department.service';

interface FilterConfig {
    className?: string[];
    sectionName?: string[];
    deptName?: string[];
    status?: string[];
    activated?: boolean | null;
}

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
        DropdownModule,
        MultiSelectModule,
        GuardianDialogComponent,
        StudentDialogComponent
    ],
    templateUrl: './student-list.component.html',
    providers: [MessageService, DheeConfirmationService],
    styles: [``]
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

    // Filter options
    classOptions = signal<any[]>([]);
    sectionOptions = signal<any[]>([]);
    departmentOptions = signal<any[]>([]);
    statusOptions = [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
        { label: 'Suspended', value: 'SUSPENDED' }
    ];
    activatedOptions = [
        { label: 'All', value: null },
        { label: 'Activated', value: true },
        { label: 'Not Activated', value: false }
    ];

    // Active filters
    filters: FilterConfig = {};
    showFilters = signal<boolean>(false);

    router = inject(Router);
    studentService = inject(UserService);
    profileService = inject(ProfileConfigService);
    authorityService = inject(TenantAuthorityService);
    activatedRoute = inject(ActivatedRoute);
    sortService = inject(SortService);
    ngZone = inject(NgZone);
    messageService = inject(MessageService);
    confirmationService = inject(DheeConfirmationService);
    loader = inject(ApiLoaderService);
    commonService = inject(CommonService);

    // pagination related code
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 0;
    sortField = 'id';
    sortOrder: 'ASC' | 'DESC' = 'ASC';

    masterClassService = inject(MasterClassService);
    masterSectionService = inject(MasterSectionService);
    masterDepartmentService = inject(MasterDepartmentService);

    ngOnInit() {
        this.authorityService.query().subscribe((result: any) => {
            this.tenantAuthorities.set(result.body);
        });
        this.loadFilterOptions();
        this.load();
    }

    loadFilterOptions(): void {
        // Load Classes
        this.masterClassService.query().subscribe((result: any) => {
            this.classOptions.set(
                result.body?.map((cls: any) => ({
                    label: cls.name,
                    value: cls.name
                })) || []
            );
        });

        // Load Sections
        this.masterSectionService.query().subscribe((result: any) => {
            this.sectionOptions.set(
                result.body?.map((section: any) => ({
                    label: section.name,
                    value: section.name
                })) || []
            );
        });

        // Load Departments
        this.masterDepartmentService.query().subscribe((result: any) => {
            this.departmentOptions.set(
                result.body?.map((dept: any) => ({
                    label: dept.name,
                    value: dept.name
                })) || []
            );
        });
    }

    buildSearchCriteria(): any {
        const criteria: any = {
            'branch_id.eq': this.commonService.branch?.id,
            'authorities.name.in': ['STUDENT']
        };

        // Add filter criteria
        if (this.filters.className && this.filters.className.length > 0) {
            criteria['class_name.in'] = this.filters.className;
        }

        if (this.filters.sectionName && this.filters.sectionName.length > 0) {
            criteria['section_name.in'] = this.filters.sectionName;
        }

        if (this.filters.deptName && this.filters.deptName.length > 0) {
            criteria['dept_name.in'] = this.filters.deptName;
        }

        if (this.filters.status && this.filters.status.length > 0) {
            criteria['status.in'] = this.filters.status;
        }

        if (this.filters.activated !== null && this.filters.activated !== undefined) {
            criteria['activated.eq'] = this.filters.activated;
        }

        return criteria;
    }

    load(): void {
        this.loader.show('Fetching Student Data');
        const searchCriteria = this.buildSearchCriteria();

        this.studentService.userSearch(this.page, this.itemsPerPage, this.sortField, this.sortOrder, searchCriteria).subscribe({
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

    applyFilters(): void {
        this.page = 0; // Reset to first page when applying filters
        this.load();
    }

    clearFilters(): void {
        this.filters = {};
        this.page = 0;
        this.load();
    }

    toggleFilters(): void {
        this.showFilters.set(!this.showFilters());
    }

    onPageChange(event: any): void {
        this.itemsPerPage = event.rows;
        this.page = Math.floor(event.first / event.rows);
        this.load();
    }

    onSort(event: any): void {
        this.sortField = event.field || 'id';
        this.sortOrder = event.order === 1 ? 'ASC' : 'DESC';
        this.page = 0;
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

        this.studentService.create(userConfig).subscribe((res: any) => {
            if (res && res.body.status === 200) {
                this.hideDialog();
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Student profile saved successfully'
                });
            } else {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: res.body.error || 'Error',
                    detail: res.body.message || 'Failed to save student data'
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

        const userConfig = {
            user: user,
            profile: null
        };

        this.studentService.create(userConfig).subscribe((res: any) => {
            if (res && res.body.status === 200) {
                this.hideDialog();
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Student profile saved successfully'
                });
            } else {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: res.body.error || 'Error',
                    detail: res.body.message || 'Failed to save student data'
                });
            }
        });
    }

    deleteStudent(student: NewTenantUser) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${student.firstName} ${student.lastName}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.loader.show('Deleting Student');

                this.studentService.delete(student.id, null).subscribe({
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

    editStudent(student: IProfileConfig | any) {
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
