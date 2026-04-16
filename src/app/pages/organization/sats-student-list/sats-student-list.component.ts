import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../../core/services/common.service';
import { DheeConfirmationService } from '../../../core/services/dhee-confirmation.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { MasterClassService } from '../../../core/services/master-class.service';
import { MasterDepartmentService } from '../../../core/services/master-department.service';
import { MasterSectionService } from '../../../core/services/master-section.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { IStudent, NewStudent, createNewStudent } from '../../models/student.model';
import { StudentServiceService } from '../../service/student-service.service';
import { SatsStudentDialogComponent } from '../sats-student-dialog/sats-student-dialog.component';

interface StudentFilter {
    name?: string;
    deptName?: string[];
    admissionClass?: string[];
    section?: string[];
    academicYear?: string;
    socialCategory?: string[];
    gender?: string[];
}

@Component({
    selector: 'app-sats-student-list',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        DropdownModule,
        MultiSelectModule,
        ConfirmationDialogComponent,
        SatsStudentDialogComponent,
        TooltipModule,
        DialogModule
    ],
    templateUrl: './sats-student-list.component.html',
    providers: [MessageService, DheeConfirmationService]
})
export class SatsStudentListComponent {
    studentService = inject(StudentServiceService);
    messageService = inject(MessageService);
    confirmationService = inject(DheeConfirmationService);
    loader = inject(ApiLoaderService);
    commonService = inject(CommonService);
    masterClassService = inject(MasterClassService);
    masterSectionService = inject(MasterSectionService);
    masterDepartmentService = inject(MasterDepartmentService);

    students = signal<IStudent[]>([]);
    selectedStudent = signal<IStudent | NewStudent | null>(null);
    studentDialogVisible = signal<boolean>(false);

    isLoading = false;
    totalItems = 0;
    page = 0;
    itemsPerPage = 20;
    sortField = 'id';
    sortOrder: 'ASC' | 'DESC' = 'DESC';

    showFilters = signal<boolean>(false);
    filters: StudentFilter = {};

    expandedRows: any;
    classOptions = signal<any[]>([]);
    sectionOptions = signal<any[]>([]);
    departmentOptions = signal<any[]>([]);

    genderOptions = [
        { label: 'Male', value: 'MALE' },
        { label: 'Female', value: 'FEMALE' },
        { label: 'Other', value: 'OTHER' }
    ];

    socialCategoryOptions = [
        { label: 'General', value: 'GENERAL' },
        { label: 'OBC', value: 'OBC' },
        { label: 'SC', value: 'SC' },
        { label: 'ST', value: 'ST' },
        { label: 'Other', value: 'OTHER' }
    ];

    showExitDialog = false;
    exitReason = '';
    exitReasonTouched = false;
    pendingExitStudent: IStudent | null = null;

    ngOnInit(): void {
        this.loadFilterOptions();
        this.load();
    }

    /** Load class / section / department master options — same as student-list */
    loadFilterOptions(): void {
        this.masterClassService.query().subscribe((result: any) => {
            this.classOptions.set(result.body?.map((cls: any) => ({ label: cls.name, value: cls.name })) || []);
        });
        this.masterSectionService.query().subscribe((result: any) => {
            this.sectionOptions.set(result.body?.map((section: any) => ({ label: section.name, value: section.name })) || []);
        });
        this.masterDepartmentService.query().subscribe((result: any) => {
            this.departmentOptions.set(result.body?.map((dept: any) => ({ label: dept.name, value: dept.name })) || []);
        });
    }

    buildFilters(): Record<string, any> {
        const criteria: Record<string, any> = {};

        criteria['branchId.equals'] = this.commonService.branch?.id;

        if (this.filters.deptName?.length) {
            criteria['latestAcademicYear.roles.student.deptName.in'] = this.filters.deptName;
        }
        if (this.filters.admissionClass?.length) {
            criteria['admissionDetails.admissionClass.in'] = this.filters.admissionClass;
        }
        if (this.filters.section?.length) {
            criteria['admissionDetails.section.in'] = this.filters.section;
        }
        if (this.filters.gender?.length) {
            criteria['studentDetails.gender.in'] = this.filters.gender;
        }

        return criteria;
    }

    get hasActiveFilters(): boolean {
        return !!(this.filters.name || this.filters.deptName?.length || this.filters.admissionClass?.length || this.filters.section?.length || this.filters.academicYear || this.filters.socialCategory?.length || this.filters.gender?.length);
    }

    load(): void {
        this.loader.show('Fetching Student Data');
        this.isLoading = true;

        this.studentService
            .search({
                page: this.page,
                size: this.itemsPerPage,
                sortBy: this.sortField,
                sortDirection: this.sortOrder,
                filters: this.buildFilters()
            })
            .subscribe({
                next: (res: any) => {
                    this.students.set(res.content || []);
                    this.totalItems = res.totalElements || 0;
                    this.loader.hide();
                    this.isLoading = false;
                },
                error: () => {
                    this.loader.hide();
                    this.isLoading = false;
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load student data' });
                }
            });
    }

    onPageChange(event: any): void {
        this.page = event.first / event.rows;
        this.itemsPerPage = event.rows;
        this.load();
    }

    onSort(event: any): void {
        this.sortField = event.field;
        this.sortOrder = event.order === 1 ? 'ASC' : 'DESC';
        this.load();
    }

