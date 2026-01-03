import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import * as XLSX from 'xlsx';
import { CommonService } from '../../../core/services/common.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments } from '../../../core/store/user-profile/user-profile.selectors';
import { StudentExcelRow, ValidationResult } from '../../models/bulk-student-upload.model';
import { UserService } from '../../service/user.service';

@Component({
    selector: 'app-bulk-student-upload',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, FileUploadModule, TableModule, TagModule, ToastModule, ProgressBarModule, CardModule, SelectModule],
    providers: [MessageService],
    templateUrl: './bulk-student-upload.component.html'
})
export class BulkStudentUploadComponent implements OnInit {
    private store = inject(Store<{ userProfile: UserProfileState }>);
    private userService = inject(UserService);
    private messageService = inject(MessageService);
    private loader = inject(ApiLoaderService);
    public commonService = inject(CommonService);

    // Signals
    uploadedStudents = signal<StudentExcelRow[]>([]);
    isProcessing = signal(false);

    // Properties
    showConfirmDialog = false;
    showStudentDetailDialog = false; // New dialog state
    selectedStudentDetail: StudentExcelRow | null = null; // Selected student for dialog
    submitted: boolean = false;
    associatedDepartments: any[] = [];
    selectedDepartment: any;
    selectedClass: any;
    selectedSection: any;

    // Computed Properties/Functions
    validCount = () => this.uploadedStudents().filter((s) => s.isValid).length;
    invalidCount = () => this.uploadedStudents().filter((s) => !s.isValid).length;

    ngOnInit() {
        this.store.select(getAssociatedDepartments).subscribe((depts) => {
            this.associatedDepartments = depts.map((department: any) => {
                return { ...department, name: department.department?.name };
            });
        });
    }

    downloadTemplate() {
        const sampleData = [
            {
                registrationId: 'STU002',
                firstName: 'bulk',
                lastName: 'upload',
                gender: 'MALE',
                houseNumber: '123',
                street: 'Main Street',
                locality: 'Downtown',
                landmark: 'Near Park',
                taluk: 'KR Pet',
                district: 'Mandya',
                state: 'Karnataka',
                country: 'India',
                postalCode: '560001',
                password: 'User@123',
                email: 'student@gmail.com',
                studentContactNumber: 9999999999
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
        XLSX.writeFile(workbook, 'Student_Upload_Template.xlsx');

        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Template downloaded successfully'
        });
    }

