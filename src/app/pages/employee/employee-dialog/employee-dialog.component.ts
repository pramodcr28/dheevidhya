import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
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
import { ToggleButtonModule } from 'primeng/togglebutton';
import { Gender } from '../../../core/model/auth';
import { BranchService } from '../../../core/services/branch.service';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments, getSubjectsByFilters } from '../../../core/store/user-profile/user-profile.selectors';
import { IBranch } from '../../models/tenant.model';
import { IProfileConfig, IRoleConfigs, ITenantAuthority, ITenantUser, NewProfileConfig, NewTenantUser } from '../../models/user.model';
import { ProfileConfigFormService } from '../../service/profile-config-form.service';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantUserFormService } from '../../service/tenant-user-form.service';
import { UserService } from '../../service/user.service';
import { CommonService } from './../../../core/services/common.service';

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
        SelectModule,
        ReactiveFormsModule,
        ToggleButtonModule,
        FormsModule,
        MultiSelect,
        TabViewModule
    ],
    templateUrl: './employee-dialog.component.html',
    styles: ``,
    providers: [ConfirmationService]
})
export class EmployeeDialogComponent {
    studentService = inject(UserService);
    tenantUserFormService = inject(TenantUserFormService);
    profileConfigFormService = inject(ProfileConfigFormService);
    private store = inject(Store<{ userProfile: UserProfileState }>);
    commonService = inject(CommonService);
    employeeProfileService = inject(ProfileConfigService);
    branchService = inject(BranchService);
    confirmationService = inject(ConfirmationService);

    @Input() visible: boolean = false;
    @Input() statuses: any[] = [];
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
    profileForms: Map<number, FormGroup> = new Map();
    submitted: boolean = false;
    availableAuthorities: any[] = [];
    associatedDepartments: any[] = [];
    allBranches: IBranch[] = [];

    // Profile configs management
    profileConfigs = signal<IProfileConfig[]>([]);
    activeProfileIndex = signal<number>(0);

    // Profile-specific data
    profileData: Map<
        number,
        {
            selectedDepartments: any[];
            selectedGender: Gender;
            contactNumber: string;
            departmentSpecificSubjects: any[];
            selectedSubjects: any[];
        }
    > = new Map();

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
        const newProfile: NewProfileConfig = {
            id: null,
            userId: null,
            academicYear: `${currentYear}-${currentYear + 1}`,
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
        this.profileConfigs.set([newProfile as IProfileConfig]);
        this.initializeProfileData(0, newProfile as IProfileConfig);
    }

    loadEmployeeProfiles(userId: number): void {
        this.employeeProfileService.search(0, 100, 'academicYear', 'DESC', { 'userId.equals': userId.toString() }).subscribe((res: any) => {
            const profiles = res.content || [];
            if (profiles.length === 0) {
                this.initializeNewEmployee();
            } else {
                this.profileConfigs.set(profiles);
                profiles.forEach((profile: IProfileConfig, index: number) => {
                    this.initializeProfileData(index, profile);
                });
            }
        });
    }