    applyFilters(): void {
        this.page = 0;
        this.load();
    }

    clearFilters(): void {
        this.filters = {};
        this.page = 0;
        this.load();
    }

    toggleFilters(): void {
        this.showFilters.set(!this.showFilters());
    }

    openNew(): void {
        this.selectedStudent.set(createNewStudent());
        this.studentDialogVisible.set(true);
    }

    editStudent(student: IStudent): void {
        this.selectedStudent.set({ ...student });
        this.studentDialogVisible.set(true);
    }

    onSave(student: IStudent | NewStudent): void {
        this.loader.show('Saving Student...');
        const obs = (student as IStudent).id ? this.studentService.update(student as IStudent) : this.studentService.create(student as NewStudent);

        obs.subscribe({
            next: () => {
                this.loader.hide();
                this.studentDialogVisible.set(false);
                this.load();
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Student record saved successfully' });
            },
            error: (err: any) => {
                this.loader.hide();
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to save student' });
            }
        });
    }

    onCancel(): void {
        this.studentDialogVisible.set(false);
    }

    deleteStudent(student: IStudent) {
        this.pendingExitStudent = student;
        this.exitReason = student.latestAcademicYear?.exitReason ?? '';
        this.exitReasonTouched = false;
        this.showExitDialog = true;
    }
    confirmExit() {
        this.exitReasonTouched = true;

        if (!this.exitReason?.trim()) {
            return; // Block submission if empty
        }

        const student = this.pendingExitStudent!;
        this.showExitDialog = false;
        this.loader.show('Exiting Student');

        this.studentService.delete(student.id, this.exitReason.trim()).subscribe({
            next: () => {
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Student exited successfully'
                });
                this.resetExitDialog();
            },
            error: () => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to exit student'
                });
                this.resetExitDialog();
            }
        });
    }

    cancelExit() {
        this.showExitDialog = false;
        this.resetExitDialog();
    }

    private resetExitDialog() {
        this.pendingExitStudent = null;
        this.exitReason = '';
        this.exitReasonTouched = false;
    }

    // deleteStudent(student: IStudent) {
    //     const name = student.studentDetails?.studentName?.firstName ?? 'this student';
    //     this.confirmationService.confirm({
    //         message: `Are you sure you want to exit ${name}?`,
    //         header: 'Exit Confirmation',
    //         icon: 'pi pi-exclamation-triangle',
    //         accept: () => {
    //             this.loader.show('Exiting Student');

    //             this.studentService.delete(student.id).subscribe({
    //                 next: (res) => {
    //                     this.load();
    //                     this.messageService.add({
    //                         severity: 'success',
    //                         summary: 'Success',
    //                         detail: 'Student exited successfully'
    //                     });
    //                 },
    //                 error: (error) => {
    //                     this.loader.hide();
    //                     this.messageService.add({
    //                         severity: 'error',
    //                         summary: 'Error',
    //                         detail: 'Failed to exit student'
    //                     });
    //                 }
    //             });
    //         }
    //     });
    // }

    getStudentFullName(student: IStudent): string {
        const n = student.studentDetails?.studentName;
        return [n?.firstName, n?.middleName, n?.lastName].filter(Boolean).join(' ') || '—';
    }

    /** Returns father name if available, falls back to mother name */
    getGuardianName(student: IStudent): string {
        const sd = student.studentDetails;
        const father = [sd?.fatherName?.firstName, sd?.fatherName?.lastName].filter(Boolean).join(' ');
        const mother = [sd?.motherName?.firstName, sd?.motherName?.lastName].filter(Boolean).join(' ');
        return father || mother || '—';
    }

    getGenderTag(gender: string | null | undefined): { label: string; severity: any } {
        switch (gender) {
            case 'MALE':
                return { label: 'Male', severity: 'info' };
            case 'FEMALE':
                return { label: 'Female', severity: 'success' };
            default:
                return { label: gender ?? '—', severity: 'secondary' };
        }
    }

    avatarBg(index: number): string {
        const colors = ['bg-amber-100', 'bg-emerald-100', 'bg-sky-100', 'bg-rose-100', 'bg-indigo-100', 'bg-purple-100', 'bg-teal-100', 'bg-orange-100'];
        return colors[index % colors.length];
    }

    avatarText(index: number): string {
        const colors = ['text-amber-800', 'text-emerald-800', 'text-sky-800', 'text-rose-800', 'text-indigo-800', 'text-purple-800', 'text-teal-800', 'text-orange-800'];
        return colors[index % colors.length];
    }

    getStatusSeverity(status: string): any {
        const map: Record<string, string> = {
            ACTIVE: 'success',
            PROMOTED: 'info',
            EXITED: 'danger',
            INACTIVE: 'warn'
        };
        return map[status] ?? 'secondary';
    }

    getStatusIcon(status: string): string {
        const map: Record<string, string> = {
            ACTIVE: 'pi-check-circle',
            PROMOTED: 'pi-arrow-up-right',
            EXITED: 'pi-sign-out',
            INACTIVE: 'pi-ban'
        };
        return map[status] ?? '';
    }

    formatLabel(value: string): string {
        if (!value) return '';
        return value.replace(/_/g, ' ').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }
}
