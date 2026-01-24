import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { DheeSelectComponent } from '../../../shared/dhee-select/dhee-select.component';

interface StudentProfile {
    _id: string;
    user_id: string;
    academic_year: string;
    username: string;
    email: string;
    full_name: string;
    contact_number: string;
    gender: string;
    profileType: string;
    status: 'ACTIVE' | 'EXITED';
    departments: string[];
    roles: {
        student: {
            class_id: string;
            section_id: string;
            class_name: string;
            section_name: string;
        };
    };
    promoted?: boolean;
    createdDate?: Date;
}

interface PromotionSummary {
    totalDepartments: number;
    totalClasses: number;
    totalSections: number;
    promotedStudents: number;
    pendingStudents: number;
}

@Component({
    selector: 'app-student-promotion',
    standalone: true,
    imports: [CommonModule, DheeSelectComponent, FormsModule, ButtonModule, CardModule, DialogModule, SelectModule, TableModule, TagModule, ToastModule, TooltipModule, ProgressBarModule],
    providers: [MessageService],
    templateUrl: './student-promotion.component.html',
    styles: `
        ::ng-deep {
            .detail-item {
                margin-bottom: 0.75rem;

                .text-xs {
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                    margin-bottom: 0.25rem;
                }

                .text-sm {
                    color: #1f2937;
                }
            }

            // Custom table styling
            .p-datatable {
                .p-datatable-tbody > tr {
                    transition: background-color 0.2s;

                    &.bg-red-50:hover {
                        background-color: #fef2f2 !important;
                    }

                    &.bg-green-50:hover {
                        background-color: #f0fdf4 !important;
                    }
                }
            }

            // Card styling
            p-card {
                .p-card {
                    box-shadow:
                        0 1px 3px 0 rgba(0, 0, 0, 0.1),
                        0 1px 2px 0 rgba(0, 0, 0, 0.06);
                    border-radius: 0.5rem;
                }

                .p-card-header {
                    border-radius: 0.5rem 0.5rem 0 0;
                }
            }

            // Dialog styling
            .p-dialog {
                .p-dialog-header {
                    border-bottom: 1px solid #e5e7eb;
                }

                .p-dialog-footer {
                    border-top: 1px solid #e5e7eb;
                }
            }

            // Tag styling
            .p-tag {
                font-size: 0.75rem;
                padding: 0.25rem 0.5rem;
            }

            // Button group styling
            .p-button-group {
                .p-button {
                    margin: 0;
                }
            }
        }

        // Responsive adjustments
        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }
    `
})
export class StudentPromotionComponent implements OnInit {
    private messageService = inject(MessageService);
    private loader = inject(ApiLoaderService);
    public commonService = inject(CommonService);
    private departmentConfigService = inject(DepartmentConfigService);

    // Signals
    students = signal<StudentProfile[]>([]);
    isLoading = signal(false);
    promotionSummary = signal<PromotionSummary>({
        totalDepartments: 0,
        totalClasses: 0,
        totalSections: 0,
        promotedStudents: 0,
        pendingStudents: 0
    });

    // Filter selections
    selectedAcademicYear: string = '';
    selectedDepartment: any = null;
    selectedClass: any = null;
    selectedSection: any = null;

    // Promotion target selections
    targetAcademicYear: string = '';
    targetDepartment: any = null;
    targetClass: any = null;
    targetSection: any = null;

    // Data
    // academicYears: string[] = [];
    associatedDepartments: any[] = [];
    selectedStudents: StudentProfile[] = [];

    // Dialogs
    showPromotionDialog = false;
    showExitDialog = false;
    showStudentDetailDialog = false;
    selectedStudentDetail: StudentProfile | null = null;
    studentToExit: StudentProfile | null = null;

    // Computed
    filteredStudents = computed(() => {
        return this.students().filter(
            (s) =>
                (!this.selectedSection || s.roles?.student?.section_id === this.selectedSection?.id) &&
                (!this.selectedClass || s.roles?.student?.class_id === this.selectedClass?.id) &&
                (!this.selectedDepartment || s.departments?.includes(this.selectedDepartment?.id)) &&
                (!this.selectedAcademicYear || s.academic_year === this.selectedAcademicYear)
        );
    });

    activeStudentsCount = computed(() => this.filteredStudents().filter((s) => s.status === 'ACTIVE' && !s.promoted).length);

    exitedStudentsCount = computed(() => this.filteredStudents().filter((s) => s.status === 'EXITED').length);

    promotedStudentsCount = computed(() => this.filteredStudents().filter((s) => s.promoted).length);

    ngOnInit() {
        // this.initializeAcademicYears();
        this.loadDepartments();
        this.loadDummyData();
        this.calculateSummary();
    }

    // initializeAcademicYears() {
    //     const currentYear = new Date().getFullYear();
    //     for (let i = -2; i <= 3; i++) {
    //         const year = currentYear + i;
    //         this.academicYears.push(`${year}-${year + 1}`);
    //     }
    //     this.selectedAcademicYear = `${currentYear}-${currentYear + 1}`;
    //     this.targetAcademicYear = `${currentYear + 1}-${currentYear + 2}`;
    // }

    loadDepartments() {
        const filterParams = {
            branch: this.commonService.branch?.id
        };

        this.departmentConfigService.search(0, 100, 'id', 'ASC', filterParams).subscribe((res) => {
            this.associatedDepartments = res.content.map((re) => ({
                ...re,
                name: re.department.name,
                id: re.id,
                department: re.department
            }));
        });
    }

