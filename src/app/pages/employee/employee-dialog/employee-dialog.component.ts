import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { Tooltip } from 'primeng/tooltip';
import { BranchService } from '../../../core/services/branch.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { DheeConfirmationService } from '../../../core/services/dhee-confirmation.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { IBranch } from '../../models/tenant.model';
import { IRoleConfigs, ITenantAuthority, ITenantUser, NewTenantUser, UserStatus } from '../../models/user.model';
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
        ReactiveFormsModule,
        ToggleButtonModule,
        FormsModule,
        MultiSelect,
        TabsModule,
        DatePickerModule,
        ToastModule,
        ConfirmationDialogComponent,
        InputTextModule,
        Tooltip
    ],
    templateUrl: './employee-dialog.component.html',
    styles: ``,
    providers: [DheeConfirmationService, MessageService]
})
export class EmployeeDialogComponent implements OnInit {
    studentService = inject(UserService);
    tenantUserFormService = inject(TenantUserFormService);
    commonService = inject(CommonService);
    branchService = inject(BranchService);
    confirmationService = inject(DheeConfirmationService);
    messageService = inject(MessageService);
    departmentConfigService = inject(DepartmentConfigService);

    @Input() visible: boolean = false;
    @Input() set employee(employee: NewTenantUser | ITenantUser) {
        this._employee = employee;
    }
    get employee(): NewTenantUser | ITenantUser {
        return this._employee;
    }

    @Output() save = new EventEmitter<NewTenantUser>();
    @Output() cancel = new EventEmitter<void>();

    private _employee!: NewTenantUser | ITenantUser;

    employeeForm!: FormGroup;
    submitted: boolean = false;
    availableAuthorities: any[] = [];
    associatedDepartments: any[] = [];
    associatedSubjects: any[] = [];
    allBranches: IBranch[] = [];

    hasUnsavedUserChanges = signal<boolean>(false);
    originalUserData: any = null;

    showYearManager: boolean = false;

    genderOptions = [
        { label: 'Female', value: 'FEMALE' },
        { label: 'Male', value: 'MALE' },
        { label: 'Other', value: 'OTHER' }
    ];

    get profileForm(): FormGroup {
        return this.employeeForm?.get('latestAcademicYear') as FormGroup;
    }

    get currentAcademicYear(): string {
        return this.profileForm?.get('academicYear')?.value || '';
    }

    get dateRange(): Date[] | null {
        return this.parseAcademicYear(this.currentAcademicYear);
    }

    ngOnInit(): void {
        this.initializeEmployeeForm();
        this.loadAuthorities();
    }

