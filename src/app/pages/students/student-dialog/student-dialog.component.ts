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
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { Gender } from '../../../core/model/auth';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { DheeConfirmationService } from '../../../core/services/dhee-confirmation.service';
import { IProfileConfig, IRoleConfigs, IStudentProfile, ITenantUser, NewTenantUser, UserStatus } from '../../models/user.model';
import { ProfileConfigFormService } from '../../service/profile-config-form.service';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantUserFormService } from '../../service/tenant-user-form.service';
import { UserService } from '../../service/user.service';

interface ProfileUIData {
    profile: IProfileConfig;
    selectedDepartment: any;
    selectedClass: any;
    selectedSection: any;
    dateRange: Date[] | null;
}

@Component({
    selector: 'app-student-dialog',
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
        TabsModule,
        DatePickerModule,
        ToastModule
    ],
    templateUrl: './student-dialog.component.html',
    providers: [DheeConfirmationService, MessageService]
})
export class StudentDialogComponent {
    studentService = inject(UserService);
    tenantUserFormService = inject(TenantUserFormService);
    profileConfigFormService = inject(ProfileConfigFormService);
    commonService = inject(CommonService);
    studentProfileService = inject(ProfileConfigService);
    confirmationService = inject(DheeConfirmationService);
    messageService = inject(MessageService);

    @Input() visible: boolean = false;
    @Input() set student(student: NewTenantUser | ITenantUser) {
        this._student = student;
        if (student?.id) {
            this.loadStudentProfiles(student.id.toString());
            this.initializeStudentForm();
        } else {
            this.initializeNewStudent();
        }
    }
    get student(): NewTenantUser | ITenantUser {
        return this._student;
    }

    @Output() save = new EventEmitter<{ user: NewTenantUser | ITenantUser; profile: IProfileConfig }>();
    @Output() saveUser = new EventEmitter<NewTenantUser | ITenantUser>();
    @Output() cancel = new EventEmitter<void>();

    private _student!: NewTenantUser | ITenantUser;

    studentForm!: FormGroup;
    studentProfileForm!: FormGroup;
    submitted: boolean = false;

    profilesList = signal<ProfileUIData[]>([]);
    activeProfileIndex = signal<number>(0);
    hasUnsavedChanges = signal<boolean>(false);
    hasUnsavedUserChanges = signal<boolean>(false);
    originalProfileData: ProfileUIData | null = null;
    originalUserData: any = null;
    departmentConfigService = inject(DepartmentConfigService);
    associatedDepartments: any[] = [];
    genderOptions: any[] = [
        { label: 'Female', value: 'FEMALE' },
        { label: 'Male', value: 'MALE' },
        { label: 'Other', value: 'OTHER' }
    ];

    ngOnInit(): void {
        // this.initializeStudentForm();
    }

    getAssociatedDepartmentsOnAcademicyear(academicYear: string) {
        const filterParams = {
            branch: this.commonService.branch?.id || 0,
            academicYear
        };

        this.departmentConfigService.search(0, 100, 'id', 'ASC', filterParams).subscribe((res) => {
            this.associatedDepartments = res.content.map((re) => ({
                ...re,
                name: re.department.name
            }));

            const index = this.activeProfileIndex();
            const currentList = this.profilesList();

            if (!currentList[index]) return;

            const currentItem = currentList[index];
            const assets = this.selectDepartmentAssets(this.associatedDepartments, currentItem.profile);

            this.profilesList.update((list) =>
                list.map((item, i) =>
                    i === index
                        ? {
                              ...item,
                              ...assets
                          }
                        : item
                )
            );
        });
    }

    initializeStudentForm(): void {
        if (!this.student.id) {
            this.student = {
                // houseNumber: '',
                // street: '',
                // locality: '',
                // landmark: '',
                // taluk: '',
                // district: '',
                // state: '',
                // country: 'India',
                // postalCode: '',
                ...this.student
            };
        }
        this.studentForm = this.tenantUserFormService.createTenantUserFormGroup(this.student);

        this.studentForm.valueChanges.subscribe(() => {
            this.hasUnsavedUserChanges.set(true);
        });

        this.saveOriginalUserData();
    }

