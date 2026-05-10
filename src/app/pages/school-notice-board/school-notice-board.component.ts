import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../core/services/common.service';
import { DheeConfirmationService } from '../../core/services/dhee-confirmation.service';
import { ApiLoaderService } from '../../core/services/loaderService';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { Notice } from '../models/notification.model';
import { NotificationService } from '../service/notification.service';
import { NoticeAddComponent } from './notice-add/notice-add.component';
import { NoticeViewComponent } from './notice-view/notice-view.component';

@Component({
    selector: 'app-school-notice-board',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        CardModule,
        InputTextModule,
        SelectModule,
        TagModule,
        ToastModule,
        DialogModule,
        DatePickerModule,
        TableModule,
        TooltipModule,
        NoticeAddComponent,
        NoticeViewComponent,
        MultiSelect,
        ConfirmationDialogComponent
    ],
    providers: [MessageService, DheeConfirmationService],
    templateUrl: './school-notice-board.component.html',
    styles: []
})
export class SchoolNoticeBoardComponent implements OnInit {
    selectedCategories: string[] = [];
    noticeForm!: FormGroup;
    isDarkMode = false;
    addDialogVisible = false;
    deleteDialogVisible = false;
    isEditMode = false;
    selectedNotice: Notice | null = null;
    noticeToDelete: Notice | null = null;
    viewDialogVisible = false;
    noticeToView: Notice | null = null;

    notificationService = inject(NotificationService);
    loader = inject(ApiLoaderService);
    commonService = inject(CommonService);

    notices: Notice[] = [];
    totalRecords = 0;
    loading = false;

    // Pagination
    pageSize = 10;
    pageNumber = 0;

    // Filters
    searchText = '';
    selectedPriorities: string[] = [];
    // dateRange: Date[] | null = null;

    // Sorting
    sortField = 'lastModifiedDate';
    sortOrder = 'DESC';

    categoryOptions = [
        // { label: 'All Categories', value: 'ALL', icon: 'pi pi-th-large', colorClass: 'bg-gray-500' },
        { label: 'General', value: 'GENERAL', icon: 'pi pi-bell', colorClass: 'bg-yellow-500' },
        { label: 'Time Table', value: 'TIMETABLE', icon: 'pi pi-calendar', colorClass: 'bg-blue-500' },
        { label: 'Meeting', value: 'MEETING', icon: 'pi pi-users', colorClass: 'bg-emerald-500' },
        { label: 'Attendance', value: 'ATTENDANCE', icon: 'pi pi-check-circle', colorClass: 'bg-orange-500' },
        { label: 'Exam Announcement', value: 'EXAM_ANNOUNCEMENT', icon: 'pi pi-file-edit', colorClass: 'bg-red-500' },
        { label: 'Exam Result', value: 'EXAM_RESULT', icon: 'pi pi-trophy', colorClass: 'bg-green-500' },
        { label: 'Festival', value: 'FEST', icon: 'pi pi-heart', colorClass: 'bg-purple-500' },
        { label: 'Holiday', value: 'HOLIDAY', icon: 'pi pi-sun', colorClass: 'bg-amber-500' },
        { label: 'Appreciation', value: 'APPRECIATION', icon: 'pi pi-star', colorClass: 'bg-pink-500' },
        { label: 'School Achievement', value: 'SCHOOL_ACHIEVEMENT', icon: 'pi pi-trophy', colorClass: 'bg-teal-500' }
    ];

    priorityOptions = [
        { label: 'LOW', value: 'LOW', severity: 'success' as const },
        { label: 'MEDIUM', value: 'MEDIUM', severity: 'warn' as const },
        { label: 'HIGH', value: 'HIGH', severity: 'danger' as const }
    ];

