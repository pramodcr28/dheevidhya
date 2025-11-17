import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../core/services/common.service';
import { ApiLoaderService } from '../../core/services/loaderService';
import { Notice } from '../models/notification.model';
import { NotificationService } from '../service/notification.service';
import { NoticeAddComponent } from './notice-add/notice-add.component';

@Component({
    selector: 'app-school-notice-board',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, SelectModule, TagModule, ToastModule, DialogModule, DatePickerModule, TableModule, TooltipModule, NoticeAddComponent],
    providers: [MessageService, ConfirmationService],
    templateUrl: './school-notice-board.component.html',
    styles: []
})
export class SchoolNoticeBoardComponent implements OnInit {
    selectedCategory = 'ALL';
    noticeForm!: FormGroup;
    isDarkMode = false;
    addDialogVisible = false;
    deleteDialogVisible = false;
    isEditMode = false;
    selectedNotice: Notice | null = null;
    noticeToDelete: Notice | null = null;

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
    selectedPriority: string | null = null;
    // dateRange: Date[] | null = null;

    // Sorting
    sortField = 'publishedAt';
    sortOrder = 'desc';

    categoryOptions = [
        { label: 'All Categories', value: 'ALL', icon: 'pi pi-th-large', colorClass: 'bg-gray-500' },
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
        { label: 'All Priorities', value: null },
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
        this.sortField = (event.sortField as string) || 'publishedAt';
        this.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

        this.loadNotices();
    }

    loadNotices() {
        this.loading = true;
        this.loader.show('Fetching notices...');

        const filters: any = {
            'branchId.like': this.commonService.getUserInfo.branchId
        };

        // Category filter
        if (this.selectedCategory !== 'ALL') {
            filters['categoryType.equals'] = this.selectedCategory;
        }

        // Priority filter
        if (this.selectedPriority) {
            filters['priority.equals'] = this.selectedPriority;
        }

        // Search filter
        if (this.searchText.trim()) {
            filters['title.contains'] = this.searchText.trim();
        }

        // // Date range filter
        // if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
        //     filters['publishedAt.greaterThanOrEqual'] = this.formatDateForApi(this.dateRange[0]);
        //     filters['publishedAt.lessThanOrEqual'] = this.formatDateForApi(this.dateRange[1]);
        // }

        const request = {
            page: this.pageNumber,
            size: this.pageSize,
            sortBy: this.sortField,
            sortDirection: this.sortOrder,
            filters: filters
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
        this.selectedPriority = null;
        // this.dateRange = null;
        this.selectedCategory = 'ALL';
        this.onFilterChange();
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

    formatDateForApi(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
