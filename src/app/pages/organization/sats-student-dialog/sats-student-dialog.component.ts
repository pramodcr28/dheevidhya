import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { DheeConfirmationService } from '../../../core/services/dhee-confirmation.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { IStudent, NewStudent } from '../../models/student.model';
import { IProfileConfig } from '../../models/user.model';

@Component({
    selector: 'app-sats-student-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        TabsModule,
        ButtonModule,
        RippleModule,
        InputTextModule,
        SelectModule,
        RadioButtonModule,
        DatePickerModule,
        CheckboxModule,
        TextareaModule,
        ToggleButtonModule,
        DividerModule,
        ToastModule,
        ConfirmDialogModule,
        ConfirmationDialogComponent,
        SelectButtonModule
    ],
    templateUrl: './sats-student-dialog.component.html',
    providers: [MessageService, DheeConfirmationService]
})
export class SatsStudentDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    messageService = inject(MessageService);
    confirmService = inject(DheeConfirmationService);
    commonService = inject(CommonService);
    departmentConfigService = inject(DepartmentConfigService);
    basicMode = true; // default = Basic
    modeOptions = [
        { label: 'Basic', value: true },
        { label: 'All SATS', value: false }
    ];
    @Input() visible: boolean = false;
    today: Date = new Date();

    @Input() set student(val: IStudent | NewStudent) {
        this._student = val;
        this.buildForm(val);
        this.loadDepartments(val);
    }
    get student(): IStudent | NewStudent {
        return this._student;
    }

    @Output() save = new EventEmitter<IStudent | NewStudent>();
    @Output() cancel = new EventEmitter<void>();

    private _student!: IStudent | NewStudent;

    form!: FormGroup;
    submitted = false;
    hasChanges = signal<boolean>(false);
    showAllSats = false;

    // Cascading department → class → section (ngModel-driven, mirrors reference pattern)
    associatedDepartments: any[] = [];
    selectedDepartment: any = null;
    selectedClass: any = null;
    selectedSection: any = null;

    typeOfStudentOptions = [
        { label: 'Same State', value: 'SAME_STATE' },
        { label: 'Other State', value: 'OTHER_STATE' }
    ];
    mediumOptions = [
        { label: 'Kannada', value: 'KANNADA' },
        { label: 'English', value: 'ENGLISH' },
        { label: 'Urdu', value: 'URDU' },
        { label: 'Hindi', value: 'HINDI' },
        { label: 'Tamil', value: 'TAMIL' },
        { label: 'Telugu', value: 'TELUGU' },
        { label: 'Marathi', value: 'MARATHI' }
    ];
    motherTongueOptions = ['Kannada', 'English', 'Urdu', 'Hindi', 'Tamil', 'Telugu', 'Marathi', 'Other'].map((v) => ({ label: v, value: v.toUpperCase() }));
    languageGroupOptions = ['First Language', 'Second Language', 'Third Language'].map((v) => ({ label: v, value: v.toUpperCase().replace(/ /g, '_') }));
    schoolTypeOptions = ['Government', 'Government Aided', 'Private', 'Central Government', 'Other'].map((v) => ({ label: v, value: v.toUpperCase().replace(/ /g, '_') }));
    affiliationOptions = [
        { label: 'KSEEB', value: 'KSEEB' },
        { label: 'CBSE', value: 'CBSE' },
        { label: 'ICSE', value: 'ICSE' },
        { label: 'Other', value: 'OTHER' }
    ];
    genderOptions = [
        { label: 'Male', value: 'MALE' },
        { label: 'Female', value: 'FEMALE' },
        { label: 'Other', value: 'OTHER' }
    ];
    religionOptions = ['Hindu', 'Muslim', 'Christian', 'Jain', 'Sikh', 'Buddhist', 'Other'].map((v) => ({ label: v, value: v.toUpperCase() }));
    nationalityOptions = [
        { label: 'Indian', value: 'INDIAN' },
        { label: 'Other', value: 'OTHER' }
    ];
    socialCategoryOptions = [
        { label: 'General', value: 'GENERAL' },
        { label: 'OBC', value: 'OBC' },
        { label: 'SC', value: 'SC' },
        { label: 'ST', value: 'ST' },
        { label: 'Other Minority', value: 'OTHER_MINORITY' }
    ];
    specialNeedOptions = [
        { label: 'None', value: 'NONE' },
        { label: 'Visual Impairment', value: 'VISUAL' },
        { label: 'Hearing Impairment', value: 'HEARING' },
        { label: 'Locomotor', value: 'LOCOMOTOR' },
        { label: 'Other', value: 'OTHER' }
    ];
    addressTypeOptions = [
        { label: 'Urban', value: 'URBAN' },
        { label: 'Rural', value: 'RURAL' }
    ];
    stateOptions = ['Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 'Kerala', 'Maharashtra', 'Telangana', 'Goa', 'Gujarat', 'Rajasthan', 'Other'].map((v) => ({ label: v, value: v.toUpperCase().replace(/ /g, '_') }));

    academicYearOptions = (() => {
        const opts = [];
        const y = new Date().getFullYear();
        for (let i = y - 2; i <= y + 1; i++) opts.push({ label: `${i}-${i + 1}`, value: `${i}-${i + 1}` });
        return opts;
    })();

    ngOnInit(): void {
        if (!this.form) this.buildForm(this._student);
    }

    buildForm(s: IStudent | NewStudent): void {
        const sd = s?.studentDetails;
        const ad = s?.admissionDetails;
        const ps = s?.previousSchoolDetails;
        const cd = s?.contactDetails;
        const bd = s?.bankDetails;
        const ca = cd?.currentAddress;
        const pa = cd?.permanentAddress;

        // Extract the plain academic year string from IProfileConfig
        const academicYearStr = s?.latestAcademicYear?.academicYear ?? null;
        this.form = this.fb.group({
            academicYear: [academicYearStr],
            login: [s?.login],
            satsNumber: [s?.satsNumber, Validators.required],
            typeOfStudent: [ad?.typeOfStudent ?? null],
            detailDescription: [ad?.detailDescription ?? null],
            mediumOfInstruction: [ad?.mediumOfInstruction ?? null],
            motherTongue: [ad?.motherTongue ?? null],
            languageGroup: [ad?.languageGroup ?? null],
            affiliation: [ps?.affiliation ?? null],
            tcNo: [ps?.transferCertificateNo ?? null],
            tcDate: [ps?.transferCertificateDate ? new Date(ps.transferCertificateDate) : null],
            prevSchoolName: [this.commonService.branch.name ?? null],
            prevSchoolType: [ps?.schoolType ?? null],
            prevSchoolAddress: [ps?.schoolAddress ?? null],
            prevPinCode: [ps?.pinCode ?? null],
            prevState: [ps?.state ?? null],
            stdFirstName: [sd?.studentName?.firstName ?? null, Validators.required],
            stdMiddleName: [sd?.studentName?.middleName ?? null],
            stdLastName: [sd?.studentName?.lastName ?? null],
            stdFirstNameKn: [sd?.studentNameKannada?.firstName ?? null],
            stdLastNameKn: [sd?.studentNameKannada?.lastName ?? null],
            fatherFirstName: [sd?.fatherName?.firstName ?? null],
            fatherLastName: [sd?.fatherName?.lastName ?? null],
            fatherFirstNameKn: [sd?.fatherNameKannada?.firstName ?? null],
            fatherLastNameKn: [sd?.fatherNameKannada?.lastName ?? null],
            motherFirstName: [sd?.motherName?.firstName ?? null],
            motherLastName: [sd?.motherName?.lastName ?? null],
            motherFirstNameKn: [sd?.motherNameKannada?.firstName ?? null],
            motherLastNameKn: [sd?.motherNameKannada?.lastName ?? null],
            dob: [sd?.dateOfBirth ? new Date(sd.dateOfBirth) : null, Validators.required],
            age: [sd?.age ?? null],
            ageReason: [sd?.ageReason ?? null],
            gender: [sd?.gender ?? null, Validators.required],
            religion: [sd?.religion ?? null],
            nationality: [sd?.nationality ?? 'INDIAN'],
            aadhaar: [sd?.aadhaarNumber ?? null, [Validators.pattern(/^\d{12}$/)]],
            fatherAadhaar: [sd?.fatherAadhaar ?? null],
            motherAadhaar: [sd?.motherAadhaar ?? null],
            socialCategory: [sd?.socialCategory ?? null],
            studentCasteCertNo: [sd?.casteDetails?.studentCasteCertificateNo ?? null],
            fatherCasteCertNo: [sd?.casteDetails?.fatherCasteCertificateNo ?? null],
            motherCasteCertNo: [sd?.casteDetails?.motherCasteCertificateNo ?? null],
            belongsToBPL: [sd?.belongsToBPL ?? false],
            bplCardNumber: [sd?.bplCardNumber ?? null],
            bhagyalakshmiBondNo: [sd?.bhagyalakshmiBondNo ?? null],
            childWithSpecialNeed: [sd?.childWithSpecialNeed ?? 'NONE'],
            specialCategory: [sd?.specialCategory ?? null],

            // Contact
            admissionDate: [cd?.admissionDate ? new Date(cd.admissionDate) : null],
            studentEmail: [cd?.studentEmail ?? null, Validators.email],
            fatherMobile: [cd?.fatherMobile ?? null, [Validators.pattern(/^\d{10}$/)]],
            motherMobile: [cd?.motherMobile ?? null, [Validators.pattern(/^\d{10}$/)]],
            curAddressType: [ca?.type ?? null],
            curPinCode: [ca?.pinCode ?? null],
            curDistrict: [ca?.district ?? null],
            curLocalBody: [ca?.localBody ?? null],
            curWard: [ca?.ward ?? null],
            curLocality: [ca?.locality ?? null],
            curAddressLine: [ca?.addressLine ?? null],
            sameAsCurrent: [false],
            perAddressType: [pa?.type ?? null],
            perPinCode: [pa?.pinCode ?? null],
            perDistrict: [pa?.district ?? null],
            perLocalBody: [pa?.localBody ?? null],
            perWard: [pa?.ward ?? null],
            perLocality: [pa?.locality ?? null],
            perAddressLine: [pa?.addressLine ?? null],

            // Bank
            bankName: [bd?.bankName ?? null],
            accountNumber: [bd?.accountNumber ?? null],
            ifscCode: [bd?.ifscCode ?? null]
        });

        this.form.valueChanges.subscribe(() => this.hasChanges.set(true));
    }

    copyCurrentToPermanent(): void {
        const v = this.form.value;
        this.form.patchValue({
            perAddressType: v.curAddressType,
            perPinCode: v.curPinCode,
            perDistrict: v.curDistrict,
            perLocalBody: v.curLocalBody,
            perWard: v.curWard,
            perLocality: v.curLocality,
            perAddressLine: v.curAddressLine
        });
    }

    loadDepartments(student: IStudent | NewStudent | null): void {
        const isITAdmin = this.commonService?.getUserAuthorities?.includes('IT_ADMINISTRATOR');

        if (isITAdmin) {
            const filterParams = {
                branch: this.commonService.branch?.id
            };

            this.departmentConfigService.search(0, 100, 'id', 'ASC', filterParams).subscribe({
                next: (res: any) => {
                    this.associatedDepartments = res.content.map((re: any) => ({
                        ...re,
                        name: re.department.name
                    }));
                },
                error: () => {}
            });
        } else {
            this.associatedDepartments = this.commonService.associatedDepartments;
        }

        if (student?.latestAcademicYear?.roles?.student) {
            const role = student.latestAcademicYear.roles.student;
            const deptId = student.latestAcademicYear.departments?.[0];
            this.selectedDepartment = this.associatedDepartments.find((d) => d.id === deptId) ?? null;

            if (this.selectedDepartment) {
                this.selectedClass = this.selectedDepartment.department?.classes?.find((c: any) => c.id === role.classId) ?? null;

                if (this.selectedClass) {
                    this.selectedSection = this.selectedClass.sections?.find((s: any) => s.id === role.sectionId) ?? null;
                }
            }
        }
    }

    onDepartmentChange(): void {
        this.selectedClass = null;
        this.selectedSection = null;
        this.hasChanges.set(true);
    }

    onClassChange(): void {
        this.selectedSection = null;
        this.hasChanges.set(true);
    }

    private buildLatestAcademicYear(v: any): IProfileConfig {
        const existing = this._student?.latestAcademicYear;

        return {
            id: existing?.id ?? null,

            userId: existing?.userId ?? null,

            academicYear: v.academicYear ?? null,

            username: v.login ?? null,
            email: existing?.email ?? null,

            fullName: [v.stdFirstName, v.stdMiddleName, v.stdLastName].filter((x: string) => x && x.trim()).join(' '),

            contactNumber: existing?.contactNumber ?? null,
            reportsTo: existing?.reportsTo ?? null,

            gender: v.gender ?? existing?.gender ?? null,

            profileType: existing?.profileType ?? 'STUDENT',

            departments: this.selectedDepartment ? [this.selectedDepartment.id] : (existing?.departments ?? []),

            subjectIds: existing?.subjectIds ?? null,

            status: existing?.status ?? null,

            roles: {
                ...existing?.roles,

                student: {
                    classId: this.selectedClass?.id ?? existing?.roles?.student?.classId ?? null,
                    deptId: this.selectedDepartment.department.id ?? existing?.roles?.student?.deptId ?? null,
                    deptName: this.selectedDepartment.department.name ?? existing?.roles?.student?.deptName ?? null,
                    sectionId: this.selectedSection?.id ?? existing?.roles?.student?.sectionId ?? null,
                    className: this.selectedClass?.name ?? existing?.roles?.student?.className ?? null,
                    sectionName: this.selectedSection?.name ?? existing?.roles?.student?.sectionName ?? null,
                    rollNumber: existing?.roles?.student?.rollNumber ?? null,
                    guardianId: existing?.roles?.student?.guardianId ?? null
                }
            }
        };
    }

    onSave(): void {
        this.submitted = true;
        if (!this.selectedDepartment || !this.selectedClass || !this.selectedSection) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please select Department, Class, and Section'
            });
            return;
        }
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill all required fields'
            });
            return;
        }
        const v = this.form.value;
        const student: IStudent | NewStudent = {
            ...(this._student?.id ? { id: (this._student as IStudent).id } : { id: null }),
            branchId: this.commonService.branch?.id ?? null,
            branchCode: this.commonService.branch?.code,
            satsNumber: v.satsNumber,
            login: v.login,
            authorities: this._student?.authorities ?? [],
            latestAcademicYear: this.buildLatestAcademicYear(v),
            admissionDetails: {
                typeOfStudent: v.typeOfStudent,
                detailDescription: v.detailDescription,
                admissionClass: this.selectedClass?.name ?? null,
                section: this.selectedSection?.name ?? null,
                mediumOfInstruction: v.mediumOfInstruction,
                motherTongue: v.motherTongue,
                languageGroup: v.languageGroup
            },

            previousSchoolDetails: {
                affiliation: v.affiliation,
                transferCertificateNo: v.tcNo,
                transferCertificateDate: v.tcDate ? (v.tcDate as Date).toISOString().split('T')[0] : null,
                schoolName: v.prevSchoolName,
                schoolType: v.prevSchoolType,
                schoolAddress: v.prevSchoolAddress,
                pinCode: v.prevPinCode,
                state: v.prevState
            },

            studentDetails: {
                studentName: { firstName: v.stdFirstName, middleName: v.stdMiddleName, lastName: v.stdLastName },
                studentNameKannada: { firstName: v.stdFirstNameKn, middleName: null, lastName: v.stdLastNameKn },
                fatherName: { firstName: v.fatherFirstName, middleName: null, lastName: v.fatherLastName },
                fatherNameKannada: { firstName: v.fatherFirstNameKn, middleName: null, lastName: v.fatherLastNameKn },
                motherName: { firstName: v.motherFirstName, middleName: null, lastName: v.motherLastName },
                motherNameKannada: { firstName: v.motherFirstNameKn, middleName: null, lastName: v.motherLastNameKn },
                dateOfBirth: v.dob ? (v.dob as Date).toISOString().split('T')[0] : null,
                age: v.age,
                ageReason: v.ageReason,
                gender: v.gender,
                religion: v.religion,
                nationality: v.nationality,
                aadhaarNumber: v.aadhaar,
                fatherAadhaar: v.fatherAadhaar,
                motherAadhaar: v.motherAadhaar,
                socialCategory: v.socialCategory,
                casteDetails: {
                    studentCasteCertificateNo: v.studentCasteCertNo,
                    fatherCasteCertificateNo: v.fatherCasteCertNo,
                    motherCasteCertificateNo: v.motherCasteCertNo
                },
                belongsToBPL: v.belongsToBPL,
                bplCardNumber: v.bplCardNumber,
                bhagyalakshmiBondNo: v.bhagyalakshmiBondNo,
                childWithSpecialNeed: v.childWithSpecialNeed,
                specialCategory: v.specialCategory
            },

            contactDetails: {
                admissionDate: v.admissionDate ? (v.admissionDate as Date).toISOString().split('T')[0] : null,
                studentEmail: v.studentEmail,
                fatherMobile: v.fatherMobile,
                motherMobile: v.motherMobile,
                currentAddress: {
                    type: v.curAddressType,
                    pinCode: v.curPinCode,
                    district: v.curDistrict,
                    localBody: v.curLocalBody,
                    ward: v.curWard,
                    locality: v.curLocality,
                    addressLine: v.curAddressLine
                },
                permanentAddress: {
                    type: v.perAddressType,
                    pinCode: v.perPinCode,
                    district: v.perDistrict,
                    localBody: v.perLocalBody,
                    ward: v.perWard,
                    locality: v.perLocality,
                    addressLine: v.perAddressLine
                }
            },

            bankDetails: {
                bankName: v.bankName,
                accountNumber: v.accountNumber,
                ifscCode: v.ifscCode
            }
        };
        if (!student.latestAcademicYear.academicYear) {
            student.latestAcademicYear.academicYear = this.commonService.currentUser.academicYear;
        }

        this.save.emit(student);
        this.hasChanges.set(false);
    }

    onCancel(): void {
        if (this.hasChanges()) {
            this.confirmService.confirm({
                message: 'You have unsaved changes. Discard them?',
                header: 'Unsaved Changes',
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.cancel.emit()
            });
        } else {
            this.cancel.emit();
        }
    }

    fieldError(ctrl: string): boolean {
        const c = this.form.get(ctrl);
        return !!(c?.invalid && (this.submitted || c.touched));
    }
}
