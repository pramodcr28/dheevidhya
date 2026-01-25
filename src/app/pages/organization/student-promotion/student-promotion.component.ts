import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { DheeSelectComponent } from '../../../shared/dhee-select/dhee-select.component';
import { IProfileConfig, UserStatus } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { UserService } from '../../service/user.service';

@Component({
    selector: 'app-student-promotion',
    standalone: true,
    imports: [CommonModule, TextareaModule, DheeSelectComponent, FormsModule, ButtonModule, CardModule, DialogModule, SelectModule, TableModule, TagModule, ToastModule, TooltipModule],
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

                    &.student-disabled {
                        opacity: 0.6;
                        background-color: #f3f4f6 !important;
                        cursor: not-allowed;

                        &:hover {
                            background-color: #f3f4f6 !important;
                        }
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
    studentService = inject(ProfileConfigService);
    private userService = inject(UserService);
    sourceStudents = signal<IProfileConfig[]>([]);
    targetStudents = signal<IProfileConfig[]>([]);
    sourceDepartments: any[] = [];
    selectedDepartment: any = null;
    selectedClass: any = null;
    selectedSection: any = null;

    targetDepartment: any = null;
    targetClass: any = null;
    targetSection: any = null;
    targetDepartments: any[] = [];
    selectedStudents: IProfileConfig[] = [];
    selectedTargetStudents: IProfileConfig[] = [];
    showPromotionDialog = false;
    showExitDialog = false;
    showStudentDetailsDialog = false;
    studentToExit: IProfileConfig | null = null;
    selectedStudentDetails: any = null;
    exitReason: string = '';

    ngOnInit() {
        this.loadDepartments();
    }

    loadDepartments() {
        const filterParams = {
            branch: this.commonService.branch?.id
        };

        this.departmentConfigService.search(0, 100, 'id', 'ASC', filterParams).subscribe((res) => {
            this.sourceDepartments = res.content.map((re) => ({
                ...re,
                name: re.department.name,
                id: re.id,
                department: re.department
            }));
            this.updateTargetDepartments();
            console.log('Loaded departments:', this.sourceDepartments);
        });
    }

    public updateTargetDepartments() {
        if (!this.selectedDepartment?.academicYear) {
            this.targetDepartments = [...this.sourceDepartments];
            return;
        }

        const sourceYear = parseInt(this.selectedDepartment.academicYear.split('-')[0]);

        this.targetDepartments = this.sourceDepartments.filter((dept) => {
            if (!dept.academicYear) return false;

            const targetYear = parseInt(dept.academicYear.split('-')[0]);
            return targetYear > sourceYear;
        });

        console.log(`Filtered target departments: ${this.targetDepartments.length} departments with academic year > ${this.selectedDepartment.academicYear}`);

        if (this.targetDepartment) {
            const isTargetStillValid = this.targetDepartments.some((dept) => dept.id === this.targetDepartment.id);
            if (!isTargetStillValid) {
                this.targetDepartment = null;
                this.targetClass = null;
                this.targetSection = null;
                this.targetStudents.set([]);

                this.messageService.add({
                    severity: 'info',
                    summary: 'Target Reset',
                    detail: 'Target department was reset as it no longer meets the academic year criteria.'
                });
            }
        }
    }

    loadSourceStudents() {
        if (!this.selectedSection?.id) {
            this.sourceStudents.set([]);
            return;
        }

        this.loader.show('Loading students...');

        this.studentService
            .search(0, 100, 'id', 'ASC', {
                'departments.in': [this.selectedDepartment.id],
                'roles.student.classId.in': [this.selectedClass.id],
                'roles.student.sectionId.in': [this.selectedSection.id]
            })
            .subscribe({
                next: (students) => {
                    // Filter out students who are already in target section
                    const targetStudentIds = this.targetStudents().map((s) => s.id);
                    const filteredStudents = students.content.filter((student) => !targetStudentIds.includes(student.id));

                    this.sourceStudents.set(filteredStudents);

                    // Show warning if some students were filtered out
                    const filteredCount = students.content.length - filteredStudents.length;
                    if (filteredCount > 0) {
                        this.messageService.add({
                            severity: 'warn',
                            summary: 'Students Already Promoted',
                            detail: `${filteredCount} student(s) already exist in the target section and were excluded from the source list.`
                        });
                    }

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
        this.loader.show('Loading students...');

        this.studentService
            .search(0, 100, 'id', 'ASC', {
                'departments.in': [this.targetDepartment.id],
                'roles.student.classId.in': [this.targetClass.id],
                'roles.student.sectionId.in': [this.targetSection.id]
            })
            .subscribe({
                next: (students) => {
                    this.targetStudents.set(students.content);
                    if (this.selectedSection?.id) {
                        this.loadSourceStudents();
                    }

                    this.loader.hide();
                },
                error: (error) => {
                    console.error('Error loading students:', error);
                    this.targetStudents.set([]);
                    this.loader.hide();
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load students'
                    });
                }
            });
    }

    isStudentSelectable(student: IProfileConfig): boolean {
        if (student.status === UserStatus.EXITED) {
            return false;
        }
        const targetStudentIds = this.targetStudents().map((s) => s.userId);
        if (targetStudentIds.includes(student.userId)) {
            return false;
        }

        return true;
    }

    isStudentInTarget(student: IProfileConfig): boolean {
        const targetStudentIds = this.targetStudents().map((s) => s.userId);
        return targetStudentIds.includes(student.userId);
    }

    areAllStudentsNonSelectable(): boolean {
        const students = this.sourceStudents();
        if (students.length === 0) return true;
        return students.every((student) => !this.isStudentSelectable(student));
    }

    private validateSourceAndTarget(): boolean {
        if (!this.selectedDepartment || !this.selectedClass || !this.selectedSection) {
            return true;
        }

        if (!this.targetDepartment || !this.targetClass || !this.targetSection) {
            return true;
        }

        if (this.selectedDepartment.id === this.targetDepartment.id && this.selectedClass.id === this.targetClass.id && this.selectedSection.id === this.targetSection.id) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Selection',
                detail: 'Source and target section cannot be the same. Please select a different target section.'
            });
            return false;
        }

        return true;
    }

    private validateAcademicYearGap(): boolean {
        if (!this.selectedDepartment?.academicYear || !this.targetDepartment?.academicYear) {
            return true;
        }

        const sourceYear = parseInt(this.selectedDepartment.academicYear.split('-')[0]);
        const targetYear = parseInt(this.targetDepartment.academicYear.split('-')[0]);
        const yearGap = targetYear - sourceYear;

        if (yearGap === 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Academic Year',
                detail: 'Target academic year cannot be the same as source academic year. Students must be promoted to the next academic year.'
            });
            return false;
        }

        if (yearGap < 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Academic Year',
                detail: 'Target academic year must be greater than source academic year. Cannot promote students backwards in time.'
            });
            return false;
        }

        if (yearGap !== 1) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Academic Year Gap',
                detail: `Target academic year must be exactly 1 year ahead of source academic year. Current gap: ${yearGap} year(s).`
            });
            return false;
        }

        return true;
    }

    onDepartmentChange() {
        this.selectedClass = null;
        this.selectedSection = null;
        this.selectedStudents = [];
        this.sourceStudents.set([]);

        this.updateTargetDepartments();

        this.validateSourceAndTarget();
        this.validateAcademicYearGap();
    }

    onClassChange() {
        this.selectedSection = null;
        this.selectedStudents = [];
        this.sourceStudents.set([]);

        this.validateSourceAndTarget();
    }

    onSectionChange() {
        this.selectedStudents = [];

        if (!this.validateSourceAndTarget()) {
            this.selectedSection = null;
            return;
        }

        if (!this.validateAcademicYearGap()) {
            this.selectedSection = null;
            return;
        }

        this.loadSourceStudents();
    }

    onTargetDepartmentChange() {
        this.targetClass = null;
        this.targetSection = null;
        this.targetStudents.set([]);

        this.validateSourceAndTarget();
        this.validateAcademicYearGap();
    }

    onTargetClassChange() {
        this.targetSection = null;
        this.targetStudents.set([]);

        this.validateSourceAndTarget();
    }

    onTargetSectionChange() {
        if (!this.validateSourceAndTarget()) {
            this.targetSection = null;
            return;
        }

        if (!this.validateAcademicYearGap()) {
            this.targetSection = null;
            return;
        }

        this.loadTargetStudents();
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

        if (!this.validateSourceAndTarget() || !this.validateAcademicYearGap()) {
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
            departmentId: this.targetDepartment.id,
            classId: this.targetClass.id,
            className: this.targetClass.name,
            sectionId: this.targetSection.id,
            sectionName: this.targetSection.name,
            academicYear: this.targetDepartment.academicYear
        };

        console.log('Promotion Data:', promotionData);

        this.userService.promoteStudents(promotionData).subscribe({
            next: (response) => {
                const data = response.data;
                this.loadSourceStudents();
                this.loadTargetStudents();
                this.selectedStudents = [];
                this.loader.hide();

                if (data.failureCount > 0) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Partial Success',
                        detail: `Promoted ${data.successCount} students. Failed: ${data.failureCount}. Check console for details.`
                    });
                    console.error('Failed promotions:', data.errors);
                } else {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: `Successfully promoted ${data.successCount} student(s) to ${this.targetClass.name} - ${this.targetSection.name}`
                    });
                }
            },
            error: (error) => {
                console.error('Error promoting students:', error);
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Failed to promote students. Please try again.'
                });
            }
        });
    }

    openExitDialog(student: IProfileConfig) {
        this.studentToExit = student;
        this.showExitDialog = true;
    }

    confirmExit() {
        if (!this.studentToExit) return;

        this.showExitDialog = false;
        this.loader.show('Marking student as exited...');

        const exitData = {
            reason: this.exitReason || 'No reason provided',
            exitDate: new Date().toISOString().split('T')[0]
        };

        this.userService.markStudentAsExited(this.studentToExit.id, exitData).subscribe({
            next: () => {
                this.loadSourceStudents();
                this.selectedStudents = this.selectedStudents.filter((s) => s.id !== this.studentToExit!.id);
                this.studentToExit = null;
                this.exitReason = '';
                this.loader.hide();

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Student marked as exited successfully'
                });
            },
            error: (error) => {
                console.error('Error marking student as exited:', error);
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Failed to mark student as exited'
                });
            }
        });
    }

    openStudentDetails(student: IProfileConfig) {
        this.selectedStudentDetails = student;
        this.showStudentDetailsDialog = true;
    }

    getStatusSeverity(status: string): any {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'EXITED':
                return 'danger';
            case 'GRADUATED':
                return 'info';
            default:
                return 'secondary';
        }
    }
}
