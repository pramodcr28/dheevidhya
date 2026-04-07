import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { Gender } from '../../../core/model/auth';
import { BranchService } from '../../../core/services/branch.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { DheeConfirmationService } from '../../../core/services/dhee-confirmation.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { IBranch } from '../../models/tenant.model';
import { IProfileConfig, IRoleConfigs, ITenantAuthority, ITenantUser, NewTenantUser, UserStatus } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantUserFormService } from '../../service/tenant-user-form.service';
import { UserService } from '../../service/user.service';
import { CommonService } from './../../../core/services/common.service';

interface ProfileUIData {
    latestAcademicYear: IProfileConfig;
    selectedDepartments: any[];
    dateRange: Date[] | null;
}

@Component({
    selector: 'app-employee-dialog',
    imports: [
        SelectModule,
        RadioButtonModule,
        InputNumberModule,
        CommonModule,
        ButtonModule,
        RippleModule,
        InputTextModule,
        TextareaModule,
        DialogModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        ReactiveFormsModule,
        ToggleButtonModule,
        FormsModule,
        MultiSelect,
        TabsModule,
        DatePickerModule,
        ToastModule,
        ConfirmationDialogComponent,
        InputTextModule
    ],
    templateUrl: './employee-dialog.component.html',
    styles: ``,
    providers: [DheeConfirmationService, MessageService]
})
export class EmployeeDialogComponent {
    studentService = inject(UserService);
    tenantUserFormService = inject(TenantUserFormService);
    commonService = inject(CommonService);
    employeeProfileService = inject(ProfileConfigService);
    branchService = inject(BranchService);
    confirmationService = inject(DheeConfirmationService);
    messageService = inject(MessageService);
    departmentConfigService = inject(DepartmentConfigService);
    @Input() visible: boolean = false;
    @Input() set employee(employee: NewTenantUser | ITenantUser) {
        this._employee = employee;
        if (employee?.id) {
            this.loadEmployeeProfiles(employee.id.toString());
        } else {
            this.initializeNewEmployee();
        }
    }
    get employee(): NewTenantUser | ITenantUser {
        return this._employee;
    }

    @Output() save = new EventEmitter<{ user: NewTenantUser | ITenantUser; latestAcademicYear: IProfileConfig }>();
    @Output() saveUser = new EventEmitter<NewTenantUser | ITenantUser>();
    @Output() cancel = new EventEmitter<void>();

    private _employee!: NewTenantUser | ITenantUser;

    employeeForm!: FormGroup;
    submitted: boolean = false;
    availableAuthorities: any[] = [];
    associatedDepartments: any[] = [];
    associatedSubjects: any[] = [];
    allBranches: IBranch[] = [];

    profilesList = signal<ProfileUIData[]>([]);
    activeProfileIndex = signal<number>(0);
    hasUnsavedChanges = signal<boolean>(false);
    hasUnsavedUserChanges = signal<boolean>(false);
    originalProfileData: ProfileUIData | null = null;
    originalUserData: any = null;

    genderOptions: any[] = [
        { label: 'Female', value: 'FEMALE' },
        { label: 'Male', value: 'MALE' },
        { label: 'Other', value: 'OTHER' }
    ];

    ngOnInit(): void {
        this.initializeEmployeeForm();
        this.loadAuthorities();
    }

    initializeEmployeeForm(): void {
        if (!this.employee.id) {
            this.employee = {
                houseNumber: '',
                street: '',
                locality: '',
                landmark: '',
                taluk: '',
                district: '',
                state: '',
                status: UserStatus.ACTIVE,
                country: 'India',
                postalCode: '',
                ...this.employee
            };
        }
        this.employeeForm = this.tenantUserFormService.createTenantUserFormGroup(this.employee);

        if (this.employee.id != null && !this.commonService.getUserAuthorities.includes('IT_ADMINISTRATOR')) {
            this.employeeForm.get('login')?.disable();
        }

        // Track user form changes
        this.employeeForm.valueChanges.subscribe(() => {
            this.hasUnsavedUserChanges.set(true);
        });

        this.saveOriginalUserData();
    }

    initializeNewEmployee(): void {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 3, 1);
        const endDate = new Date(currentYear + 1, 2, 31);

        const newProfile: IProfileConfig = {
            id: null as any,
            userId: null,
            academicYear: this.formatAcademicYear(startDate, endDate),
            username: '',
            email: '',
            fullName: '',
            contactNumber: '',
            gender: Gender.MALE,
            profileType: 'STAFF',
            departments: [],
            roles: {},
            subjectIds: [],
            status: UserStatus.ACTIVE
        };

        this.profilesList.set([
            {
                latestAcademicYear: newProfile,
                selectedDepartments: [],
                dateRange: [startDate, endDate]
            }
        ]);

