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

    uploadedStudents = signal<StudentExcelRow[]>([]);
    isProcessing = signal(false);

    uploadMode: UploadMode = 'basic';
    uploadModeOptions = [
        { label: 'Basic', value: 'basic' },
        { label: 'Full SATS', value: 'sats' }
    ];

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

    private readonly SATS_INDICATOR_COLUMNS = ['aadhaarNumber', 'stdFirstNameKn', 'socialCategory', 'fatherAadhaar', 'motherAadhaar', 'admissionDate', 'ifscCode', 'perPinCode', 'belongsToBPL', 'religion', 'typeOfStudent'] as const;

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

    private detectModeFromExcel(firstRow: any): UploadMode {
        if (!firstRow) return 'basic';
        const keys = Object.keys(firstRow);
        const hasSatsColumns = this.SATS_INDICATOR_COLUMNS.some((col) => keys.includes(col));
        return hasSatsColumns ? 'sats' : 'basic';
    }

    // ── File select ───────────────────────────────────────────────────────────
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

    private parseExcelDate(value: any): string | null {
        if (!value) return null;

        // Case 1: Already a Date object
        if (value instanceof Date) {
            return this.formatDate(value);
        }

        // Case 2: Excel serial number
        if (typeof value === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + value * 86400000);
            return this.formatDate(date);
        }

        // Case 3: String date
        if (typeof value === 'string') {
            const parsed = new Date(value);
            if (!isNaN(parsed.getTime())) {
                return this.formatDate(parsed);
            }
        }

        return null;
    }

    private formatDate(date: Date): string {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`; // ISO format (recommended)
    }
    // ── Process Excel ─────────────────────────────────────────────────────────
    processExcelData(data: any[]): void {
        if (!data.length) {
            this.messageService.add({ severity: 'warn', summary: 'Empty File', detail: 'The uploaded file has no data rows.' });
            this.isProcessing.set(false);
            return;
        }

        // ── Auto-detect mode from the Excel columns ───────────────────────────
        const detectedMode = this.detectModeFromExcel(data[0]);

        if (detectedMode !== this.uploadMode) {
            // Silently upgrade — never downgrade (basic selected but sats file uploaded)
            this.uploadMode = detectedMode;
            this.messageService.add({
                severity: 'warn',
                summary: 'Upload Mode Changed',
                detail: `Excel contains SATS columns — mode automatically switched to "${detectedMode === 'sats' ? 'Full SATS' : 'Basic'}".`,
                life: 6000
            });
        }

        const selectedDeptInfo = this.associatedDepartments.find((d) => d.department?.name?.toLowerCase() === this.selectedDepartment?.department?.name?.toLowerCase());

        const seenSatsNumbers = new Set<string>();
        const students: StudentExcelRow[] = data.map((row, index) => {
            const str = (val: any): string => (val != null ? val.toString().trim() : '');

            const student: StudentExcelRow = {
                rowNumber: index + 2,
                satsNumber: str(row.satsNumber),
                firstName: str(row.firstName),
                middleName: str(row.middleName),
                lastName: str(row.lastName),
                gender: str(row.gender).toUpperCase(),
                dateOfBirth: this.parseExcelDate(row.dateOfBirth),
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

            // ── SATS extended fields (mapped when mode = sats) ────────────────
            if (this.uploadMode === 'sats') {
                const s = student as StudentSatsExcelRow;
                s.stdFirstNameKn = str(row.stdFirstNameKn);
                s.stdLastNameKn = str(row.stdLastNameKn);
                s.aadhaarNumber = str(row.aadhaarNumber);
                s.religion = str(row.religion);
                s.nationality = str(row.nationality) || 'INDIAN';
                s.socialCategory = str(row.socialCategory);
                s.belongsToBPL = row.belongsToBPL === true || str(row.belongsToBPL).toLowerCase() === 'true';
                s.bplCardNumber = str(row.bplCardNumber);
                s.bhagyalakshmiBondNo = str(row.bhagyalakshmiBondNo);
                s.childWithSpecialNeed = str(row.childWithSpecialNeed) || 'NONE';
                s.specialCategory = str(row.specialCategory);
                s.studentCasteCertNo = str(row.studentCasteCertNo);
                s.fatherFirstNameKn = str(row.fatherFirstNameKn);
                s.fatherLastNameKn = str(row.fatherLastNameKn);
                s.fatherAadhaar = str(row.fatherAadhaar);
                s.fatherCasteCertNo = str(row.fatherCasteCertNo);
                s.motherFirstNameKn = str(row.motherFirstNameKn);
                s.motherLastNameKn = str(row.motherLastNameKn);
                s.motherAadhaar = str(row.motherAadhaar);
                s.motherCasteCertNo = str(row.motherCasteCertNo);
                s.typeOfStudent = str(row.typeOfStudent);
                s.mediumOfInstruction = str(row.mediumOfInstruction);
                s.motherTongue = str(row.motherTongue);
                s.languageGroup = str(row.languageGroup);
                s.admissionDate = this.parseExcelDate(row.admissionDate);
                s.affiliation = str(row.affiliation);
                s.tcNo = str(row.tcNo);
                s.tcDate = this.parseExcelDate(row.tcDate);
                s.prevSchoolName = str(row.prevSchoolName);
                s.prevSchoolType = str(row.prevSchoolType);
                s.prevSchoolAddress = str(row.prevSchoolAddress);
                s.prevPinCode = str(row.prevPinCode);
                s.prevState = str(row.prevState);
                s.perAddressLine = str(row.perAddressLine);
                s.perLocality = str(row.perLocality);
                s.perDistrict = str(row.perDistrict);
                s.perState = str(row.perState);
                s.perPinCode = str(row.perPinCode);
                s.bankName = str(row.bankName);
                s.accountNumber = str(row.accountNumber);
                s.ifscCode = str(row.ifscCode);
            }

            if (selectedDeptInfo) {
                (student as any).departments = [selectedDeptInfo.id];
            }

            // ── Cross-row duplicate check (within this upload batch) ──────────
            const validation = this.validateStudent(student, seenSatsNumbers);
            student.isValid = validation.isValid;
            student.errors = validation.errors;

            if (student.satsNumber) {
                seenSatsNumbers.add(student.satsNumber);
            }

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
    validateStudent(student: StudentExcelRow, seenSatsNumbers?: Set<string>): ValidationResult {
        const errors: string[] = [];
        // ── Required core fields ──────────────────────────────────────────────
        if (!student.satsNumber) {
            errors.push('SATS Number is required');
        } else if (seenSatsNumbers?.has(student.satsNumber)) {
            errors.push(`Duplicate SATS Number "${student.satsNumber}" found in this file`);
        }

        if (!student.firstName) errors.push('First Name is required');
        if (!student.lastName) errors.push('Last Name is required');
        if (!student.district) errors.push('District is required');
        if (!student.state) errors.push('State is required');

        // ── Gender ────────────────────────────────────────────────────────────
        if (!['MALE', 'FEMALE', 'OTHER'].includes(student.gender ?? '')) {
            errors.push('Gender must be MALE, FEMALE, or OTHER');
        }
        debugger;
        // ── Date of Birth ─────────────────────────────────────────────────────
        if (student.dateOfBirth) {
            const dob = new Date(student.dateOfBirth);
            if (isNaN(dob.getTime())) {
                errors.push('Date of Birth is not a valid date (expected YYYY-MM-DD)');
            } else if (dob > new Date()) {
                errors.push('Date of Birth cannot be a future date');
            }
        }

        // ── Email ─────────────────────────────────────────────────────────────
        if (student.email && !this.isValidEmail(student.email)) {
            errors.push('Email format is invalid');
        }

        // ── Student contact: exactly 10 numeric digits ────────────────────────
        if (student.studentContactNumber && !/^\d{10}$/.test(student.studentContactNumber)) {
            errors.push('Contact Number must be exactly 10 numeric digits');
        }

        // ── Current address PIN Code: exactly 6 digits ────────────────────────
        if (student.pinCode && !/^\d{6}$/.test(student.pinCode)) {
            errors.push('PIN Code must be exactly 6 digits');
        }

        // ── Father / Mother mobile: exactly 10 numeric digits ────────────────
        if (student.fatherMobile && !/^\d{10}$/.test(student.fatherMobile)) {
            errors.push('Father Mobile must be exactly 10 numeric digits');
        }
        if (student.motherMobile && !/^\d{10}$/.test(student.motherMobile)) {
            errors.push('Mother Mobile must be exactly 10 numeric digits');
        }

        // ── SATS-only validations ─────────────────────────────────────────────
        if (this.uploadMode === 'sats') {
            const s = student as StudentSatsExcelRow;

            // Aadhaar numbers: exactly 12 digits
            if (s.aadhaarNumber && !/^\d{12}$/.test(s.aadhaarNumber)) {
                errors.push('Aadhaar Number must be exactly 12 digits');
            }
            if (s.fatherAadhaar && !/^\d{12}$/.test(s.fatherAadhaar)) {
                errors.push('Father Aadhaar Number must be exactly 12 digits');
            }
            if (s.motherAadhaar && !/^\d{12}$/.test(s.motherAadhaar)) {
                errors.push('Mother Aadhaar Number must be exactly 12 digits');
            }

            // Social category enum
            const validSocialCategories = ['GENERAL', 'OBC', 'SC', 'ST', 'OTHER_MINORITY'];
            if (s.socialCategory && !validSocialCategories.includes(s.socialCategory)) {
                errors.push(`Social Category must be one of: ${validSocialCategories.join(', ')}`);
            }

            // BPL: card number required when flag is true
            if (s.belongsToBPL === true && !s.bplCardNumber) {
                errors.push('BPL Card Number is required when Belongs to BPL is TRUE');
            }

            // Admission date: valid past date
            if (s.admissionDate) {
                const admDate = new Date(s.admissionDate);
                if (isNaN(admDate.getTime())) {
                    errors.push('Admission Date is not a valid date (expected YYYY-MM-DD)');
                } else if (admDate > new Date()) {
                    errors.push('Admission Date cannot be a future date');
                }
            }

            // TC date: valid date
            if (s.tcDate && isNaN(new Date(s.tcDate).getTime())) {
                errors.push('TC Date is not a valid date (expected YYYY-MM-DD)');
            }

            // PIN codes: exactly 6 digits
            if (s.prevPinCode && !/^\d{6}$/.test(s.prevPinCode)) {
                errors.push('Previous School PIN Code must be exactly 6 digits');
            }
            if (s.perPinCode && !/^\d{6}$/.test(s.perPinCode)) {
                errors.push('Permanent Address PIN Code must be exactly 6 digits');
            }

            // IFSC: 4 letters + '0' + 6 alphanumeric
            if (s.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(s.ifscCode)) {
                errors.push('IFSC Code must be in the format XXXX0XXXXXX (e.g. SBIN0001234)');
            }

            // Bank account: numeric only
            if (s.accountNumber && !/^\d+$/.test(s.accountNumber)) {
                errors.push('Bank Account Number must be numeric');
            }
        }

        return { student, isValid: errors.length === 0, errors };
    }
    // validateStudent(student: StudentExcelRow): ValidationResult {
    //     const errors: string[] = [];

    //     if (!student.satsNumber) errors.push('SATS Number is required');
    //     if (!student.firstName) errors.push('First Name is required');
    //     if (!student.lastName) errors.push('Last Name is required');
    //     if (!['MALE', 'FEMALE', 'OTHER'].includes(student.gender ?? '')) {
    //         errors.push('Gender must be MALE, FEMALE, or OTHER');
    //     }
    //     if (student.email && !this.isValidEmail(student.email)) {
    //         errors.push('Email format is invalid');
    //     }
    //     if (student.studentContactNumber && isNaN(Number(student.studentContactNumber))) {
    //         errors.push('Contact Number must be numeric');
    //     }
    //     if (!student.district) errors.push('District is required');
    //     if (!student.state) errors.push('State is required');
    //     if (!student.pinCode) errors.push('PIN Code is required');

    //     if (this.uploadMode === 'sats') {
    //         const s = student as StudentSatsExcelRow;
    //         if (!s.satsNumber) errors.push('SATS Number is required in SATS mode');
    //         if (s.aadhaarNumber && !/^\d{12}$/.test(s.aadhaarNumber)) {
    //             errors.push('Aadhaar Number must be 12 digits');
    //         }
    //     }

    //     return { student, isValid: errors.length === 0, errors };
    // }

    isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    openStudentDetails(student: StudentExcelRow): void {
        this.selectedStudentDetail = student;
        this.showStudentDetailDialog = true;
    }

    get isSatsDetail(): boolean {
        return this.uploadMode === 'sats';
    }

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
                            const errInfo = response.errors?.find((e: any) => e.registrationId === failed.satsNumber);
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
        this.router.navigate(['/home/stats-student-list']);
    }
}
