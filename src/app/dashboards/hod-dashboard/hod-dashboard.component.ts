import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from '../../core/services/common.service';
import { DashboardService, HodDashboardResponse } from '../../pages/service/dashboard.service';

@Component({
    selector: 'app-hod-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, TagModule, TabViewModule, DividerModule, BadgeModule, TooltipModule, SkeletonModule],
    templateUrl: './hod-dashboard.component.html'
})
export class HodDashboardComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    data: HodDashboardResponse | null = null;
    loading = true;
    error: string | null = null;

    currentMonthYear = new Date();

    get upcomingExams() {
        return (this.data?.exams ?? []).filter((e) => e.status == 'SCHEDULED' || e.status === 'DRAFT');
    }
    get ongoingExams() {
        return (this.data?.exams ?? []).filter((e) => e.status == 'ONGOING');
    }
    get pastExams() {
        return (this.data?.exams ?? []).filter((e) => e.status == 'RESULT_DECLARED');
    }

    commonService = inject(CommonService);
    dashboardService = inject(DashboardService);
    router = inject(Router);

    ngOnInit(): void {
        const staffId = this.commonService.currentUser?.userId;
        const academicYear = this.commonService.currentUser.academicYear;
        const departmentId = this.commonService.associatedDepartments?.[0]?.id;
        const branchId = this.commonService.branch?.id?.toString();
        this.dashboardService
            .getHodDashboard(staffId, departmentId, branchId, academicYear)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.data = res;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = 'Failed to load dashboard.';
                    this.loading = false;
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getAttStatusClass(s: string) {
        const m: Record<string, string> = {
            PRESENT: 'bg-green-50 text-green-700 border-green-200',
            ABSENT: 'bg-red-50 text-red-700 border-red-200',
            LATE: 'bg-amber-50 text-amber-700 border-amber-200',
            LEAVE: 'bg-blue-50 text-blue-700 border-blue-200',
            ON_DUTY: 'bg-teal-50 text-teal-700 border-teal-200'
        };
        return m[s] ?? 'bg-gray-50 text-gray-500 border-gray-200';
    }

    getInvStatusClass(s: string) {
        const m: Record<string, string> = {
            ASSIGNED: 'bg-green-50 text-green-700 border-green-200',
            IN_USE: 'bg-blue-50 text-blue-700 border-blue-200',
            AVAILABLE: 'bg-gray-50 text-gray-600 border-gray-200',
            UNDER_MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',
            DAMAGED: 'bg-red-50 text-red-700 border-red-200'
        };
        return m[s] ?? 'bg-gray-50 text-gray-500 border-gray-200';
    }

    getInvStatusLabel(s: string) {
        const m: Record<string, string> = { ASSIGNED: 'Issued', IN_USE: 'In Use', AVAILABLE: 'Returned', UNDER_MAINTENANCE: 'Maintenance', DAMAGED: 'Damaged' };
        return m[s] ?? s;
    }

    getExamStatusClass(s: string) {
        const m: Record<string, string> = { SCHEDULED: 'bg-green-50 text-green-700 border-green-200', DRAFT: 'bg-amber-50 text-amber-700 border-amber-200', ONGOING: 'bg-blue-50 text-blue-700 border-blue-200' };
        return m[s] ?? 'bg-gray-50 text-gray-500 border-gray-200';
    }

    getNoticeDotClass(p: string) {
        return p === 'HIGH' ? 'bg-red-500' : p === 'MEDIUM' ? 'bg-amber-400' : 'bg-blue-400';
    }
    getExamDate(d: string) {
        const dt = new Date(d);
        return { day: dt.getDate().toString(), month: dt.toLocaleString('default', { month: 'short' }).toUpperCase() };
    }
    getAvatarColors() {
        return ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-red-500', 'bg-teal-500'];
    }

    viewAllNotices() {
        this.router.navigate(['./notice-board']);
    }

    viewAllExams() {
        this.router.navigate(['./examination']);
    }

    viewAllInventory() {
        this.router.navigate(['./inventory/assets']);
    }
    viewAllStaffAttendance() {
        this.router.navigate(['./attendance-management']);
    }
}
