import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { DheeSelectComponent } from '../../../shared/dhee-select/dhee-select.component';
import { IProfileConfig } from '../../models/user.model';
// Add StudentService import
import { ProfileConfigService } from '../../service/profile-config.service';

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
    imports: [CommonModule, DheeSelectComponent, FormsModule, ButtonModule, CardModule, DialogModule, SelectModule, TableModule, TagModule, ToastModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './student-promotion.component.html',
    styles: `
        ::ng-deep {
            .p-datatable {
                .p-datatable-tbody > tr {
                    transition: background-color 0.2s;

                    &.bg-green-50:hover {
                        background-color: #f0fdf4 !important;
                    }

                    &:hover {
                        background-color: #fffbeb !important;
                    }
                }
            }

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

            .p-tag {
                font-size: 0.75rem;
                padding: 0.25rem 0.5rem;
            }
        }
    `
})
export class StudentPromotionComponent implements OnInit {
    private messageService = inject(MessageService);
    private loader = inject(ApiLoaderService);
    public commonService = inject(CommonService);
    private departmentConfigService = inject(DepartmentConfigService);
    // private studentService = inject(StudentService); // Add StudentService
    studentService = inject(ProfileConfigService);
    // Signals
    sourceStudents = signal<IProfileConfig[]>([]); // Separate signal for source students
    targetStudents = signal<IProfileConfig[]>([]); // Separate signal for target students
    promotionSummary = signal<PromotionSummary>({
        totalDepartments: 0,
        totalClasses: 0,
        totalSections: 0,
        promotedStudents: 0,
        pendingStudents: 0
    });

    selectedDepartment: any = null;
    selectedClass: any = null;
    selectedSection: any = null;

    targetDepartment: any = null;
    targetClass: any = null;
    targetSection: any = null;
    associatedDepartments: any[] = [];
    selectedStudents: IProfileConfig[] = [];
    showPromotionDialog = false;
    showExitDialog = false;
    studentToExit: IProfileConfig | null = null;

    // Computed - Students needing promotion from current section
    // studentsNeedingPromotion = computed(() => {
    //     if (!this.selectedSection || !this.selectedClass || !this.selectedDepartment) {
    //         return [];
    //     }
    //     return this.sourceStudents();
    // });

    // Computed - Students already promoted to target section
    studentsPromotedToTarget = computed(() => {
        if (!this.targetSection || !this.targetClass || !this.targetDepartment) {
            return [];
        }
        return this.targetStudents();
    });

    ngOnInit() {
        this.loadDepartments();
        // this.loadPromotionSummary();
    }

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

    loadPromotionSummary() {
        this.loader.show('Loading promotion summary...');

        // Call backend API to get promotion summary
        // this.studentService.getPromotionSummary().subscribe({
        //     next: (summary) => {
        //         this.promotionSummary.set({
        //             totalDepartments: summary.totalDepartments || 0,
        //             totalClasses: summary.totalClasses || 0,
        //             totalSections: summary.totalSections || 0,
        //             promotedStudents: summary.promotedStudents || 0,
        //             pendingStudents: summary.pendingStudents || 0
        //         });
        //         this.loader.hide();
        //     },
        //     error: (error) => {
        //         console.error('Error loading promotion summary:', error);
        //         this.loader.hide();
        //         this.messageService.add({
        //             severity: 'error',
        //             summary: 'Error',
        //             detail: 'Failed to load promotion summary'
        //         });
        //     }
        // });
    }

