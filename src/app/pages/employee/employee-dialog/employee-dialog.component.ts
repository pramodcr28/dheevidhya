import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
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
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments, getSubjectsByFilters } from '../../../core/store/user-profile/user-profile.selectors';
import { IBranch } from '../../models/tenant.model';
import { IProfileConfig, IRoleConfigs, ITenantAuthority, ITenantUser, NewTenantUser } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantUserFormService } from '../../service/tenant-user-form.service';
import { UserService } from '../../service/user.service';
import { CommonService } from './../../../core/services/common.service';

// UI Model for profile data
interface ProfileUIData {
    profile: IProfileConfig;
    selectedDepartments: any[];
    departmentSpecificSubjects: any[];
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

    @Input() visible: boolean = false;
    @Input() set employee(employee: NewTenantUser | ITenantUser) {
        this._employee = employee;
        if (employee?.id) {
            this.loadEmployeeProfiles(employee.id);
        } else {
            this.initializeNewEmployee();
        }
    }
    get employee(): NewTenantUser | ITenantUser {
        return this._employee;
    }

    @Output() save = new EventEmitter<{ user: NewTenantUser | ITenantUser; profiles: IProfileConfig[] }>();
    @Output() cancel = new EventEmitter<void>();

    private _employee!: NewTenantUser | ITenantUser;

    employeeForm!: FormGroup;
    submitted: boolean = false;
    availableAuthorities: any[] = [];
    associatedDepartments: any[] = [];
    allBranches: IBranch[] = [];

    // Simple list of profile UI data
    profilesList = signal<ProfileUIData[]>([]);
    activeProfileIndex = signal<number>(0);

    genderOptions: any[] = [
        { label: 'Female', value: 'FEMALE' },
        { label: 'Male', value: 'MALE' },
        { label: 'Other', value: 'OTHER' }
    ];

    ngOnInit(): void {
        this.initializeEmployeeForm();
        this.loadAuthorities();
        this.loadDepartments();
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
    }

    initializeNewEmployee(): void {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 3, 1); // April 1st
        const endDate = new Date(currentYear + 1, 2, 31); // March 31st

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
                departmentSpecificSubjects: [],
                dateRange: [startDate, endDate]
            }
        ]);
    }

    loadEmployeeProfiles(userId: number): void {
        this.employeeProfileService.search(0, 100, 'academicYear', 'DESC', { 'userId.equals': userId.toString() }).subscribe((res: any) => {
            const profiles = res.content || [];
            if (profiles.length === 0) {
                this.initializeNewEmployee();
            } else {
                const profilesUIData: ProfileUIData[] = profiles.map((profile: IProfileConfig) => ({
                    profile: profile,
                    selectedDepartments: profile.departments ? this.associatedDepartments.filter((d) => profile.departments?.includes(d.id)) : [],
                    departmentSpecificSubjects: [],
                    dateRange: this.parseAcademicYear(profile.academicYear || '')
                }));

                this.profilesList.set(profilesUIData);

                // Load subjects for each profile
                profilesUIData.forEach((item, index) => {
                    if (item.profile.departments?.length) {
                        this.loadSubjectsForProfile(index, item.profile.departments);
                    }
                });
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
            }
        });
    }

    loadDepartments(): void {
        this.store.select(getAssociatedDepartments).subscribe((departments) => {
            this.associatedDepartments = departments;
        });
    }

    loadSubjectsForProfile(profileIndex: number, departmentIds: string[]): void {
        this.store.select(getSubjectsByFilters(departmentIds)).subscribe((subjects) => {
            const profiles = this.profilesList();
            if (profiles[profileIndex]) {
                profiles[profileIndex].departmentSpecificSubjects = subjects;
                this.profilesList.set([...profiles]);
            }
        });
    }

    onDepartmentSelection(profileIndex: number): void {
        const profileData = this.profilesList()[profileIndex];
        if (profileData?.selectedDepartments?.length) {
            const departmentIds = profileData.selectedDepartments.map((d) => d.id);
            this.loadSubjectsForProfile(profileIndex, departmentIds);
        }
    }

    onTabChange(event: any): void {
        this.activeProfileIndex.set(event.index);
    }

    addNewProfile(): void {
        const currentYear = new Date().getFullYear();
        const existingYears = this.profilesList().map((p) => p.profile.academicYear);

        // Find next available academic year
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

        const profiles = [
            ...this.profilesList(),
            {
                profile: newProfile,
                selectedDepartments: [],
                departmentSpecificSubjects: [],
                dateRange: [startDate, endDate]
            }
        ];

        this.profilesList.set(profiles);
        this.activeProfileIndex.set(profiles.length - 1);
    }

    deleteProfile(profileIndex: number): void {
        const profileData = this.profilesList()[profileIndex];

        this.confirmationService.confirm({
            message: `Are you sure you want to delete the profile for ${profileData.profile.academicYear}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const profiles = this.profilesList().filter((_, i) => i !== profileIndex);
                this.profilesList.set(profiles);

                if (this.activeProfileIndex() >= profiles.length) {
                    this.activeProfileIndex.set(Math.max(0, profiles.length - 1));
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
            }
        }
    }

    onAcademicYearChange(profileIndex: number): void {
        const profileData = this.profilesList()[profileIndex];
        const dates = profileData?.dateRange;

        if (!dates || dates.length !== 2) return;

        const startDate = dates[0];
        const endDate = dates[1];

        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 360 || diffDays > 370) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid Range',
                detail: 'Academic year must be approximately one year (365 days)'
            });
            const profiles = this.profilesList();
            profiles[profileIndex].dateRange = null;
            this.profilesList.set([...profiles]);
            return;
        }

        const profiles = this.profilesList();
        profiles[profileIndex].profile.academicYear = this.formatAcademicYear(startDate, endDate);
        this.profilesList.set([...profiles]);
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

        for (let i = 0; i < this.profilesList().length; i++) {
            const profileData = this.profilesList()[i];
            if (!profileData.dateRange || profileData.dateRange.length !== 2) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Validation Error',
                    detail: 'Please select academic year range for all profiles'
                });
                this.activeProfileIndex.set(i);
                return;
            }
        }

        const updatedEmployee = this.tenantUserFormService.getTenantUser(this.employeeForm);

        if (!updatedEmployee.id) {
            updatedEmployee.passwordHash = 'User@123';
        }

        const profiles: IProfileConfig[] = this.profilesList().map((profileData) => {
            return {
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
        });

        this.save.emit({
            user: updatedEmployee,
            profiles
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
        this.cancel.emit();
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
            return [
                new Date(startYear, 3, 1), // April 1st
                new Date(endYear, 2, 31) // March 31st
            ];
        }
        return null;
    }
}