    onFileSelect(event: any) {
        const file = event.files[0];
        if (!file) return;

        this.isProcessing.set(true);
        const reader = new FileReader();

        reader.onload = (e: any) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                this.processExcelData(jsonData);
            } catch (error) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to process Excel file'
                });
                this.isProcessing.set(false);
            }
        };

        reader.readAsBinaryString(file);
    }

    processExcelData(data: any[]) {
        // Find department and set department IDs
        const selectedDeptInfo = this.associatedDepartments.find((d) => d.department?.name?.toLowerCase() === this.selectedDepartment?.department?.name?.toLowerCase());

        const students: StudentExcelRow[] = data.map((row, index) => {
            const student: StudentExcelRow = {
                rowNumber: index + 2,
                registrationId: row.registrationId?.toString().trim() || '',
                firstName: row.firstName?.toString().trim() || '',
                lastName: row.lastName?.toString().trim() || '',
                gender: row.gender?.toString().trim().toUpperCase() || '',
                houseNumber: row.houseNumber?.toString().trim() || '',
                street: row.street?.toString().trim() || '',
                locality: row.locality?.toString().trim() || '',
                landmark: row.landmark?.toString().trim() || '',
                taluk: row.taluk?.toString().trim() || '',
                district: row.district?.toString().trim() || '',
                state: row.state?.toString().trim() || '',
                country: row.country?.toString().trim() || '',
                postalCode: row.postalCode?.toString().trim() || '',
                password: row.password?.toString().trim() || 'User@123',
                email: row.email?.toString().trim(),
                studentContactNumber: row.studentContactNumber // Keep as original type for now
            };

            // Set department IDs
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

    validateStudent(student: StudentExcelRow): ValidationResult {
        const errors: string[] = [];

        // Required fields validation
        if (!student.registrationId) errors.push('Registration ID is required');
        if (!student.firstName) errors.push('First Name is required');
        if (!student.lastName) errors.push('Last Name is required');

        // Gender validation
        if (!['MALE', 'FEMALE', 'OTHER'].includes(student.gender)) {
            errors.push('Gender must be MALE, FEMALE, or OTHER');
        }

        // Email validation
        if (student.email && !this.isValidEmail(student.email)) {
            errors.push('Email is invalid');
        }

        // Contact Number validation (Assuming it should be a number if provided)
        if (student.studentContactNumber && isNaN(Number(student.studentContactNumber))) {
            errors.push('Contact Number is invalid (must be numeric)');
        }

        // Address validation (as per template logic)
        if (!student.houseNumber) errors.push('House Number is required');
        if (!student.street) errors.push('Street is required');
        if (!student.locality) errors.push('Locality is required');
        if (!student.taluk) errors.push('Taluk is required');
        if (!student.district) errors.push('District is required');
        if (!student.state) errors.push('State is required');
        if (!student.country) errors.push('Country is required');
        if (!student.postalCode) errors.push('Postal Code is required');

        return {
            student,
            isValid: errors.length === 0,
            errors
        };
    }

    isValidEmail(email: string): boolean {
        // Simple regex check
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // New: Open student detail dialog
    openStudentDetails(student: StudentExcelRow) {
        this.selectedStudentDetail = student;
        this.showStudentDetailDialog = true;
    }

    confirmSave() {
        this.submitted = true;
        if (!this.selectedDepartment || !this.selectedClass || !this.selectedSection) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Selection',
                detail: 'Please select Department, Class, and Section before saving.'
            });
            return;
        }
        if (this.validCount() === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Valid Students',
                detail: 'There are no valid students to save.'
            });
            return;
        }
        this.showConfirmDialog = true;
    }

    saveAllStudents() {
        this.showConfirmDialog = false;
        const validStudents = this.uploadedStudents().filter((s) => s.isValid);

        this.loader.show('Saving students...');

        const studentsPayload = validStudents.map((s) => {
            const { errors, isValid, rowNumber, ...rest } = s;
            return rest;
        });

        const payload = {
            students: studentsPayload,
            branchId: this.commonService?.branch?.id,
            departmentId: this.selectedDepartment?.id,
            departmentName: this.selectedDepartment?.department?.name,
            classId: this.selectedClass?.id,
            className: this.selectedClass?.name,
            sectionId: this.selectedSection?.id,
            sectionName: this.selectedSection?.name,
            academicYear: this.selectedDepartment.academicYear
        };

        this.userService.bulkCreateStudents(payload).subscribe({
            next: (response: any) => {
                this.loader.hide();

                if (response.failureCount > 0) {
                    // Map failed students with error messages
                    const failedStudentsWithErrors = this.uploadedStudents().map((uploadedStudent) => {
                        const failedRecord = response.failedStudents.find((fs: any) => fs.registrationId === uploadedStudent.registrationId);

                        if (failedRecord) {
                            const errorInfo = response.errors?.find((err: any) => err.registrationId === failedRecord.registrationId);

                            return {
                                ...uploadedStudent,
                                isValid: false,
                                errorMessage: errorInfo?.errorMessage || 'Unknown error occurred during save',
                                errors: []
                            };
                        }
                        return uploadedStudent; // Keep original valid students
                    });

                    this.uploadedStudents.set(failedStudentsWithErrors);

                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Partial Success',
                        detail: `Successfully created ${response.successCount} students. ${response.failureCount} failed. Please review the errors below.`,
                        life: 5000
                    });
                } else {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: `Successfully created ${response.successCount} students`
                    });

                    setTimeout(() => {
                        this.goBack();
                    }, 2000);
                }
            },
            error: (error) => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Failed to save students. Please try again.'
                });
            }
        });
    }

    resetUpload() {
        this.uploadedStudents.set([]);
    }

    goBack() {
        window.history.back();
    }
}
