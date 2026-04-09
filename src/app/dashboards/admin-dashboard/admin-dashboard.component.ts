import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from '../../core/services/common.service';
import { AdminDashboardResponse, DashboardService } from '../../pages/service/dashboard.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, TagModule, ButtonModule, TimelineModule, AvatarModule, BadgeModule, TooltipModule, DividerModule, ChartModule, SkeletonModule],
    templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    data: AdminDashboardResponse | null = null;
    loading = true;
    error: string | null = null;
    chartData: any;
    chartOptions: any;

    quickActions = [
        { label: 'Create Dept', icon: 'pi pi-building', action: 'createDept' },
        { label: 'Add Staff', icon: 'pi pi-user-plus', action: 'addStaff' },
        { label: 'Add Student', icon: 'pi pi-graduation-cap', action: 'addStudent' },
        { label: 'Schedule Exam', icon: 'pi pi-calendar-plus', action: 'scheduleExam' }
    ];
    commonService = inject(CommonService);
    dashboardService = inject(DashboardService);

    ngOnInit(): void {
        const staffId = this.commonService.currentUser?.userId;
        const branchId = this.commonService.branch?.id?.toString();
        const academicYear = this.commonService.currentUser.academicYear;

        this.dashboardService
            .getAdminDashboard(staffId, branchId, academicYear)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.data = res;
                    this.loading = false;
                    this.buildChart();
                },
                error: (err) => {
                    this.error = 'Failed to load dashboard. Please refresh.';
                    this.loading = false;
                    console.error('Admin dashboard error:', err);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    buildChart(): void {
        if (!this.data?.loginTrend) return;
        this.chartData = {
            labels: this.data.loginTrend.map((d) => d.day),
            datasets: [
                {
                    label: 'Students',
                    data: this.data.loginTrend.map((d) => d.students),
                    backgroundColor: 'rgba(249,115,22,0.80)',
                    borderRadius: 6
                },
                {
                    label: 'Staff',
                    data: this.data.loginTrend.map((d) => d.staff),
                    backgroundColor: 'rgba(249,115,22,0.25)',
                    borderRadius: 6
                }
            ]
        };
        this.chartOptions = {
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: { grid: { color: '#898989' }, ticks: { font: { size: 11 } } }
            },
            responsive: true,
            maintainAspectRatio: false
        };
    }

    getHealthColor(status: string): string {
        return status === 'ok' ? '#22C55E' : status === 'warn' ? '#F59E0B' : '#EF4444';
    }

    getHealthBarClass(status: string): string {
        return status === 'ok' ? 'bg-green-500' : status === 'warn' ? 'bg-amber-400' : 'bg-red-500';
    }

    getTimelineIconClass(type: string): string {
        const map: Record<string, string> = {
            success: 'bg-green-100 text-green-600',
            warning: 'bg-amber-100 text-amber-600',
            info: 'bg-blue-100  text-blue-600',
            danger: 'bg-red-100   text-red-600'
        };
        return map[type] ?? 'bg-gray-100 ';
    }

    getNoticeDotClass(priority: string): string {
        return priority === 'HIGH' ? 'bg-red-500' : priority === 'MEDIUM' ? 'bg-amber-400' : 'bg-blue-400';
    }

    handleQuickAction(action: string): void {
        console.log('Quick action:', action);
    }
}