    initializeProfileData(index: number, profile: IProfileConfig): void {
        const profileForm = this.profileConfigFormService.createProfileConfigFormGroup(profile);
        this.profileForms.set(index, profileForm);

        this.profileData.set(index, {
            selectedDepartments: profile.departments ? this.associatedDepartments.filter((d) => profile.departments?.includes(d.id)) : [],
            selectedGender: (profile.gender as Gender) || Gender.MALE,
            contactNumber: profile.contactNumber || '',
            departmentSpecificSubjects: [],
            selectedSubjects: profile.subjectIds || []
        });

        if (profile.departments?.length) {
            this.loadSubjectsForProfile(index, profile.departments);
        }
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
            const data = this.profileData.get(profileIndex);
            if (data) {
                data.departmentSpecificSubjects = subjects;
                this.profileData.set(profileIndex, data);
            }
        });
    }

    onDepartmentSelection(profileIndex: number): void {
        const data = this.profileData.get(profileIndex);
        if (data?.selectedDepartments) {
            const departmentIds = data.selectedDepartments.map((d) => d.id);
            this.loadSubjectsForProfile(profileIndex, departmentIds);
        }
    }

    onTabChange(event: any): void {
        this.activeProfileIndex.set(event.index);
    }

    addNewProfile(): void {
        const currentYear = new Date().getFullYear();
        const existingYears = this.profileConfigs().map((p) => p.academicYear);

        // Find next available academic year
        let nextYear = currentYear;
        let academicYear = `${nextYear}-${nextYear + 1}`;
        while (existingYears.includes(academicYear)) {
            nextYear++;
            academicYear = `${nextYear}-${nextYear + 1}`;
        }

        const newProfile: NewProfileConfig = {
            id: null,
            userId: this.employee.id?.toString() || null,
            academicYear,
            username: this.employeeForm.get('login')?.value || '',
            email: this.employeeForm.get('email')?.value || '',
            fullName: `${this.employeeForm.get('firstName')?.value || ''} ${this.employeeForm.get('lastName')?.value || ''}`,
            contactNumber: '',
            gender: Gender.MALE,
            profileType: 'STAFF',
            departments: [],
            roles: {},
            subjectIds: []
        };

        const profiles = [...this.profileConfigs(), newProfile as IProfileConfig];
        this.profileConfigs.set(profiles);

        const newIndex = profiles.length - 1;
        this.initializeProfileData(newIndex, newProfile as IProfileConfig);
        this.activeProfileIndex.set(newIndex);
    }

    deleteProfile(profileIndex: number): void {
        const profile = this.profileConfigs()[profileIndex];

        this.confirmationService.confirm({
            message: `Are you sure you want to delete the profile for ${profile.academicYear}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const profiles = this.profileConfigs().filter((_, i) => i !== profileIndex);
                this.profileConfigs.set(profiles);
                this.profileForms.delete(profileIndex);
                this.profileData.delete(profileIndex);

                if (this.activeProfileIndex() >= profiles.length) {
                    this.activeProfileIndex.set(Math.max(0, profiles.length - 1));
                }
            }
        });
    }

    getCurrentProfileData() {
        return (
            this.profileData.get(this.activeProfileIndex()) || {
                selectedDepartments: [],
                selectedGender: Gender.MALE,
                contactNumber: '',
                departmentSpecificSubjects: [],
                selectedSubjects: []
            }
        );
    }

    onSave(): void {
        this.submitted = true;

        if (this.employeeForm.invalid) {
            return;
        }

        const updatedEmployee = this.tenantUserFormService.getTenantUser(this.employeeForm);

        if (!updatedEmployee.id) {
            updatedEmployee.branchId = this.commonService.branch.id;
            updatedEmployee.passwordHash = 'User@123';
        }

        // Build all profile configs
        const profiles: IProfileConfig[] = [];
        this.profileConfigs().forEach((profile, index) => {
            const data = this.profileData.get(index);
            const profileForm = this.profileForms.get(index);

            if (data && profileForm) {
                const profileConfig: IProfileConfig = {
                    ...profile,
                    userId: updatedEmployee.id?.toString() || null,
                    academicYear: profile.academicYear,
                    username: updatedEmployee.login,
                    email: updatedEmployee.email,
                    fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
                    contactNumber: data.contactNumber,
                    gender: data.selectedGender,
                    departments: data.selectedDepartments.map((d) => d.id),
                    subjectIds: data.selectedSubjects,
                    roles: this.generateRoleConfig(updatedEmployee.authorities!, profile.roles || {})
                };
                profiles.push(profileConfig);
            }
        });

        this.save.emit({
            user: updatedEmployee,
            profiles
        });
    }

    generateRoleConfig(authorities: ITenantAuthority[], existingRoles: any): IRoleConfigs {
        const roleConfig: IRoleConfigs | any = {};
        const data = this.getCurrentProfileData();

        authorities?.forEach((authority) => {
            const roleName = authority?.name;
            if (existingRoles?.[roleName]) {
                roleConfig[roleName.toLowerCase()] = existingRoles[roleName];
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
                    roleConfig[roleName.toLowerCase().replace('_', '')] = {
                        subjectIds: data.selectedSubjects || []
                    };
                    break;
                case 'SPORTS_COACH':
                case 'IT_ADMINISTRATOR':
                    roleConfig[roleName.toLowerCase().replace('_', '')] = {};
                    break;
            }
        });

        return roleConfig;
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
