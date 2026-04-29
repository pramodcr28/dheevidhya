// holiday-list.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../core/services/common.service';
import { DheeConfirmationService } from '../../core/services/dhee-confirmation.service';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { APPROVAL_DOT_COLORS, APPROVAL_STATUS_COLORS, ApprovalStatus, Holiday, HOLIDAY_TYPE_COLORS, HOLIDAY_TYPE_ICONS, HOLIDAY_TYPE_LABELS, HolidayType } from '../models/holiday.model';
import { HolidayService } from '../service/holiday.service';
import { HolidayDialogComponent } from './holiday-dialog/holiday-dialog.component';

@Component({
    selector: 'app-holiday-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, ToastModule, ConfirmDialogModule, MultiSelectModule, SelectModule, TooltipModule, ConfirmationDialogComponent, HolidayDialogComponent, DialogModule],
    providers: [MessageService, ConfirmationService, DheeConfirmationService],
    templateUrl: './holiday-list.component.html'
})
export class HolidayListComponent implements OnInit {
    holidays = signal<Holiday[]>([]);
    totalItems = 0;
    itemsPerPage = 10;
    loading = false;

    // Filters
    selectedTypes: HolidayType[] = [];
    selectedStatus: ApprovalStatus | null = null;

    // Dialog
    showDialog = false;
    selectedHoliday: Holiday | null = null;

    // Reject dialog
    showRejectDialog = false;
    rejectReason = '';
    rejectTargetId = '';

    // Options
    typeOptions = Object.entries(HOLIDAY_TYPE_LABELS).map(([value, label]) => ({ label, value }));
    statusOptions: { label: string; value: ApprovalStatus }[] = [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' }
    ];

    // Map refs for template
    typeLabels = HOLIDAY_TYPE_LABELS;
    typeColors = HOLIDAY_TYPE_COLORS;
    typeIcons = HOLIDAY_TYPE_ICONS;
    statusColors = APPROVAL_STATUS_COLORS;
    statusDots = APPROVAL_DOT_COLORS;

    private lastLazyEvent: TableLazyLoadEvent | null = null;

    holidayService = inject(HolidayService);
    commonService = inject(CommonService);
    private msgService = inject(MessageService);
    private confirmService = inject(DheeConfirmationService);

    ngOnInit() {
        this.load(true);
    }

    load(reset = false) {
        if (reset) {
            this.lastLazyEvent = null;
        }
        this.fetchPage(0, this.itemsPerPage, 'startDate', 'DESC');
    }

    onLazyLoad(event: TableLazyLoadEvent) {
        this.lastLazyEvent = event;
        const page = Math.floor((event.first ?? 0) / (event.rows ?? this.itemsPerPage));
        const size = event.rows ?? this.itemsPerPage;
        const sortField = (event.sortField as string) ?? 'startDate';
        const sortDir = (event.sortOrder ?? -1) === 1 ? 'asc' : 'desc';
        this.fetchPage(page, size, sortField, sortDir);
    }

    generateHolidayListFilters() {
        const filters: any = {};

        if (this.selectedStatus) {
            filters['approvalStatus'] = this.selectedStatus;
        }

        if (this.selectedTypes?.length) {
            filters['holidayTypes'] = [...this.selectedTypes];
        }

        filters['targetAudience'] = {};

        this.commonService.getUserAuthorities.forEach((authority) => {
            if (authority === 'STUDENT' && this.commonService.getStudentInfo) {
                const s = this.commonService.getStudentInfo;

                filters['targetAudience'] = {
                    ACADEMIC_UNIT: [`${s.academicYear}:${s.departmentId}:${s.classId}:${s.sectionId}`],
                    STUDENT: [s.userId]
                };
            }

            if (authority !== 'STUDENT' && this.commonService.currentUser) {
                const u = this.commonService.currentUser;

                const targetIds: string[] = [];
                u.departments.forEach((d) => {
                    targetIds.push(`${u.academicYear}:${d.id}`);
                });

                filters['targetAudience'] = {
                    ACADEMIC_UNIT: targetIds,
                    STAFF: [u.userId]
                };
            }

            filters['targetAudience']['ROLE'] = [...(filters['targetAudience']['ROLE'] || []), authority];
            filters['targetAudience']['ALL'] = [];
            filters['createdBy'] = this.commonService.currentUser.userId;
        });

        return filters;
    }

    private fetchPage(page: number, size: number, sortBy: string, sortDirection: string) {
        this.loading = true;

        const request = {
            page,
            size,
            sortBy,
            sortDirection,
            filters: this.generateHolidayListFilters()
        };

        this.holidayService.search(request).subscribe({
            next: (res) => {
                this.holidays.set(res.content);
                this.totalItems = res.totalElements;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.toast('error', 'Error', 'Failed to load holidays');
            }
        });
    }

    clearFilters() {
        this.selectedTypes = [];
        this.selectedStatus = null;
        this.load(true);
    }

    openNew() {
        this.selectedHoliday = null;
        this.showDialog = true;
    }