        this.saveOriginalProfileData();
    }

    loadEmployeeProfiles(userId: string): void {
        this.employeeProfileService.search(0, 100, 'academicYear', 'DESC', { 'userId.eq': userId }).subscribe((res: any) => {
            const profiles = res.content || [];
            if (profiles.length === 0) {
                this.initializeNewEmployee();
            } else {
                const profilesUIData: ProfileUIData[] = profiles
                    .map((latestAcademicYear: IProfileConfig) => ({
                        latestAcademicYear,
                        selectedDepartments: latestAcademicYear.departments ? this.associatedDepartments.filter((d) => latestAcademicYear.departments?.includes(d.id)) : [],
                        departmentSpecificSubjects: [],
                        dateRange: this.parseAcademicYear(latestAcademicYear.academicYear || '')
                    }))
                    .sort((a, b) => {
                        const aTime = a.dateRange?.[0]?.getTime() ?? 0;
                        const bTime = b.dateRange?.[0]?.getTime() ?? 0;

                        return bTime - aTime;
                    });

                this.profilesList.set(profilesUIData);

                this.saveOriginalProfileData();
            }
        });
    }

    loadAuthorities(): void {
        this.studentService.getAuthorities().subscribe((response: any) => {
            this.availableAuthorities = response.body.filter((authority: any) => authority.name !== 'STUDENT' && authority.name !== 'GUARDIAN').map((authority: any) => ({ name: authority.name }));

            if (this.commonService.getUserAuthorities.includes('SUPER_ADMIN')) {
                this.availableAuthorities = [{ name: 'IT_ADMINISTRATOR' }];
                this.branchService.query().subscribe((res) => {
                    this.allBranches = res.body || [];
                });
            } else {
                this.availableAuthorities = this.availableAuthorities.filter((authority: any) => authority.name !== 'IT_ADMINISTRATOR' && authority.name !== 'SUPER_ADMIN');
            }
        });
    }

    loadSubjectsForProfile(): void {
        const seen = new Set<string>();

        this.associatedSubjects = this.associatedDepartments
            .flatMap((dep) => dep.department.classes ?? [])
            .flatMap((cls) => cls.sections ?? [])
            .flatMap((sec) => sec.subjects ?? [])
            .filter((subject) => {
                if (seen.has(subject.id)) return false;
                seen.add(subject.id);
                return true;
            });
    }

    onTabChange(event: any): void {
        const newIndex = typeof event === 'number' ? event : event.index;

        if (this.hasUnsavedChanges()) {
            this.confirmationService.confirm({
                message: 'You have unsaved changes. Do you want to discard them?',
                header: 'Unsaved Changes',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.discardChanges();
                    this.activeProfileIndex.set(newIndex);
                    this.saveOriginalProfileData();
                },
                reject: () => {
                    // Revert to original tab - tabs will handle this automatically
                }
            });
        } else {
            this.activeProfileIndex.set(newIndex);
            this.saveOriginalProfileData();
        }
    }

    addNewProfile(): void {
        if (this.hasUnsavedChanges()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Unsaved Changes',
                detail: 'Please save or discard changes before adding a new profile'
            });
            return;
        }

        const currentYear = new Date().getFullYear();
        const existingYears = this.profilesList().map((p) => p.latestAcademicYear.academicYear);

        let nextYear = currentYear;
        let startDate = new Date(nextYear, 3, 1);
        let endDate = new Date(nextYear + 1, 2, 31);
        let academicYear = this.formatAcademicYear(startDate, endDate);

        while (existingYears.includes(academicYear)) {
            nextYear++;
            startDate = new Date(nextYear, 3, 1);
            endDate = new Date(nextYear + 1, 2, 31);
            academicYear = this.formatAcademicYear(startDate, endDate);
        }

        const newProfile: IProfileConfig = {
            id: null as any,
            userId: this.employee.id?.toString() || null,
            academicYear,
            username: '',
            email: '',
            fullName: '',
            contactNumber: '',
            gender: Gender.MALE,
            profileType: 'STAFF',
            departments: [],
            roles: {},
            subjectIds: [],
            status: UserStatus.ACTIVE
        };

        const latestAcademicYear: ProfileUIData[] = [
            {
                latestAcademicYear: newProfile,
                selectedDepartments: [],
                departmentSpecificSubjects: [],
                dateRange: [startDate, endDate]
            },
            ...this.profilesList()
        ].sort((a, b) => {
            const aTime = a.dateRange?.[0]?.getTime() ?? 0;
            const bTime = b.dateRange?.[0]?.getTime() ?? 0;
            return bTime - aTime;
        });

        this.profilesList.set(latestAcademicYear);

        const newIndex = latestAcademicYear.findIndex((p) => p.latestAcademicYear === newProfile);

        this.activeProfileIndex.set(newIndex);

        this.saveOriginalProfileData();
    }

    hasNewProfile = computed(() => this.profilesList().some((p) => p.latestAcademicYear?.id == null));

    deleteProfile(profileIndex: number): void {
        if (this.profilesList().length === 1) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Cannot Delete',
                detail: 'At least one profile is required'
            });
            return;
        }

        const profileData = this.profilesList()[profileIndex];

        this.confirmationService.confirm({
            message: `Are you sure you want to delete the profile for ${profileData.latestAcademicYear.academicYear}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (!profileData.latestAcademicYear.id) {
                    const profiles = this.profilesList().filter((_, i) => i !== profileIndex);
                    this.profilesList.set(profiles);

                    if (this.activeProfileIndex() >= profiles.length) {
                        this.activeProfileIndex.set(Math.max(0, profiles.length - 1));
                    }
                } else {
                    this.employeeProfileService.delete(profileData.latestAcademicYear.id).subscribe({
                        next: () => {
                            this.loadEmployeeProfiles(profileData.latestAcademicYear.userId);
                        }
                    });
                }
            }
        });
    }

    getDateRangeForProfile(index: number): Date[] | null {
        return this.profilesList()[index]?.dateRange || null;
    }

    setDateRangeForProfile(index: number, dates: Date[] | null): void {
        if (dates && dates.length === 2) {
            const profiles = this.profilesList();
            if (profiles[index]) {
                profiles[index].dateRange = dates;
                this.profilesList.set([...profiles]);
                this.markAsChanged();
            }
        }
    }

    onDepartmentChange(profileData) {
        profileData.latestAcademicYear.subjectIds = [];
    }

    onAcademicYearChange(profileIndex: number, value: Date[]): void {
        if (!value || value.filter((v) => v != null).length !== 2) {
            return;
        }

        const [rawStart, rawEnd] = value;

        const startYear = rawStart.getFullYear();
        const endYear = rawEnd.getFullYear();

        if (endYear - startYear !== 1) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid Range',
                detail: 'Academic year must span exactly 2 consecutive years (e.g. 2024–2025)'
            });
            this.profilesList.update((list) => [...list]);
            return;
        }

        const startDate = new Date(startYear, 3, 1); // Apr 1
        const endDate = new Date(endYear, 2, 31); // Mar 31
        const academicYear = this.formatAcademicYear(startDate, endDate);

        const isDuplicate = this.profilesList().some((p, i) => i !== profileIndex && p.latestAcademicYear.academicYear === academicYear);

        if (isDuplicate) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Duplicate Year',
                detail: `Academic year ${academicYear} already exists in another profile`
            });
            this.profilesList.update((list) => [...list]);
            return;
        }

        this.profilesList.update((list) => {
            const updated = [...list];

            updated[profileIndex] = {
                ...updated[profileIndex],
                dateRange: [startDate, endDate],
                latestAcademicYear: {
                    ...updated[profileIndex].latestAcademicYear,
                    academicYear: this.formatAcademicYear(startDate, endDate)
                }
            };
            this.getAssociatedDepartmentsOnAcademicyear(updated[profileIndex].latestAcademicYear.academicYear);
            return updated;
        });

        this.markAsChanged();
    }

    markAsChanged(): void {
        this.hasUnsavedChanges.set(true);
    }

    saveOriginalProfileData(): void {
        const currentProfile = this.profilesList()[this.activeProfileIndex()];
        if (currentProfile) {
            this.originalProfileData = JSON.parse(JSON.stringify(currentProfile));
        }
        this.getAssociatedDepartmentsOnAcademicyear(currentProfile.latestAcademicYear.academicYear);
        this.hasUnsavedChanges.set(false);
    }

    saveOriginalUserData(): void {
        if (this.employeeForm) {
            this.originalUserData = JSON.parse(JSON.stringify(this.employeeForm.value));
        }

        this.hasUnsavedUserChanges.set(false);
    }

    discardChanges(): void {
        if (this.originalProfileData) {
            const profiles = this.profilesList();
            profiles[this.activeProfileIndex()] = JSON.parse(JSON.stringify(this.originalProfileData));
            this.profilesList.set([...profiles]);
        }
        this.hasUnsavedChanges.set(false);
    }

    discardUserChanges(): void {
        if (this.originalUserData && this.employeeForm) {
            this.employeeForm.patchValue(this.originalUserData);
        }
        this.hasUnsavedUserChanges.set(false);
    }

    onSave(): void {
        this.submitted = true;
        if (this.employeeForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill all required fields in user information'
            });
            return;
        }

        const activeIndex = this.activeProfileIndex();
        const profileData = this.profilesList()[activeIndex];

        if (!profileData.dateRange || profileData.dateRange.length !== 2) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please select academic year range'
            });
            return;
        }

        const updatedEmployee = this.tenantUserFormService.getTenantUser(this.employeeForm);

        if (!updatedEmployee.id) {
            // updatedEmployee.passwordHash = 'User@123';
            if (!this.commonService.getUserAuthorities.includes('SUPER_ADMIN')) {
                updatedEmployee.branchId = this.commonService.branch?.id || null;
            }
        }

        const latestAcademicYear: IProfileConfig = {
            ...profileData.latestAcademicYear,
            userId: updatedEmployee.id?.toString() || null,
            academicYear: profileData.latestAcademicYear.academicYear,
            username: updatedEmployee.login,
            email: updatedEmployee.email,
            status: updatedEmployee.status,
            fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
            departments: profileData.selectedDepartments.map((d) => d.id),
            subjectIds: profileData.latestAcademicYear.subjectIds || [],
            roles: this.generateRoleConfig(updatedEmployee.authorities!, profileData)
        };

        this.save.emit({
            user: updatedEmployee,
            latestAcademicYear
        });

        this.hasUnsavedChanges.set(false);
        this.hasUnsavedUserChanges.set(false);
        this.saveOriginalProfileData();
        this.saveOriginalUserData();
    }

    onSaveUser(): void {
        this.submitted = true;

        if (this.employeeForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill all required fields in user information'
            });
            return;
        }

        const updatedEmployee = this.tenantUserFormService.getTenantUser(this.employeeForm);

        if (!updatedEmployee.id) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Cannot Save',
                detail: 'User must be created with a profile first. Use "Save Profile" button instead.'
            });
            return;
        }

        // if (!updatedEmployee.passwordHash || updatedEmployee.passwordHash === 'User@123') {
        //     updatedEmployee.passwordHash = null as any;
        // }

        this.saveUser.emit(updatedEmployee);

        this.hasUnsavedUserChanges.set(false);
        this.saveOriginalUserData();
    }

    getAssociatedDepartmentsOnAcademicyear(academicYear: string) {
        let filterParams = {
            branch: this.commonService.branch?.id || 0,
            academicYear: academicYear
        };
        this.departmentConfigService.search(0, 100, 'id', 'ASC', filterParams).subscribe((res) => {
            this.associatedDepartments = res.content.map((re) => ({ ...re, name: re.department.name }));

            this.profilesList.update((list) =>
                list
                    .map((profileUI) => ({
                        ...profileUI,
                        selectedDepartments: profileUI.latestAcademicYear.departments ? this.associatedDepartments.filter((d) => profileUI.latestAcademicYear.departments?.includes(d.id)) : [],
                        dateRange: this.parseAcademicYear(profileUI.latestAcademicYear.academicYear || '')
                    }))
                    .sort((a, b) => (b.dateRange?.[0]?.getTime() ?? 0) - (a.dateRange?.[0]?.getTime() ?? 0))
            );

            this.loadSubjectsForProfile();
        });
    }

    generateRoleConfig(authorities: ITenantAuthority[], profileData: ProfileUIData): IRoleConfigs {
        const roleConfig: IRoleConfigs | any = {};

        authorities?.forEach((authority) => {
            const roleName = authority?.name;

            if (profileData.latestAcademicYear.roles?.[roleName.toLowerCase()]) {
                roleConfig[roleName.toLowerCase()] = profileData.latestAcademicYear.roles[roleName.toLowerCase()];
                return;
            }

            switch (roleName) {
                case 'TEACHER':
                case 'LECTURER':
                case 'PROFESSOR':
                case 'HEAD_OF_DEPARTMENT':
                case 'HEAD_MASTER':
                case 'PRINCIPAL':
                case 'VICE_PRINCIPAL':
                case 'SUBSTITUTE_TEACHER':
                    roleConfig[roleName.toLowerCase().replace(/_/g, '')] = {
                        subjectIds: profileData.latestAcademicYear.subjectIds || []
                    };
                    break;
                case 'SPORTS_COACH':
                case 'IT_ADMINISTRATOR':
                    roleConfig[roleName.toLowerCase().replace(/_/g, '')] = {};
                    break;
            }
        });

        return roleConfig;
    }

    onCancel(): void {
        if (this.hasUnsavedChanges() || this.hasUnsavedUserChanges()) {
            this.confirmationService.confirm({
                message: 'You have unsaved changes. Do you want to discard them?',
                header: 'Unsaved Changes',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.cancel.emit();
                }
            });
        } else {
            this.cancel.emit();
        }
    }

    formatAcademicYear(startDate: Date, endDate: Date): string {
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        return `${startYear}-${endYear}`;
    }

    parseAcademicYear(academicYear: string): Date[] | null {
        const match = academicYear.match(/^(\d{4})-(\d{4})$/);
        if (match) {
            const startYear = parseInt(match[1]);
            const endYear = parseInt(match[2]);
            return [new Date(startYear, 3, 1), new Date(endYear, 2, 31)];
        }
        return null;
    }
}
