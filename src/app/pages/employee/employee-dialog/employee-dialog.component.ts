import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ConfirmationService, MessageService } from 'primeng/api';
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
import { TabViewModule } from 'primeng/tabview';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { Gender } from '../../../core/model/auth';
import { BranchService } from '../../../core/services/branch.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { IBranch } from '../../models/tenant.model';
import { IProfileConfig, IRoleConfigs, ITenantAuthority, ITenantUser, NewTenantUser } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantUserFormService } from '../../service/tenant-user-form.service';
import { UserService } from '../../service/user.service';
import { CommonService } from './../../../core/services/common.service';

interface ProfileUIData {
    profile: IProfileConfig;
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
        TabViewModule,
        DatePickerModule,
        ToastModule
    ],
    templateUrl: './employee-dialog.component.html',
    styles: ``,
    providers: [ConfirmationService, MessageService]
})
export class EmployeeDialogComponent {
    studentService = inject(UserService);
    tenantUserFormService = inject(TenantUserFormService);
    private store = inject(Store<{ userProfile: UserProfileState }>);
    commonService = inject(CommonService);
    employeeProfileService = inject(ProfileConfigService);
    branchService = inject(BranchService);
    confirmationService = inject(ConfirmationService);
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

    @Output() save = new EventEmitter<{ user: NewTenantUser | ITenantUser; profile: IProfileConfig }>();
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
        this.getAssociatedDepartmentsOnAcademicyear();
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
                country: 'India',
                postalCode: '',
                ...this.employee
            };
        }
        this.employeeForm = this.tenantUserFormService.createTenantUserFormGroup(this.employee);

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
            subjectIds: []
        };

        this.profilesList.set([
            {
                profile: newProfile,
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
                    .map((profile: IProfileConfig) => ({
                        profile,
                        selectedDepartments: profile.departments ? this.associatedDepartments.filter((d) => profile.departments?.includes(d.id)) : [],
                        departmentSpecificSubjects: [],
                        dateRange: this.parseAcademicYear(profile.academicYear || '')
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
        if (this.hasUnsavedChanges()) {
            this.confirmationService.confirm({
                message: 'You have unsaved changes. Do you want to discard them?',
                header: 'Unsaved Changes',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.discardChanges();
                    this.activeProfileIndex.set(event.index);
                    this.saveOriginalProfileData();
                },
                reject: () => {}
            });
        } else {
            this.activeProfileIndex.set(event.index);
            this.saveOriginalProfileData();
        }
        this.getAssociatedDepartmentsOnAcademicyear();
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
        const existingYears = this.profilesList().map((p) => p.profile.academicYear);

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
            subjectIds: []
        };

        const profiles: ProfileUIData[] = [
            {
                profile: newProfile,
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

        this.profilesList.set(profiles);

        const newIndex = profiles.findIndex((p) => p.profile === newProfile);

        this.activeProfileIndex.set(newIndex);

        this.saveOriginalProfileData();
    }

    hasNewProfile = computed(() => this.profilesList().some((p) => p.profile?.id == null));

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
            message: `Are you sure you want to delete the profile for ${profileData.profile.academicYear}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (!profileData.profile.id) {
                    const profiles = this.profilesList().filter((_, i) => i !== profileIndex);
                    this.profilesList.set(profiles);

                    if (this.activeProfileIndex() >= profiles.length) {
                        this.activeProfileIndex.set(Math.max(0, profiles.length - 1));
                    }
                } else {
                    this.employeeProfileService.delete(profileData.profile.id).subscribe({
                        next: () => {
                            this.loadEmployeeProfiles(profileData.profile.userId);
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

    onAcademicYearChange(profileIndex: number, value: Date[]): void {
        if (!value || value.filter((v) => v != null).length !== 2) {
            return;
        }

        const startDate = new Date(value[0]);
        const endInput = new Date(value[1]);
        const endDate = new Date(endInput.getFullYear(), endInput.getMonth() + 1, 0);
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 360 || diffDays > 370) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid Range',
                detail: 'Academic year must be approximately one year (365 days)'
            });

            this.profilesList.update((list) => {
                const updated = [...list];
                updated[profileIndex] = {
                    ...updated[profileIndex],
                    dateRange: null
                };
                return updated;
            });

            return;
        }

        this.profilesList.update((list) => {
            const updated = [...list];

            updated[profileIndex] = {
                ...updated[profileIndex],
                dateRange: [startDate, endDate],
                profile: {
                    ...updated[profileIndex].profile,
                    academicYear: this.formatAcademicYear(startDate, endDate)
                }
            };

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
            updatedEmployee.passwordHash = 'User@123';
            if (!this.commonService.getUserAuthorities.includes('SUPER_ADMIN')) {
                updatedEmployee.branchId = this.commonService.branch?.id || null;
            }
        }

        const profile: IProfileConfig = {
            ...profileData.profile,
            userId: updatedEmployee.id?.toString() || null,
            academicYear: profileData.profile.academicYear,
            username: updatedEmployee.login,
            email: updatedEmployee.email,
            fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
            departments: profileData.selectedDepartments.map((d) => d.id),
            subjectIds: profileData.profile.subjectIds || [],
            roles: this.generateRoleConfig(updatedEmployee.authorities!, profileData)
        };

        this.save.emit({
            user: updatedEmployee,
            profile
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

        if (!updatedEmployee.passwordHash || updatedEmployee.passwordHash === 'User@123') {
            updatedEmployee.passwordHash = null as any;
        }

        this.saveUser.emit(updatedEmployee);

        this.hasUnsavedUserChanges.set(false);
        this.saveOriginalUserData();
    }

    getAssociatedDepartmentsOnAcademicyear() {
        let filterParams = {
            branch: this.commonService.branch?.id || 0,
            academicYear: undefined
        };
        this.departmentConfigService.search(0, 100, 'id', 'ASC', filterParams).subscribe((res) => {
            this.associatedDepartments = res.content.map((re) => ({ ...re, name: re.department.name }));

            this.profilesList.update((list) =>
                list
                    .map((profileUI) => ({
                        ...profileUI,
                        selectedDepartments: profileUI.profile.departments ? this.associatedDepartments.filter((d) => profileUI.profile.departments?.includes(d.id)) : [],
                        dateRange: this.parseAcademicYear(profileUI.profile.academicYear || '')
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

            if (profileData.profile.roles?.[roleName.toLowerCase()]) {
                roleConfig[roleName.toLowerCase()] = profileData.profile.roles[roleName.toLowerCase()];
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
                        subjectIds: profileData.profile.subjectIds || []
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
        const match = academicYear.match(/(\d{4})-(\d{4})/);
        if (match) {
            const startYear = parseInt(match[1]);
            const endYear = parseInt(match[2]);
            return [new Date(startYear, 3, 1), new Date(endYear, 2, 31)];
        }
        return null;
    }
}
