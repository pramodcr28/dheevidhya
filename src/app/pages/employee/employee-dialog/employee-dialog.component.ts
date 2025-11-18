import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
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
import { TextareaModule } from 'primeng/textarea';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { Gender } from '../../../core/model/auth';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments, getBranch, getSubjectsByFilters } from '../../../core/store/user-profile/user-profile.selectors';
import { IBranch } from '../../models/tenant.model';
import {
    IGuardianProfile,
    IHeadMasterProfile,
    IHeadOfDepartmentProfile,
    IITAdministratorProfile,
    ILecturerProfile,
    IPrincipalProfile,
    IProfessorProfile,
    IProfileConfig,
    IRoleConfigs,
    ISportsCoachProfile,
    IStudentProfile,
    ISubstituteTeacherProfile,
    ITeacherProfile,
    ITenantAuthority,
    ITenantUser,
    IVicePrincipalProfile,
    NewProfileConfig,
    NewTenantUser
} from '../../models/user.model';
import { ProfileConfigFormService } from '../../service/profile-config-form.service';
import { TenantUserFormService } from '../../service/tenant-user-form.service';
import { UserService } from '../../service/user.service';

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
        MultiSelect
    ],
    templateUrl: './employee-dialog.component.html',
    styles: ``
})
export class EmployeeDialogComponent {
    studentService = inject(UserService);
    tenantUserFormService = inject(TenantUserFormService);
    profileConfigFormService = inject(ProfileConfigFormService);
    private store = inject(Store<{ userProfile: UserProfileState }>);

    @Input() visible: boolean = false;
    @Input() statuses: any[] = [];
    @Input() set employee(employee: NewTenantUser | ITenantUser) {
        this._employee = employee;

        if (this.employeeForm) {
            this.tenantUserFormService.resetForm(this.employeeForm, employee);
        }
    }
    get employee(): NewTenantUser | ITenantUser {
        return this._employee;
    }

    @Input() set employeeProfile(profile: NewProfileConfig | IProfileConfig) {
        if (profile.subjectIds) {
            this.selectedSubjects = [...this.selectedSubjects, ...profile.subjectIds];
        }

        // for(let role in profile.roles){
        //   if(profile.roles[role]?.subjectIds){
        //     this.selectedSubjects =[...this.selectedSubjects,...profile.roles[role]?.subjectIds];
        //   }
        // }

        this._employeeProfile = profile;
    }
    get employeeProfile(): NewProfileConfig | IProfileConfig {
        return this._employeeProfile;
    }

    @Output() save = new EventEmitter<{ user: NewTenantUser | ITenantUser; profile: NewProfileConfig | IProfileConfig | any }>();
    @Output() cancel = new EventEmitter<void>();

    private _employee!: NewTenantUser | ITenantUser;
    private _employeeProfile!: NewProfileConfig | IProfileConfig;

    employeeForm!: FormGroup;
    employeeProfileForm!: FormGroup;
    submitted: boolean = false;
    availableAuthorities: any[] = [];
    associatedDepartments: any[] = [];
    selectedDepartments: any;
    associatedBranch: IBranch | undefined;

    selectedClass: any;
    selectedSection: any;
    selectedGender: Gender = Gender.MALE;
    genderOptions: any[] = [
        { label: 'Female', value: 'FEMALE' },
        { label: 'Male', value: 'MALE' },
        { label: 'Other', value: 'OTHER' }
    ];
    branch: IBranch | any;
    contactNumber: any;
    departmentSpecificSubjects = [];
    selectedSubjects = [];
    ngOnInit(): void {
        if (!this.employee.id)
            this.employee = {
                houseNumber: '123',
                street: 'Main Street',
                locality: 'Greenwood',
                landmark: 'Near City Park',
                taluk: 'Central',
                district: 'Metro District',
                state: 'Karnataka',
                country: 'India',
                postalCode: '560001',
                latitude: 12.9716,
                longitude: 77.5946,
                ...this.employee
            };
        this.employeeForm = this.tenantUserFormService.createTenantUserFormGroup(this.employee);
        this.employeeProfileForm = this.profileConfigFormService.createProfileConfigFormGroup(this.employeeProfile);
        this.contactNumber = this.employeeProfileForm.get('contactNumber').value;
        this.studentService.getAuthorities().subscribe((response: any) => {
            this.availableAuthorities = response.body
                .filter((authority: any) => authority.name != 'STUDENT' && authority.name != 'GUARDIAN')
                .map((authority: any) => {
                    return { name: authority.name };
                });
        });

        this.store.select(getAssociatedDepartments).subscribe((departments) => {
            this.associatedDepartments = departments;
            this.selectedDepartments = this.associatedDepartments.filter((department) => this._employeeProfile.departments?.includes(department.id));
        });
        this.store.select(getSubjectsByFilters([...this.selectedDepartments.map((deprt) => deprt.id)])).subscribe((subjects) => {
            this.departmentSpecificSubjects = subjects;
        });

        this.store.select(getBranch).subscribe((branch) => {
            this.branch = branch;
        });
    }