    priorityFilterOptions = [
        // { label: 'All Priorities', value: null },
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' }
    ];

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.initializeForm();
    }

    ngOnInit() {}

    initializeForm() {
        this.noticeForm = this.fb.group({
            categoryType: ['', Validators.required],
            title: ['', [Validators.required, Validators.minLength(5)]],
            content: ['', [Validators.required, Validators.minLength(10)]],
            priority: ['MEDIUM', Validators.required]
        });
    }

    onLazyLoad(event: TableLazyLoadEvent) {
        this.pageNumber = (event.first ?? 0) / (event.rows ?? 10);
        this.pageSize = event.rows ?? 10;
        this.sortField = (event.sortField as string) || 'lastModifiedDate';
        this.sortOrder = event.sortOrder === 0 ? 'ASC' : 'DESC';

        this.loadNotices();
    }

    generateFilterParams() {
        const filters: any = {};
        if (this.selectedCategories.length) {
            filters['categoryTypes'] = [...this.selectedCategories];
        }
        if (this.selectedPriorities.length) {
            filters['priorities'] = this.selectedPriorities;
        }

        filters['targetAudience'] = {};
        this.commonService.getUserAuthorities.forEach((authority) => {
            if (authority == 'STUDENT' && this.commonService.getStudentInfo) {
                const studentInfo = this.commonService.getStudentInfo;
                filters['targetAudience'] = {
                    ACADEMIC_UNIT: [studentInfo.academicYear + ':' + studentInfo.departmentId + ':' + studentInfo.classId + ':' + studentInfo.sectionId],
                    STUDENT: [studentInfo.userId]
                };
            }
            if (authority != 'STUDENT' && this.commonService.currentUser) {
                const userInfo = this.commonService.currentUser;
                let targetIds = [];
                // this.commonService.currentUser.departments.forEach((d) => {
                //     targetIds.push(userInfo.academicYear + ':' + d.id);
                //     debugger;
                //     console.log(d.department);
                // });

                this.commonService.currentUser.departments.forEach((d) => {
                    targetIds.push(userInfo.academicYear + ':' + d.id);
                    const dept = d.department;
                    if (!dept?.classes) {
                        return;
                    }

                    dept.classes.forEach((cls) => {
                        if (!cls.sections) {
                            return;
                        }

                        cls.sections.forEach((sec) => {
                            // Section Teacher
                            if (sec.sectionTeacher === userInfo.userId) {
                                targetIds.push(`${userInfo.academicYear}:${d.id}:${cls.id}:${sec.id}`);

                                console.log('Section Teacher', {
                                    department: dept.name,
                                    class: cls.name,
                                    section: sec.name
                                });
                            }

                            // Subject Teacher
                            if (sec.subjects) {
                                sec.subjects.forEach((sub) => {
                                    if (sub.teacher === userInfo.userId) {
                                        targetIds.push(`${userInfo.academicYear}:${d.id}:${cls.id}:${sec.id}`);

                                        console.log('Subject Teacher', {
                                            subject: sub.name,
                                            department: dept.name,
                                            class: cls.name,
                                            section: sec.name
                                        });
                                    }
                                });
                            }
                        });
                    });
                });

                filters['targetAudience'] = {
                    ACADEMIC_UNIT: targetIds,
                    STAFF: [this.commonService.currentUser.userId]
                };
            }
            filters['targetAudience']['ROLE'] = [authority];
            filters['targetAudience']['ALL'] = [];
            filters['createdBy'] = this.commonService.currentUser.userId;
        });

        return filters;
    }

    loadNotices() {
        this.loading = true;
        this.loader.show('Fetching notices...');

        const request = {
            page: this.pageNumber,
            size: this.pageSize,
            sortBy: this.sortField,
            sortDirection: this.sortOrder,
            filters: this.generateFilterParams()
        };

        this.notificationService.search(request).subscribe({
            next: (result) => {
                this.notices = result.content;
                this.totalRecords = result.totalElements;
                this.loading = false;
                this.loader.hide();
            },
            error: (error) => {
                this.loading = false;
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load notices',
                    life: 3000
                });
            }
        });
    }

    onFilterChange() {
        this.pageNumber = 0;
        this.loadNotices();
    }

    clearFilters() {
        this.searchText = '';
        this.selectedPriorities = [];
        // this.dateRange = null;
        this.selectedCategories = [];
        this.onFilterChange();
    }

    viewNotice(notice: Notice) {
        this.noticeToView = { ...notice };
        this.viewDialogVisible = true;
    }

    closeViewDialog() {
        this.viewDialogVisible = false;
        this.noticeToView = null;
    }

    showAddDialog() {
        this.isEditMode = false;
        this.selectedNotice = null;
        this.addDialogVisible = true;
    }

    editNotice(notice: Notice) {
        this.isEditMode = true;
        this.selectedNotice = { ...notice };
        this.addDialogVisible = true;
    }

    deleteNotice(notice: Notice) {
        this.noticeToDelete = notice;
        this.deleteDialogVisible = true;
    }

    confirmDelete() {
        if (!this.noticeToDelete?.id) return;

        this.loader.show('Deleting notice...');
        // this.notificationService.delete(this.noticeToDelete.id).subscribe({
        //     next: () => {
        //         this.loader.hide();
        //         this.messageService.add({
        //             severity: 'success',
        //             summary: 'Deleted',
        //             detail: 'Notice deleted successfully',
        //             life: 3000
        //         });
        //         this.deleteDialogVisible = false;
        //         this.noticeToDelete = null;
        //         this.loadNotices();
        //     },
        //     error: () => {
        //         this.loader.hide();
        //         this.messageService.add({
        //             severity: 'error',
        //             summary: 'Error',
        //             detail: 'Failed to delete notice',
        //             life: 3000
        //         });
        //     }
        // });
    }

    saveNotice(formValue: any) {
        this.loader.show(this.isEditMode ? 'Updating notice...' : 'Publishing notice...');
        // this.isEditMode ? this.notificationService.update(this.selectedNotice!.id!, formValue) :
        const request = this.notificationService.create(formValue);

        request.subscribe({
            next: () => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Notice ${this.isEditMode ? 'updated' : 'published'} successfully!`,
                    life: 3000
                });
                this.closeDialog();
                this.loadNotices();
            },
            error: () => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Failed to ${this.isEditMode ? 'update' : 'publish'} notice`,
                    life: 3000
                });
            }
        });
    }

    closeDialog() {
        this.addDialogVisible = false;
        this.isEditMode = false;
        this.selectedNotice = null;
    }

    getCategoryLabel(categoryType: string): string {
        const category = this.categoryOptions.find((cat) => cat.value === categoryType);
        return category ? category.label.replace('All Categories', categoryType) : categoryType;
    }

    getCategoryIcon(categoryType: string): string {
        const category = this.categoryOptions.find((cat) => cat.value === categoryType);
        return category ? category.icon : 'pi pi-file';
    }

    getCategoryColorClass(categoryType: string): string {
        const category = this.categoryOptions.find((cat) => cat.value === categoryType);
        return category ? category.colorClass : 'bg-gray-500';
    }

    getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' {
        switch (priority) {
            case 'HIGH':
                return 'danger';
            case 'MEDIUM':
                return 'warn';
            case 'LOW':
                return 'success';
            default:
                return 'info';
        }
    }

    formatDate(dateString: string | null | undefined): string {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    formatTime(dateString: string | null | undefined): string {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
}