    initializeNewStudent(): void {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 3, 1); // Apr 1
        const endDate = new Date(currentYear + 1, 2, 31); // Mar 31

        const newProfile: IProfileConfig = {
            id: null as any,
            userId: null,
            academicYear: this.formatAcademicYear(startDate, endDate),
            username: '',
            email: '',
            fullName: '',
            contactNumber: '',
            gender: Gender.MALE,
            profileType: 'STUDENT',
            departments: [],
            roles: {},
            subjectIds: [],
            status: UserStatus.ACTIVE
        };

        this.profilesList.set([
            {
                profile: newProfile,
                selectedDepartment: null,
                selectedClass: null,
                selectedSection: null,
                dateRange: [startDate, endDate]
            }
        ]);

        this.saveOriginalProfileData();
    }

    selectDepartmentAssets(
        departments: any[] | null | undefined,
        profile: IProfileConfig
    ): {
        selectedDepartment: any | null;
        selectedClass: any | null;
        selectedSection: any | null;
    } {
        if (!departments || departments.length === 0) {
            return {
                selectedDepartment: null,
                selectedClass: null,
                selectedSection: null
            };
        }

        const departmentId = profile.departments?.[0];
        const selectedDepartment = departments.find((d) => d.id === departmentId) || null;

        let selectedClass: any = null;
        let selectedSection: any = null;

        if (profile.roles?.student && selectedDepartment) {
            const studentRole = profile.roles.student as IStudentProfile;

            selectedClass = selectedDepartment.department?.classes?.find((c: any) => c.id === studentRole.classId) || null;

            if (selectedClass) {
                selectedSection = selectedClass.sections?.find((s: any) => s.id === studentRole.sectionId) || null;
            }
        }

        return {
            selectedDepartment,
            selectedClass,
            selectedSection
        };
    }

    loadStudentProfiles(userId: string): void {
        this.studentProfileService.search(0, 100, 'academicYear', 'DESC', { 'userId.eq': userId }).subscribe((res: any) => {
            const profiles = res.content || [];

            if (profiles.length === 0) {
                this.initializeNewStudent();
                return;
            }

            const profilesUIData: ProfileUIData[] = profiles
                .map((profile: IProfileConfig) => {
                    const assets = this.selectDepartmentAssets(this.associatedDepartments, profile);

                    return {
                        profile,
                        ...assets,
                        dateRange: this.parseAcademicYear(profile.academicYear || '')
                    };
                })
                .sort((a, b) => {
                    const aTime = a.dateRange?.[0]?.getTime() ?? 0;
                    const bTime = b.dateRange?.[0]?.getTime() ?? 0;
                    return bTime - aTime;
                });

            this.profilesList.set(profilesUIData);
            this.saveOriginalProfileData();
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
            userId: this.student.id?.toString() || null,
            academicYear,
            username: '',
            email: '',
            fullName: '',
            contactNumber: '',
            gender: Gender.MALE,
            profileType: 'STUDENT',
            departments: [],
            roles: {},
            subjectIds: [],
            status: UserStatus.ACTIVE
        };

        const profiles: ProfileUIData[] = [
            {
                profile: newProfile,
                selectedDepartment: null,
                selectedClass: null,
                selectedSection: null,
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
                    this.studentProfileService.delete(profileData.profile.id).subscribe({
                        next: () => {
                            this.loadStudentProfiles(profileData.profile.userId);
                        }
                    });
                }
            }
        });
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

        const startDate = new Date(startYear, 3, 1);
        const endDate = new Date(endYear, 2, 31);
        const academicYear = this.formatAcademicYear(startDate, endDate);

        const isDuplicate = this.profilesList().some((p, i) => i !== profileIndex && p.profile.academicYear === academicYear);

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
                profile: {
                    ...updated[profileIndex].profile,
                    academicYear
                }
            };
            return updated;
        });

        this.getAssociatedDepartmentsOnAcademicyear(academicYear);
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
        this.getAssociatedDepartmentsOnAcademicyear(currentProfile.profile.academicYear);
        this.hasUnsavedChanges.set(false);
    }

    saveOriginalUserData(): void {
        if (this.studentForm) {
            this.originalUserData = JSON.parse(JSON.stringify(this.studentForm.value));
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
        if (this.originalUserData && this.studentForm) {
            this.studentForm.patchValue(this.originalUserData);
        }
        this.hasUnsavedUserChanges.set(false);
    }

    onSave(): void {
        this.submitted = true;

        if (this.studentForm.invalid) {
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

        if (!profileData.selectedDepartment || !profileData.selectedClass || !profileData.selectedSection) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please select department, class and section'
            });
            return;
        }

        const updatedStudent = this.tenantUserFormService.getTenantUser(this.studentForm);
        let isStudentProfile = updatedStudent.authorities && updatedStudent.authorities.filter((auth) => auth.name === 'STUDENT').length != 0;
        if (!updatedStudent.id) {
            updatedStudent.passwordHash = 'User@123';
            updatedStudent.branchId = this.commonService.branch?.id || null;
            updatedStudent.status = UserStatus.ACTIVE;
            if (isStudentProfile) {
                updatedStudent.status = profileData.profile.status || UserStatus.ACTIVE;
                updatedStudent.sectionName = profileData.selectedSection?.name || null;
                updatedStudent.className = profileData.selectedClass?.name || null;
                updatedStudent.deptName = profileData.selectedDepartment?.department?.name || null;
            }
        } else {
            let latestDateRange = this.profilesList()[0].dateRange;
            let currentDateRange = profileData.dateRange;
            if (isStudentProfile && latestDateRange[0].getTime() === currentDateRange[0].getTime()) {
                updatedStudent.sectionName = profileData.selectedSection?.name || null;
                updatedStudent.className = profileData.selectedClass?.name || null;
                updatedStudent.deptName = profileData.selectedDepartment?.department?.name || null;
                updatedStudent.status = profileData.profile.status || UserStatus.ACTIVE;
            }
        }

        const profile: IProfileConfig = {
            ...profileData.profile,
            userId: updatedStudent.id?.toString() || null,
            academicYear: profileData.profile.academicYear,
            username: updatedStudent.login,
            email: updatedStudent.email,
            fullName: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
            departments: [profileData.selectedDepartment.id],
            roles: this.generateRoleConfig(updatedStudent.authorities!, profileData)
        };

        this.save.emit({
            user: updatedStudent,
            profile
        });

        this.hasUnsavedChanges.set(false);
        this.hasUnsavedUserChanges.set(false);
        this.saveOriginalProfileData();
        // this.saveOriginalUserData();
    }

    onSaveUser(): void {
        this.submitted = true;

        if (this.studentForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill all required fields in user information'
            });
            return;
        }

        const updatedStudent = this.tenantUserFormService.getTenantUser(this.studentForm);

        if (!updatedStudent.id) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Cannot Save',
                detail: 'User must be created with a profile first. Use "Save Profile" button instead.'
            });
            return;
        }

        if (!updatedStudent.passwordHash || updatedStudent.passwordHash === 'User@123') {
            updatedStudent.passwordHash = null as any;
        }

        this.saveUser.emit(updatedStudent);

        this.hasUnsavedUserChanges.set(false);
        this.saveOriginalUserData();
    }

    generateRoleConfig(authorities: any[], profileData: ProfileUIData): IRoleConfigs {
        const roleConfig: IRoleConfigs | any = {};

        authorities?.forEach((authority) => {
            if (authority?.name === 'STUDENT') {
                roleConfig.student = {
                    classId: profileData.selectedClass?.id ?? null,
                    sectionId: profileData.selectedSection?.id ?? null,
                    sectionName: profileData.selectedSection?.name ?? null,
                    className: profileData.selectedClass?.name ?? null,
                    guardianId: profileData.profile.roles?.student?.guardianId || null
                } as IStudentProfile;
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

    getDateRangeForProfile(index: number): Date[] | null {
        return this.profilesList()[index]?.dateRange || null;
    }
}
