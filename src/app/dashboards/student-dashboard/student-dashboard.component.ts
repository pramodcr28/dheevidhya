import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from '../../core/services/common.service';
import { AssignmentSummaryDTO, DashboardService, StudentDashboardResponse } from '../../pages/service/dashboard.service';

@Component({
    selector: 'app-student-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, TagModule, TabViewModule, DividerModule, BadgeModule, TooltipModule, ChartModule, SkeletonModule],
    templateUrl: './student-dashboard.component.html'
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    data: StudentDashboardResponse | null = null;
    loading = true;
    error: string | null = null;

    attChartData: any;
    attChartOptions: any;
    router = inject(Router);
    get upcomingExams() {
        return (this.data?.exams ?? []).filter((e) => e.status === 'SCHEDULED');
    }
    get ongoingExams() {
        return (this.data?.exams ?? []).filter((e) => e.status === 'ONGOING');
    }
    get pastExams() {
        return (this.data?.exams ?? []).filter((e) => e.status === 'RESULT_DECLARED');
    }

    commonService = inject(CommonService);
    dashboardService = inject(DashboardService);

    getSubjectAttBadgeClass(status: string): string {
        return (
            {
                GOOD: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
                WARNING: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
                CRITICAL: 'bg-red-50   text-red-700   dark:bg-red-950   dark:text-red-400'
            }[status] ?? ''
        );
    }

    getNoticeBadgeClass(priority: string): string {
        const map: Record<string, string> = {
            HIGH: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
            MEDIUM: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
            LOW: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
        };
        return map[priority] ?? 'bg-gray-100  dark:bg-gray-800 ';
    }

    ngOnInit(): void {
        const studentId = this.commonService.currentUser?.userId;
        const academicYear = this.commonService.currentUser.academicYear;
        const departmentId = this.commonService.associatedDepartments?.[0]?.id;

        this.dashboardService
            .getStudentDashboard(studentId, departmentId, academicYear)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.data = res;
                    this.loading = false;
                    this.buildDonut();
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

    buildDonut(): void {
        const a = this.data?.attendance;
        if (!a) return;
        this.attChartData = {
            datasets: [
                {
                    data: [a.totalPresent, a.totalAbsent, a.totalLate],
                    backgroundColor: ['#22C55E', '#EF4444', '#F59E0B'],
                    borderWidth: 0,
                    hoverOffset: 4
                }
            ]
        };
        this.attChartOptions = {
            cutout: '74%',
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            responsive: true,
            maintainAspectRatio: false
        };
    }

    getAssignmentBadgeClass(a: AssignmentSummaryDTO): string {
        if (a.submissionStatus === 'REVIEWED') return 'bg-green-50 text-green-700 border-green-200';
        if (a.submissionStatus === 'SUBMITTED') return 'bg-blue-50 text-blue-700 border-blue-200';
        if (a.status === 'OVERDUE') return 'bg-red-50 text-red-700 border-red-200';
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    getAssignmentBadgeLabel(a: AssignmentSummaryDTO): string {
        if (a.submissionStatus === 'REVIEWED' && a.grade) return `Graded · ${a.grade}`;
        if (a.submissionStatus === 'SUBMITTED') return 'Submitted';
        if (a.status === 'OVERDUE') return 'Overdue';
        return 'Pending';
    }

    getSubjectAttClass(s: string) {
        return s === 'GOOD' ? 'text-green-600' : s === 'WARNING' ? 'text-amber-600' : 'text-red-600';
    }
    getSubjectAttBarClass(s: string) {
        return s === 'GOOD' ? 'bg-green-500' : s === 'WARNING' ? 'bg-amber-400' : 'bg-red-500';
    }
    getExamCountdownClass(d: string) {
        const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
        return diff <= 3 ? 'bg-red-50 text-red-700 border-red-200' : diff <= 7 ? 'bg-amber-50 text-amber-700 border-amber-200' : diff <= 14 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200';
    }
    getDaysUntil(d: string) {
        const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
        return diff <= 0 ? 'Today' : `${diff} days`;
    }
    getExamDate(d: string) {
        const dt = new Date(d);
        return { day: dt.getDate().toString(), month: dt.toLocaleString('default', { month: 'short' }).toUpperCase() };
    }
    getNoticeDotClass(p: string) {
        return p === 'HIGH' ? 'bg-red-500' : p === 'MEDIUM' ? 'bg-amber-400' : 'bg-blue-400';
    }
    getSubjectColor(i: number) {
        return ['bg-orange-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500'][i % 5];
    }
    getInitials() {
        return (this.data?.profile?.fullName ?? 'XX')
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }
    viewAllAssignments() {
        this.router.navigate(['./home/assignment']);
    }

    viewAllNotifications() {
        this.router.navigate(['./home/notice-board']);
    }
    viewAllExams() {
        this.router.navigate(['./home/examination']);
    }

    getExamStatusClass(s: string) {
        const m: Record<string, string> = {
            SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
            DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
            ONGOING: 'bg-green-50 text-green-700 border-green-200',
            CANCELLED: 'bg-red-50 text-red-700 border-red-200'
        };
        return m[s] ?? 'bg-gray-50  border-gray-200';
    }
}