    loadDummyData() {
        // Generate dummy student data
        const classes = ['NINTH_STANDARD', 'TENTH_STANDARD', 'ELEVENTH_STANDARD', 'TWELFTH_STANDARD'];
        const sections = ['SECTION_A', 'SECTION_B', 'SECTION_C'];
        const statuses: ('ACTIVE' | 'EXITED')[] = ['ACTIVE', 'EXITED'];
        const firstNames = ['Rajat', 'Priya', 'Amit', 'Sneha', 'Rahul', 'Ananya', 'Vikram', 'Divya'];
        const lastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Reddy', 'Nair', 'Gupta', 'Verma'];

        const dummyStudents: StudentProfile[] = Array.from({ length: 80 }, (_, i) => ({
            _id: `student_${i + 1}`,
            user_id: `${114 + i}`,
            academic_year: this.selectedAcademicYear,
            username: `DIPSMST${150 + i}`,
            email: i % 3 === 0 ? 'NA' : `student${i + 1}@school.com`,
            full_name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
            contact_number: `98765${String(43210 + i).slice(-5)}`,
            gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
            profileType: 'STUDENT',
            status: i % 12 === 0 ? 'EXITED' : 'ACTIVE',
            departments: ['69610acbe734e6dc4ebc56bb'],
            roles: {
                student: {
                    class_id: `class_${i % 4}`,
                    section_id: `section_${i % 3}`,
                    class_name: classes[i % 4],
                    section_name: sections[i % 3]
                }
            },
            promoted: i % 15 === 0,
            createdDate: new Date(2024, 0, 10 + i)
        }));

        this.students.set(dummyStudents);
    }

    calculateSummary() {
        const uniqueDepartments = new Set(this.students().flatMap((s) => s.departments));
        const uniqueClasses = new Set(this.students().map((s) => s.roles?.student?.class_id));
        const uniqueSections = new Set(this.students().map((s) => s.roles?.student?.section_id));

        this.promotionSummary.set({
            totalDepartments: uniqueDepartments.size,
            totalClasses: uniqueClasses.size,
            totalSections: uniqueSections.size,
            promotedStudents: this.students().filter((s) => s.promoted).length,
            pendingStudents: this.students().filter((s) => s.status === 'ACTIVE' && !s.promoted).length
        });
    }

    onDepartmentChange() {
        this.selectedClass = null;
        this.selectedSection = null;
        this.selectedStudents = [];
    }

    onClassChange() {
        this.selectedSection = null;
        this.selectedStudents = [];
    }

    onSectionChange() {
        this.selectedStudents = [];
    }

    onTargetDepartmentChange() {
        this.targetClass = null;
        this.targetSection = null;
    }

    onTargetClassChange() {
        this.targetSection = null;
    }

    isStudentSelectable(student: StudentProfile): boolean {
        return student.status === 'ACTIVE' && !student.promoted;
    }

    openPromotionDialog() {
        if (this.selectedStudents.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Students Selected',
                detail: 'Please select at least one student to promote.'
            });
            return;
        }

        if (!this.targetAcademicYear || !this.targetDepartment || !this.targetClass || !this.targetSection) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Target Selection',
                detail: 'Please select target Academic Year, Department, Class, and Section.'
            });
            return;
        }

        this.showPromotionDialog = true;
    }

    confirmPromotion() {
        this.showPromotionDialog = false;
        this.loader.show('Promoting students...');

        const studentIds = this.selectedStudents.map((s) => s._id);

        const payload = {
            studentIds: studentIds,
            targetAcademicYear: this.targetAcademicYear,
            targetDepartmentId: this.targetDepartment.id,
            targetClassId: this.targetClass.id,
            targetClassName: this.targetClass.name,
            targetSectionId: this.targetSection.id,
            targetSectionName: this.targetSection.name,
            branchId: this.commonService?.branch?.id
        };

        // Simulate API call
        setTimeout(() => {
            // Update promoted status
            const updatedStudents = this.students().map((s) => {
                if (studentIds.includes(s._id)) {
                    return { ...s, promoted: true };
                }
                return s;
            });

            this.students.set(updatedStudents);
            this.selectedStudents = [];
            this.calculateSummary();
            this.loader.hide();

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Successfully promoted ${studentIds.length} students to ${this.targetClass.name} - ${this.targetSection.name}`
            });
        }, 2000);
    }

    openExitDialog(student: StudentProfile) {
        this.studentToExit = student;
        this.showExitDialog = true;
    }

    confirmExit() {
        if (!this.studentToExit) return;

        this.showExitDialog = false;
        this.loader.show('Marking student as exited...');

        // Simulate API call
        setTimeout(() => {
            const updatedStudents = this.students().map((s) => {
                if (s._id === this.studentToExit!._id) {
                    return { ...s, status: 'EXITED' as const };
                }
                return s;
            });

            this.students.set(updatedStudents);
            this.selectedStudents = this.selectedStudents.filter((s) => s._id !== this.studentToExit!._id);
            this.studentToExit = null;
            this.calculateSummary();
            this.loader.hide();

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Student marked as exited successfully'
            });
        }, 1500);
    }

    openStudentDetails(student: StudentProfile) {
        this.selectedStudentDetail = student;
        this.showStudentDetailDialog = true;
    }

    goBack() {
        window.history.back();
    }
}
