import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import * as XLSX from 'xlsx';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { StudentExcelRow, StudentSatsExcelRow, UploadMode, ValidationResult } from '../../models/bulk-student-upload.model';
import { UserService } from '../../service/user.service';

@Component({
    selector: 'app-bulk-student-upload',
    standalone: true,
    imports: [CommonModule, TooltipModule, FormsModule, ButtonModule, DialogModule, FileUploadModule, TableModule, TagModule, ToastModule, ProgressBarModule, CardModule, SelectModule, SelectButtonModule],
    providers: [MessageService],
    templateUrl: './bulk-student-upload.component.html'
})
export class BulkStudentUploadComponent implements OnInit {
    private userService = inject(UserService);
    private messageService = inject(MessageService);
    private loader = inject(ApiLoaderService);
    public commonService = inject(CommonService);
    router = inject(Router);
    departmentConfigService = inject(DepartmentConfigService);

    // ── Signals ──────────────────────────────────────────────────────────────
    uploadedStudents = signal<StudentExcelRow[]>([]);
    isProcessing = signal(false);

    // ── Upload mode ───────────────────────────────────────────────────────────
    uploadMode: UploadMode = 'basic';
    uploadModeOptions = [
        { label: 'Basic', value: 'basic' },
        { label: 'Full SATS', value: 'sats' }
    ];

    // ── Dialog / selection state ──────────────────────────────────────────────
    showConfirmDialog = false;
    showStudentDetailDialog = false;
    selectedStudentDetail: StudentExcelRow | null = null;
    submitted = false;
    selectedDepartment: any;
    selectedClass: any;
    selectedSection: any;
    associatedDepartments: any[] = [];

    // ── Derived counts ────────────────────────────────────────────────────────
    validCount = () => this.uploadedStudents().filter((s) => s.isValid).length;
    invalidCount = () => this.uploadedStudents().filter((s) => !s.isValid).length;

    ngOnInit(): void {
        this.getAssociatedDepartments();
    }

    // ── Department list ───────────────────────────────────────────────────────
    getAssociatedDepartments(): void {
        const filterParams = { branch: this.commonService.branch?.id };
        this.departmentConfigService.search(0, 100, 'id', 'ASC', filterParams).subscribe((res) => {
            this.associatedDepartments = res.content.map((re: any) => ({
                ...re,
                name: re.department.name
            }));
        });
    }

    // ── Template download ─────────────────────────────────────────────────────
    downloadTemplate(): void {
        if (this.uploadMode === 'basic') {
            this.downloadBasicTemplate();
        } else {
            this.downloadSatsTemplate();
        }
    }

    private downloadBasicTemplate(): void {
        const sample = [
            {
                satsNumber: 'STU001',
                firstName: 'Ravi',
                middleName: '',
                lastName: 'Kumar',
                gender: 'MALE',
                dateOfBirth: '2010-06-15',
                email: 'ravi@example.com',
                studentContactNumber: '9999999999',
                password: 'User@123',
                // Current address
                addressLine: '123, Main Street',
                locality: 'Downtown',
                district: 'Mandya',
                state: 'Karnataka',
                pinCode: '560001',
                country: 'India',
                // Parents
                fatherFirstName: 'Suresh',
                fatherLastName: 'Kumar',
                fatherMobile: '9888888888',
                motherFirstName: 'Latha',
                motherLastName: 'Kumar',
                motherMobile: '9777777777'
            }
        ];
        this.writeExcel(sample, 'Student_Basic_Template.xlsx');
        this.messageService.add({ severity: 'success', summary: 'Downloaded', detail: 'Basic template downloaded' });
    }