    initializeEmployeeForm(): void {
        const defaultAcademicYear: string = (this.commonService as any).currentAcademicYear ?? (this.commonService as any).currentUser?.academicYear ?? this.getDefaultAcademicYear();

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
                ...this.employee,
                latestAcademicYear: {
                    id: null,
                    academicYear: defaultAcademicYear,
                    departments: [],
                    subjectIds: [],
                    status: UserStatus.ACTIVE,
                    contactNumber: '',
                    gender: null,
                    ...(this.employee.latestAcademicYear || {})
                }
            };
        }

        this.employeeForm = this.tenantUserFormService.createTenantUserFormGroup(this.employee);

        if (!this.profileForm.contains('subjectIds')) {
            this.profileForm.addControl('subjectIds', new FormControl(this.employee.latestAcademicYear?.subjectIds || []));
        }

        this.profileForm.get('gender')?.setValidators([Validators.required]);

        if (!this.commonService.getUserAuthorities.includes('SUPER_ADMIN')) {
            this.profileForm.get('departments')?.setValidators([Validators.required]);
        }

        this.profileForm.get('gender')?.updateValueAndValidity();
        this.profileForm.get('departments')?.updateValueAndValidity();

        if (this.employee.id != null && !this.commonService.getUserAuthorities.includes('IT_ADMINISTRATOR')) {
            this.employeeForm.get('login')?.disable();
        }

        this.getAssociatedDepartmentsOnAcademicYear(this.currentAcademicYear);

        this.employeeForm.valueChanges.subscribe(() => this.hasUnsavedUserChanges.set(true));
        this.saveOriginalUserData();
    }

    loadAuthorities(): void {
        this.studentService.getAuthorities().subscribe((response: any) => {
            this.availableAuthorities = response.body.filter((a: any) => a.name !== 'STUDENT' && a.name !== 'GUARDIAN').map((a: any) => ({ name: a.name }));

            if (this.commonService.getUserAuthorities.includes('SUPER_ADMIN')) {
                this.availableAuthorities = [{ name: 'IT_ADMINISTRATOR' }];
                this.branchService.query().subscribe((res) => (this.allBranches = res.body || []));
            } else {
                this.availableAuthorities = this.availableAuthorities.filter((a: any) => a.name !== 'IT_ADMINISTRATOR' && a.name !== 'SUPER_ADMIN');
            }
        });
    }

    getAssociatedDepartmentsOnAcademicYear(academicYear: string): void {
        if (!academicYear) return;
        const filterParams = { branch: this.commonService.branch?.id || 0, academicYear };
        this.departmentConfigService.search(0, 100, 'id', 'ASC', filterParams).subscribe((res) => {
            this.associatedDepartments = res.content.map((re) => ({ ...re, name: re.department.name }));
            this.loadSubjectsForProfile();
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

    saveOriginalUserData(): void {
        if (this.employeeForm) {
            this.originalUserData = JSON.parse(JSON.stringify(this.employeeForm.getRawValue()));
        }
        this.hasUnsavedUserChanges.set(false);
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
                detail: 'Please fill all required fields correctly.'
            });
            return;
        }

        const updatedEmployee: any = this.tenantUserFormService.getTenantUser(this.employeeForm);

        if (!this.commonService.getUserAuthorities.includes('SUPER_ADMIN')) {
            updatedEmployee.branchId = this.commonService.branch?.id || null;
            updatedEmployee.branchCode = this.commonService.branch?.code;
        }

        updatedEmployee.latestAcademicYear.roles = this.generateRoleConfig(updatedEmployee.authorities!, updatedEmployee);
        updatedEmployee.latestAcademicYear.departmentNames = this.associatedDepartments
            .filter((d) => {
                return updatedEmployee?.latestAcademicYear?.departments?.includes(d.id);
            })
            .map((d) => d.name);
        updatedEmployee.latestAcademicYear.username = updatedEmployee.login;
        updatedEmployee.latestAcademicYear.email = updatedEmployee.email;
        updatedEmployee.latestAcademicYear.fullName = updatedEmployee.firstName + ' ' + updatedEmployee.lastName;
        this.save.emit(updatedEmployee);

        this.hasUnsavedUserChanges.set(false);
        this.submitted = false;
        this.saveOriginalUserData();
    }

    onDepartmentChange(): void {
        this.profileForm.get('subjectIds')?.setValue([]);
    }

    onCancel(): void {
        if (this.hasUnsavedUserChanges()) {
            this.confirmationService.confirm({
                message: 'You have unsaved changes. Do you want to discard them?',
                header: 'Unsaved Changes',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.hasUnsavedUserChanges.set(false);
                    this.cancel.emit();
                }
            });
        } else {
            this.cancel.emit();
        }
    }

    generateRoleConfig(authorities: ITenantAuthority[], employee: any): IRoleConfigs {
        const roleConfig: IRoleConfigs | any = {};
        authorities?.forEach((authority) => {
            const roleName = authority?.name;
            if (employee.latestAcademicYear.roles?.[roleName.toLowerCase()]) {
                roleConfig[roleName.toLowerCase()] = employee.latestAcademicYear.roles[roleName.toLowerCase()];
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
                        subjectIds: employee.latestAcademicYear.subjectIds || []
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

    private getDefaultAcademicYear(): string {
        const now = new Date();
        const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        return `${startYear}-${startYear + 1}`;
    }

    parseAcademicYear(academicYear: string): Date[] | null {
        if (!academicYear) return null;
        const match = academicYear.match(/^(\d{4})-(\d{4})$/);
        if (!match) return null;
        return [new Date(parseInt(match[1]), 3, 1), new Date(parseInt(match[2]), 2, 31)];
    }
}