    editHoliday(h: Holiday) {
        this.selectedHoliday = { ...h };
        this.showDialog = true;
    }

    onSave(h: Holiday) {
        this.showDialog = false;
        this.selectedHoliday = null;
        this.toast('success', 'Saved', `"${h.title}" has been saved`);
        this.load(true);
    }

    onCancel() {
        this.showDialog = false;
        this.selectedHoliday = null;
    }

    submitForApproval(h: Holiday) {
        this.confirmService.confirm({
            message: 'Submit for approval?',
            header: `Send "${h.title}" for review?`,
            accept: () => {
                this.holidayService.submit(h.id!).subscribe({
                    next: () => {
                        this.toast('success', 'Submitted', 'Holiday sent for approval');
                        this.load(true);
                    },
                    error: (e) => this.toast('error', 'Error', e?.error?.message ?? 'Submission failed')
                });
            }
        });
    }

    approveHoliday(h: Holiday) {
        this.confirmService.confirm({
            message: 'Approve holiday?',
            header: `Approve "${h.title}"? It will appear on all calendars.`,
            accept: () => {
                this.holidayService.approve(h.id!).subscribe({
                    next: () => {
                        this.toast('success', 'Approved', 'Holiday approved');
                        this.load(true);
                    },
                    error: (e) => this.toast('error', 'Error', e?.error?.message ?? 'Approval failed')
                });
            }
        });
    }

    openRejectDialog(h: Holiday) {
        this.rejectTargetId = h.id!;
        this.rejectReason = '';
        this.showRejectDialog = true;
    }

    confirmReject() {
        if (!this.rejectReason.trim()) {
            this.toast('warn', 'Required', 'Please enter a rejection reason');
            return;
        }
        this.holidayService.reject(this.rejectTargetId, this.rejectReason).subscribe({
            next: () => {
                this.showRejectDialog = false;
                this.toast('warn', 'Rejected', 'Holiday has been rejected');
                this.load(true);
            },
            error: (e) => this.toast('error', 'Error', e?.error?.message ?? 'Rejection failed')
        });
    }

    retractHoliday(h: Holiday) {
        this.confirmService.confirm({
            message: 'Retract holiday?',
            header: `Retract "${h.title}" back to draft?`,
            accept: () => {
                this.holidayService.retract(h.id!).subscribe({
                    next: () => {
                        this.toast('info', 'Retracted', 'Holiday moved back to draft');
                        this.load(true);
                    },
                    error: (e) => this.toast('error', 'Error', e?.error?.message ?? 'Retract failed')
                });
            }
        });
    }

    deleteHoliday(h: Holiday) {
        this.confirmService.confirm({
            message: 'Delete holiday?',
            header: `Permanently delete "${h.title}"?`,
            accept: () => {
                this.holidayService.delete(h.id!).subscribe({
                    next: () => {
                        this.toast('success', 'Deleted', 'Holiday deleted');
                        this.load(true);
                    },
                    error: (e) => this.toast('error', 'Error', e?.error?.message ?? 'Delete failed')
                });
            }
        });
    }

    canEdit(h: Holiday) {
        return h.approvalStatus === 'DRAFT' || h.approvalStatus === 'REJECTED';
    }
    canSubmit(h: Holiday) {
        return h.approvalStatus === 'DRAFT' || h.approvalStatus === 'REJECTED';
    }
    canApprove(h: Holiday) {
        return h.approvalStatus === 'PENDING_APPROVAL';
    }
    canReject(h: Holiday) {
        return h.approvalStatus === 'PENDING_APPROVAL';
    }
    canRetract(h: Holiday) {
        return h.approvalStatus === 'APPROVED' || h.approvalStatus === 'PENDING_APPROVAL';
    }
    canDelete(h: Holiday) {
        return h.approvalStatus !== 'APPROVED';
    }

    isAdmin(): boolean {
        let roles = ['HEAD_MASTER', 'HEAD_OF_DEPARTMENT', 'PRINCIPAL', 'IT_ADMINISTRATOR'];
        return this.commonService.getUserAuthorities?.some((a: any) => roles.includes(a)) ?? false;
    }

    getDateDisplay(h: Holiday): string {
        if (h.holidayType === 'WEEK_OFF') return `${this.capitalize(h.weekOffDay ?? '')}`;
        if (!h.startDate) return '—';
        if (!h.endDate || h.startDate === h.endDate) return h.startDate;
        return `${h.startDate} → ${h.endDate}`;
    }

    getDurationDays(h: Holiday): number {
        if (h.holidayType === 'WEEK_OFF') return 0;
        if (!h.startDate) return 0;
        const start = new Date(h.startDate).getTime();
        const end = new Date(h.endDate ?? h.startDate).getTime();
        return Math.ceil((end - start) / 86_400_000) + 1;
    }

    private capitalize(s: string) {
        return s ? s.charAt(0) + s.slice(1).toLowerCase() : '';
    }

    private toast(severity: string, summary: string, detail: string) {
        this.msgService.add({ severity, summary, detail, life: 3000 });
    }
}