    private downloadSatsTemplate(): void {
        const sample = [
            {
                // Basic
                satsNumber: 'SATS001',
                firstName: 'Ravi',
                middleName: '',
                lastName: 'Kumar',
                gender: 'MALE',
                dateOfBirth: '2010-06-15',
                email: 'ravi@example.com',
                studentContactNumber: '9999999999',
                password: 'User@123',
                // SATS identity
                stdFirstNameKn: 'ರವಿ',
                stdLastNameKn: 'ಕುಮಾರ್',
                aadhaarNumber: '123412341234',
                religion: 'HINDU',
                nationality: 'INDIAN',
                socialCategory: 'GENERAL',
                belongsToBPL: false,
                bplCardNumber: '',
                bhagyalakshmiBondNo: '',
                childWithSpecialNeed: 'NONE',
                specialCategory: '',
                studentCasteCertNo: '',
                // Father
                fatherFirstName: 'Suresh',
                fatherLastName: 'Kumar',
                fatherFirstNameKn: 'ಸುರೇಶ್',
                fatherLastNameKn: 'ಕುಮಾರ್',
                fatherMobile: '9888888888',
                fatherAadhaar: '432143214321',
                fatherCasteCertNo: '',
                // Mother
                motherFirstName: 'Latha',
                motherLastName: 'Kumar',
                motherFirstNameKn: 'ಲತಾ',
                motherLastNameKn: 'ಕುಮಾರ್',
                motherMobile: '9777777777',
                motherAadhaar: '567856785678',
                motherCasteCertNo: '',
                // Admission
                typeOfStudent: 'SAME_STATE',
                mediumOfInstruction: 'KANNADA',
                motherTongue: 'KANNADA',
                languageGroup: 'FIRST_LANGUAGE',
                admissionDate: '2024-06-01',
                // Previous school
                affiliation: 'KSEEB',
                tcNo: 'TC12345',
                tcDate: '2024-05-30',
                prevSchoolName: 'ABC School',
                prevSchoolType: 'GOVERNMENT',
                prevSchoolAddress: 'XYZ Road, Mysore',
                prevPinCode: '570001',
                prevState: 'KARNATAKA',
                // Current address
                addressLine: '123, Main Street',
                locality: 'Downtown',
                district: 'Mandya',
                state: 'Karnataka',
                pinCode: '560001',
                country: 'India',
                // Permanent address
                perAddressLine: '456, Park Lane',
                perLocality: 'Uptown',
                perDistrict: 'Mysore',
                perState: 'Karnataka',
                perPinCode: '570002',
                // Bank
                bankName: 'SBI',
                accountNumber: '123456789012',
                ifscCode: 'SBIN0001234'
            }
        ];
        this.writeExcel(sample, 'Student_SATS_Template.xlsx');
        this.messageService.add({ severity: 'success', summary: 'Downloaded', detail: 'Full SATS template downloaded' });
    }