    onDepartmentSelection() {
        // this.selectedDepartments.map()
        this.store.select(getSubjectsByFilters([...this.selectedDepartments.map((deprt) => deprt.id)])).subscribe((subjects) => {
            this.departmentSpecificSubjects = subjects;
        });
    }

    onSave() {
        if (this.selectedDepartments.length) {
            this.submitted = true;
            const updatedStudent = this.tenantUserFormService.getTenantUser(this.employeeForm);

            if (!updatedStudent.id) {
                updatedStudent.branchId = this.branch.id;
                updatedStudent.passwordHash = '';
            }

            this.generateUserProfile(updatedStudent);
        }
    }

    async generateUserProfile(updatedStudent: ITenantUser | NewTenantUser) {
        const profileFormData = this.profileConfigFormService.getProfileConfig(this.employeeProfileForm);
        this.employeeProfile = {
            ...profileFormData,
            id: profileFormData.id ?? null,
            userId: updatedStudent.id?.toString(),
            academicYear: this.selectedDepartments[0]?.academicYear,
            username: updatedStudent.login,
            email: updatedStudent.email,
            contactNumber: this.contactNumber,
            fullName: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
            gender: this.selectedGender,
            subjectIds: this.selectedSubjects ?? [],
            departments: [...this.selectedDepartments.map((deprt) => deprt.id)],
            roles: await this.generateRoleConfig(updatedStudent.authorities!, profileFormData.roles)
        };

        this.save.emit({
            user: updatedStudent,
            profile: this.employeeProfile
        });
    }

    generateRoleConfig(authorities: ITenantAuthority[] | null, existingRoles: any): IRoleConfigs {
        const roleConfig: IRoleConfigs | any = {};
        authorities?.forEach((authority) => {
            switch (authority?.name) {
                case 'STUDENT':
                    if (!existingRoles?.[authority.name]) {
                        roleConfig.employee = {
                            classId: this.selectedClass?.id ?? null,
                            sectionId: this.selectedSection?.id ?? null,
                            rollNumber: null
                        } as IStudentProfile;
                    }

                    break;
                case 'GUARDIAN':
                    if (!existingRoles?.[authority.name]) {
                        roleConfig.parent = {
                            studentIds: []
                        } as IGuardianProfile;
                    }
                    break;
                case 'TEACHER':
                    if (!existingRoles?.[authority.name]) {
                        roleConfig.teacher = {
                            subjectIds: this.selectedSubjects ?? []
                        } as ITeacherProfile;
                    }

                    break;
                case 'LECTURER':
                    if (!existingRoles?.[authority.name]) {
                        roleConfig.lecturer = {
                            subjectIds: this.selectedSubjects ?? []
                        } as ILecturerProfile;
                    }
                    break;
                case 'PROFESSOR':
                    if (!existingRoles?.[authority.name]) {
                        roleConfig.professor = {
                            subjectIds: this.selectedSubjects ?? []
                        } as IProfessorProfile;
                    }

                    break;
                case 'HEAD_OF_DEPARTMENT':
                    if (!existingRoles?.[authority.name]) {
                        roleConfig.headofdepartment = {
                            subjectIds: this.selectedSubjects ?? []
                        } as IHeadOfDepartmentProfile;
                    }

                    break;
                case 'HEAD_MASTER':
                    if (!existingRoles?.[authority.name]) {
                        roleConfig.headmaster = {
                            subjectIds: this.selectedSubjects ?? []
                        } as IHeadMasterProfile;
                    }

                    break;
                case 'PRINCIPAL':
                    if (!existingRoles?.[authority.name]) {
                        roleConfig.principal = {
                            subjectIds: this.selectedSubjects ?? []
                        } as IPrincipalProfile;
                    }

                    break;
                case 'VICE_PRINCIPAL':
                    if (!existingRoles?.[authority.name]) {
                        roleConfig.viceprincipal = {
                            subjectIds: this.selectedSubjects ?? []
                        } as IVicePrincipalProfile;
                    }

                    break;
                case 'SPORTS_COACH':
                    if (!existingRoles?.[authority.name]) {
                        roleConfig.sportscoach = {} as ISportsCoachProfile;
                    }

                    break;
                case 'SUBSTITUTE_TEACHER':
                    if (!existingRoles?.[authority.name]) {
                        roleConfig.substituteteacher = {
                            subjectIds: this.selectedSubjects ?? []
                        } as ISubstituteTeacherProfile;
                    }

                    break;
                case 'IT_ADMINISTRATOR':
                    if (!existingRoles?.[authority.name]) {
                        roleConfig.itadmin = {} as IITAdministratorProfile;
                    }
                    break;
                default:
                    break;
            }
        });

        return roleConfig;
    }

    onCancel() {
        this.cancel.emit();
    }
}
