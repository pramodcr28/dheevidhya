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
import { getAssociatedDepartments, getBranch } from '../../../core/store/user-profile/user-profile.selectors';
import { StudentExcelRow, ValidationResult } from '../../models/bulk-student-upload.model';
import { IBranch } from '../../models/tenant.model';
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
    uploadedStudents = signal<StudentExcelRow[]>([]);
    isProcessing = signal(false);
    showConfirmDialog = false;
    submitted: boolean = false;
    associatedBranch: IBranch | undefined;
    associatedDepartments: any[] = [];
    selectedDepartment: any;
    selectedClass: any;
    selectedSection: any;

    validCount = () => this.uploadedStudents().filter((s) => s.isValid).length;
    invalidCount = () => this.uploadedStudents().filter((s) => !s.isValid).length;

    ngOnInit() {
        this.store.select(getAssociatedDepartments).subscribe((depts) => {
            this.associatedDepartments = depts;
        });

        this.store.select(getBranch).subscribe((branch) => {
            this.associatedBranch = branch;
        });
        this.store.select(getAssociatedDepartments).subscribe((departments) => {
            this.associatedDepartments = departments.map((department: any) => {
                return { ...department, name: department.department?.name };
            });

            // if (this._studentProfile && this._studentProfile.departments && this._studentProfile.departments.length > 0) {
            //     const departmentId = this._studentProfile.departments[0];
            //     const foundDepartment = this.associatedDepartments.find((dep) => dep.id === departmentId);
            //     if (foundDepartment) {
            //         this.selectedDepartment = foundDepartment;
            //         this.setClassAndSectionFromProfile();
            //     }
            // }
        });
    }

    downloadTemplate() {
        // const headers = [
        //     'registrationId',
        //     'firstName',
        //     'lastName',
        //     'gender',
        //     'houseNumber',
        //     'street',
        //     'locality',
        //     'landmark',
        //     'taluk',
        //     'district',
        //     'state',
        //     'country',
        //     'postalCode',
        //     // 'departmentName',
        //     // 'className',
        //     // 'sectionName',
        //     // 'guardianFirstName',
        //     // 'guardianLastName',
        //     // 'guardianEmail',
        //     // 'guardianPhone',
        //     // 'guardianRelation',
        //     'password',
        //     'email',
        //     'studentContactNumber'
        // ];

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
                // departmentName: 'Computer Science',
                // className: 'Class 10',
                // sectionName: 'A',
                // guardianFirstName: 'Robert',
                // guardianLastName: 'Doe',
                // guardianEmail: 'robert.doe@example.com',
                // guardianPhone: '9876543210',
                // guardianRelation: 'Father',
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
                // guardianFirstName: row.guardianFirstName?.toString().trim() || '',
                // guardianLastName: row.guardianLastName?.toString().trim() || '',
                // guardianEmail: row.guardianEmail?.toString().trim() || '',
                // guardianPhone: row.guardianPhone?.toString().trim() || '',
                // guardianRelation: row.guardianRelation?.toString().trim() || '',
                password: row.password?.toString().trim() || 'User@123',
                email: row.email?.toString().trim(),
                studentContactNumber: row.studentContactNumber || 9999999999
            };

            // Find department and set department IDs
            const dept = this.associatedDepartments.find((d) => d.department?.name?.toLowerCase() === this.selectedDepartment?.department?.name);

            if (dept) {
                (student as any).departments = [dept.id];
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

        // Address validation
        if (!student.houseNumber) errors.push('House Number is required');
        if (!student.street) errors.push('Street is required');
        if (!student.locality) errors.push('Locality is required');
        if (!student.taluk) errors.push('Taluk is required');
        if (!student.district) errors.push('District is required');
        if (!student.state) errors.push('State is required');
        if (!student.country) errors.push('Country is required');
        if (!student.postalCode) errors.push('Postal Code is required');

        // Validate department exists
        // const dept = this.associatedDepartments.find((d) => d.department?.name?.toLowerCase() === this.selectedDepartment?.department?.name);
        // if (!dept) errors.push(`Department '${this.selectedDepartment?.department?.name}' not found`);

        // // Validate class and section
        // if (dept) {
        //     const cls = dept.department?.classes?.find((c: any) => c.name?.toLowerCase() === student.className.toLowerCase());
        //     if (!cls) {
        //         errors.push(`Class '${student.className}' not found in ${student.departmentName}`);
        //     } else {
        //         const section = cls.sections?.find((s: any) => s.name?.toLowerCase() === student.sectionName.toLowerCase());
        //         if (!section) {
        //             errors.push(`Section '${student.sectionName}' not found in ${student.className}`);
        //         }
        //     }
        // }

        // Guardian validation (optional but if provided, must be complete)
        // if (student.guardianFirstName || student.guardianLastName || student.guardianEmail) {
        //     if (!student.guardianFirstName) errors.push('Guardian First Name required if guardian info provided');
        //     if (!student.guardianLastName) errors.push('Guardian Last Name required if guardian info provided');
        //     if (!student.guardianEmail) errors.push('Guardian Email required if guardian info provided');

        //     // Email validation
        //     if (student.guardianEmail && !this.isValidEmail(student.guardianEmail)) {
        //         errors.push('Invalid guardian email format');
        //     }
        // }

        return {
            student,
            isValid: errors.length === 0,
            errors
        };
    }

    isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    confirmSave() {
        this.showConfirmDialog = true;
        this.submitted = true;
    }

    saveAllStudents() {
        this.showConfirmDialog = false;
        const validStudents = this.uploadedStudents().filter((s) => s.isValid);

        if (validStudents.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Valid Students',
                detail: 'There are no valid students to save'
            });
            return;
        }

        // Get the first student's academic info (all students will be in same dept/class/section)
        // const firstStudent = validStudents[0];
        // const dept = this.associatedDepartments.find((d) => d.department?.name?.toLowerCase() === firstStudent.departmentName.toLowerCase());
        // const cls = dept.department?.classes?.find((c: any) => c.name?.toLowerCase() === firstStudent.className.toLowerCase());
        // const section = cls.sections?.find((s: any) => s.name?.toLowerCase() === firstStudent.sectionName.toLowerCase());

        this.loader.show('Saving students...');
        const payload = {
            students: validStudents,
            branchId: this.associatedBranch?.id,
            departmentId: this.selectedDepartment?.id,
            departmentName: this.selectedDepartment?.department?.name,
            classId: this.selectedClass?.id,
            className: this.selectedClass?.name,
            sectionId: this.selectedSection?.id,
            sectionName: this.selectedSection?.name,
            academicYear: this.selectedDepartment.academicYear
        };
        validStudents.forEach((student) => {
            delete student.errors;
            delete student.isValid;
        });
        this.userService.bulkCreateStudents(payload).subscribe({
            next: (response: any) => {
                this.loader.hide();

                if (response.failureCount > 0) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Partial Success',
                        detail: `Created ${response.successCount} students. ${response.failureCount} failed.`
                    });
                    this.uploadedStudents.set(response.failedStudents || []);
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