    private writeExcel(data: any[], filename: string): void {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, filename);
    }

    // ── File upload ───────────────────────────────────────────────────────────
    onFileSelect(event: any): void {
        const file = event.files[0];
        if (!file) return;

        this.isProcessing.set(true);
        const reader = new FileReader();

        reader.onload = (e: any) => {
            try {
                const wb = XLSX.read(e.target.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(ws);
                this.processExcelData(jsonData);
            } catch {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to process Excel file' });
                this.isProcessing.set(false);
            }
        };

        reader.readAsBinaryString(file);
    }

    // ── Process rows ──────────────────────────────────────────────────────────
    processExcelData(data: any[]): void {
        const selectedDeptInfo = this.associatedDepartments.find((d) => d.department?.name?.toLowerCase() === this.selectedDepartment?.department?.name?.toLowerCase());

        const students: StudentExcelRow[] = data.map((row, index) => {
            const str = (val: any) => val?.toString().trim() ?? '';

            // ── Basic fields (always mapped) ──────────────────────────────────
            const student: StudentExcelRow = {
                rowNumber: index + 2,
                satsNumber: str(row.satsNumber),
                firstName: str(row.firstName),
                middleName: str(row.middleName),
                lastName: str(row.lastName),
                gender: str(row.gender).toUpperCase(),
                dateOfBirth: str(row.dateOfBirth),
                email: str(row.email),
                studentContactNumber: str(row.studentContactNumber),
                password: str(row.password) || 'User@123',
                addressLine: str(row.addressLine),
                locality: str(row.locality),
                district: str(row.district),
                state: str(row.state),
                pinCode: str(row.pinCode),
                country: str(row.country),
                fatherFirstName: str(row.fatherFirstName),
                fatherLastName: str(row.fatherLastName),
                fatherMobile: str(row.fatherMobile),
                motherFirstName: str(row.motherFirstName),
                motherLastName: str(row.motherLastName),
                motherMobile: str(row.motherMobile)
            };

            // ── SATS-only fields ──────────────────────────────────────────────
            if (this.uploadMode === 'sats') {
                const satsStudent = student as StudentSatsExcelRow;
                satsStudent.satsNumber = str(row.satsNumber);
                satsStudent.stdFirstNameKn = str(row.stdFirstNameKn);
                satsStudent.stdLastNameKn = str(row.stdLastNameKn);
                satsStudent.aadhaarNumber = str(row.aadhaarNumber);
                satsStudent.religion = str(row.religion);
                satsStudent.nationality = str(row.nationality) || 'INDIAN';
                satsStudent.socialCategory = str(row.socialCategory);
                satsStudent.belongsToBPL = row.belongsToBPL === true || str(row.belongsToBPL).toLowerCase() === 'true';
                satsStudent.bplCardNumber = str(row.bplCardNumber);
                satsStudent.bhagyalakshmiBondNo = str(row.bhagyalakshmiBondNo);
                satsStudent.childWithSpecialNeed = str(row.childWithSpecialNeed) || 'NONE';
                satsStudent.specialCategory = str(row.specialCategory);
                satsStudent.studentCasteCertNo = str(row.studentCasteCertNo);
                satsStudent.fatherFirstNameKn = str(row.fatherFirstNameKn);
                satsStudent.fatherLastNameKn = str(row.fatherLastNameKn);
                satsStudent.fatherAadhaar = str(row.fatherAadhaar);
                satsStudent.fatherCasteCertNo = str(row.fatherCasteCertNo);
                satsStudent.motherFirstNameKn = str(row.motherFirstNameKn);
                satsStudent.motherLastNameKn = str(row.motherLastNameKn);
                satsStudent.motherAadhaar = str(row.motherAadhaar);
                satsStudent.motherCasteCertNo = str(row.motherCasteCertNo);
                satsStudent.typeOfStudent = str(row.typeOfStudent);
                satsStudent.mediumOfInstruction = str(row.mediumOfInstruction);
                satsStudent.motherTongue = str(row.motherTongue);
                satsStudent.languageGroup = str(row.languageGroup);
                satsStudent.admissionDate = str(row.admissionDate);
                satsStudent.affiliation = str(row.affiliation);
                satsStudent.tcNo = str(row.tcNo);
                satsStudent.tcDate = str(row.tcDate);
                satsStudent.prevSchoolName = str(row.prevSchoolName);
                satsStudent.prevSchoolType = str(row.prevSchoolType);
                satsStudent.prevSchoolAddress = str(row.prevSchoolAddress);
                satsStudent.prevPinCode = str(row.prevPinCode);
                satsStudent.prevState = str(row.prevState);
                satsStudent.perAddressLine = str(row.perAddressLine);
                satsStudent.perLocality = str(row.perLocality);
                satsStudent.perDistrict = str(row.perDistrict);
                satsStudent.perState = str(row.perState);
                satsStudent.perPinCode = str(row.perPinCode);
                satsStudent.bankName = str(row.bankName);
                satsStudent.accountNumber = str(row.accountNumber);
                satsStudent.ifscCode = str(row.ifscCode);
            }

            if (selectedDeptInfo) {
                (student as any).departments = [selectedDeptInfo.id];
            }

            const validation = this.validateStudent(student);
            student.isValid = validation.isValid;
            student.errors = validation.errors;

            return student;
        });

        this.uploadedStudents.set(students);
        this.isProcessing.set(false);

        this.messageService.add({
            severity: 'info',
            summary: 'Processing Complete',
            detail: `Found ${students.length} students. Valid: ${this.validCount()}, Invalid: ${this.invalidCount()}`
        });
    }

    // ── Validation ────────────────────────────────────────────────────────────
    validateStudent(student: StudentExcelRow): ValidationResult {
        const errors: string[] = [];

        if (!student.satsNumber) errors.push('SATS Number is required');
        if (!student.firstName) errors.push('First Name is required');
        if (!student.lastName) errors.push('Last Name is required');
        if (!['MALE', 'FEMALE', 'OTHER'].includes(student.gender ?? '')) {
            errors.push('Gender must be MALE, FEMALE, or OTHER');
        }
        if (student.email && !this.isValidEmail(student.email)) {
            errors.push('Email format is invalid');
        }
        if (student.studentContactNumber && isNaN(Number(student.studentContactNumber))) {
            errors.push('Contact Number must be numeric');
        }
        if (!student.district) errors.push('District is required');
        if (!student.state) errors.push('State is required');
        if (!student.pinCode) errors.push('PIN Code is required');

        // Extra SATS validations
        if (this.uploadMode === 'sats') {
            const s = student as StudentSatsExcelRow;
            if (!s.satsNumber) errors.push('SATS Number is required in SATS mode');
            if (s.aadhaarNumber && !/^\d{12}$/.test(s.aadhaarNumber)) {
                errors.push('Aadhaar Number must be 12 digits');
            }
        }

        return { student, isValid: errors.length === 0, errors };
    }

    isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ── Detail dialog ─────────────────────────────────────────────────────────
    openStudentDetails(student: StudentExcelRow): void {
        this.selectedStudentDetail = student;
        this.showStudentDetailDialog = true;
    }

    get isSatsDetail(): boolean {
        return this.uploadMode === 'sats';
    }

    // ── Save flow ─────────────────────────────────────────────────────────────
    confirmSave(): void {
        this.submitted = true;
        if (!this.selectedDepartment || !this.selectedClass || !this.selectedSection) {
            this.messageService.add({ severity: 'error', summary: 'Missing Selection', detail: 'Please select Department, Class, and Section.' });
            return;
        }
        if (this.validCount() === 0) {
            this.messageService.add({ severity: 'warn', summary: 'No Valid Students', detail: 'There are no valid students to save.' });
            return;
        }
        this.showConfirmDialog = true;
    }

    saveAllStudents(): void {
        this.showConfirmDialog = false;
        const validStudents = this.uploadedStudents().filter((s) => s.isValid);

        this.loader.show('Saving students...');

        const studentsPayload = validStudents.map(({ errors, isValid, rowNumber, errorMessage, ...rest }) => rest);

        const payload = {
            students: studentsPayload,
            uploadMode: this.uploadMode,
            branchId: this.commonService?.branch?.id,
            departmentId: this.selectedDepartment?.id,
            departmentName: this.selectedDepartment?.department?.name,
            classId: this.selectedClass?.id,
            className: this.selectedClass?.name,
            sectionId: this.selectedSection?.id,
            sectionName: this.selectedSection?.name,
            academicYear: this.selectedDepartment?.academicYear
        };

        this.userService.bulkCreateStudents(payload).subscribe({
            next: (response: any) => {
                this.loader.hide();

                if (response.failureCount > 0) {
                    const updated = this.uploadedStudents().map((uploaded) => {
                        const failed = response.failedStudents?.find((fs: any) => fs.satsNumber === uploaded.satsNumber);
                        if (failed) {
                            const errInfo = response.errors?.find((e: any) => e.satsNumber === failed.satsNumber);
                            return { ...uploaded, isValid: false, errorMessage: errInfo?.errorMessage || 'Unknown error', errors: [] };
                        }
                        return uploaded;
                    });

                    this.uploadedStudents.set(updated);
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Partial Success',
                        detail: `Created ${response.successCount} students. ${response.failureCount} failed.`,
                        life: 5000
                    });
                } else {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: `Successfully created ${response.successCount} students` });
                    setTimeout(() => this.goBack(), 2000);
                }
            },
            error: (error) => {
                this.loader.hide();
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Failed to save students.' });
            }
        });
    }

    resetUpload(): void {
        this.uploadedStudents.set([]);
    }

    goBack(): void {
        this.router.navigate(['/stats-student-list']);
    }
}