    loadSourceStudents() {
        if (!this.selectedSection?.id) {
            this.sourceStudents.set([]);
            return;
        }

        this.loader.show('Loading students...');

        this.studentService
            .search(0, 100, 'id', 'ASC', {
                // 'branch_id.eq': this.commonService.branch?.id,
                // 'authorities.name.in': ['STUDENT'],
                'departments.in': [this.selectedDepartment.id],
                'roles.student.class_id.in': [this.selectedClass.id],
                'roles.student.section_id.in': [this.selectedSection.id]
            })
            .subscribe({
                next: (students) => {
                    this.sourceStudents.set(students.content);
                    this.loader.hide();
                },
                error: (error) => {
                    console.error('Error loading students:', error);
                    this.sourceStudents.set([]);
                    this.loader.hide();
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load students'
                    });
                }
            });
    }

    loadTargetStudents() {
        if (!this.targetSection?.id) {
            this.targetStudents.set([]);
            return;
        }

        // Fetch already promoted students in target section
        // this.studentService.getPromotedStudentsBySection(this.targetSection.id).subscribe({
        //     next: (students) => {
        //         this.targetStudents.set(students);
        //     },
        //     error: (error) => {
        //         console.error('Error loading target students:', error);
        //         this.targetStudents.set([]);
        //     }
        // });
    }

    onClassChange() {
        this.selectedSection = null;
        this.selectedStudents = [];
        this.sourceStudents.set([]);
    }

    onSectionChange() {
        this.selectedStudents = [];
        this.loadSourceStudents();
    }

    onTargetClassChange() {
        this.targetSection = null;
        this.targetStudents.set([]);
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

        if (!this.targetDepartment || !this.targetClass || !this.targetSection) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Target Selection',
                detail: 'Please select target department, class, and section.'
            });
            return;
        }

        this.showPromotionDialog = true;
    }

    confirmPromotion() {
        this.showPromotionDialog = false;
        this.loader.show('Promoting students...');

        const studentIds = this.selectedStudents.map((s) => s.id);
        const promotionData = {
            studentIds: studentIds,
            targetClassId: this.targetClass.id,
            targetSectionId: this.targetSection.id,
            targetDepartmentId: this.targetDepartment.id,
            academicYear: this.targetDepartment.academicYear
        };

        // Call backend API to promote students
        // this.studentService.promoteStudents(promotionData).subscribe({
        //     next: (response) => {
        //         // Reload both source and target students
        //         forkJoin({
        //             source: this.studentService.getStudentsBySection(this.selectedSection.id),
        //             target: this.studentService.getPromotedStudentsBySection(this.targetSection.id),
        //             summary: this.studentService.getPromotionSummary()
        //         }).subscribe({
        //             next: (results) => {
        //                 this.sourceStudents.set(results.source);
        //                 this.targetStudents.set(results.target);
        //                 this.promotionSummary.set(results.summary);
        //                 this.selectedStudents = [];
        //                 this.loader.hide();

        //                 this.messageService.add({
        //                     severity: 'success',
        //                     summary: 'Success',
        //                     detail: `Successfully promoted ${studentIds.length} students to ${this.targetClass.name} - ${this.targetSection.name}`
        //                 });
        //             },
        //             error: (error) => {
        //                 console.error('Error reloading data:', error);
        //                 this.loader.hide();
        //             }
        //         });
        //     },
        //     error: (error) => {
        //         console.error('Error promoting students:', error);
        //         this.loader.hide();
        //         this.messageService.add({
        //             severity: 'error',
        //             summary: 'Error',
        //             detail: 'Failed to promote students. Please try again.'
        //         });
        //     }
        // });
    }

    openExitDialog(student: IProfileConfig) {
        this.studentToExit = student;
        this.showExitDialog = true;
    }

    confirmExit() {
        if (!this.studentToExit) return;

        this.showExitDialog = false;
        this.loader.show('Marking student as exited...');

        // Call backend API to mark student as exited
        // this.studentService.markStudentAsExited(this.studentToExit.id).subscribe({
        //     next: () => {
        //         // Refresh source students
        //         this.loadSourceStudents();
        //         this.loadPromotionSummary();

        //         this.selectedStudents = this.selectedStudents.filter((s) => s.id !== this.studentToExit!.id);
        //         this.studentToExit = null;
        //         this.loader.hide();

        //         this.messageService.add({
        //             severity: 'success',
        //             summary: 'Success',
        //             detail: 'Student marked as exited successfully'
        //         });
        //     },
        //     error: (error) => {
        //         console.error('Error marking student as exited:', error);
        //         this.loader.hide();
        //         this.messageService.add({
        //             severity: 'error',
        //             summary: 'Error',
        //             detail: 'Failed to mark student as exited'
        //         });
        //     }
        // });
    }

    // Student details function
    openStudentDetails(student: IProfileConfig) {
        // Implement your student details view logic here
        console.log('Student details:', student);
        this.messageService.add({
            severity: 'info',
            summary: 'Student Details',
            detail: `${student.fullName} (${student.username})`
        });
    }
}
