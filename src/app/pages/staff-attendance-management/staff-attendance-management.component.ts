import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CommonService } from '../../core/services/common.service';
import { DheeSelectComponent } from '../../shared/dhee-select/dhee-select.component';
import { StaffAttendance, StaffAttendanceReport } from '../models/staff-attendence.mdel';
import { ITenantUser } from '../models/user.model';
import { StaffAttendanceService } from '../service/staff-attendance.service';
import { UserService } from '../service/user.service';

@Component({
    selector: 'app-staff-attendance-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ButtonModule,
        DatePickerModule,
        TableModule,
        TagModule,
        ToastModule,
        TabsModule,
        ChartModule,
        MultiSelectModule,
        ProgressBarModule,
        InputTextModule,
        AvatarModule,
        IconFieldModule,
        InputIconModule,
        DheeSelectComponent
    ],
    providers: [MessageService],
    templateUrl: './staff-attendance-management.component.html',
    styles: []
})
export class StaffAttendanceManagementComponent implements OnInit {
    // ── Tab state ──────────────────────────────────────────────
    activeTab: number | string = 0;

    // ── Shared ─────────────────────────────────────────────────
    staffAttendanceService = inject(StaffAttendanceService);
    // associatedDepartments: any[] = [];
    // private store = inject(Store<{ userProfile: UserProfileState }>);
    commonService = inject(CommonService);
    userService = inject(UserService);
    staffOptions: any[] = [];

    // ── Tab 1 – Attendance Logs ────────────────────────────────
    loadingLogs = false;
    logFilters = {
        startDate: null as Date | null,
        endDate: null as Date | null,
        departments: [] as string[],
        staffIds: [] as number[]
    };
    attendanceLogs: StaffAttendance[] = [];
    filteredLogs: StaffAttendance[] = [];
    attendanceReport: StaffAttendanceReport[] = [];

    // ── Tab 2 – Analytics ──────────────────────────────────────
    loadingAnalytics = false;
    analyticsFilters = {
        startDate: null as Date | null,
        endDate: null as Date | null,
        departments: [] as string[]
    };

    // Charts
    departmentChartData: any;
    monthlyTrendData: any;
    statusDistributionData: any;
    chartOptions: any;
    pieChartOptions: any;

    // Top performers from real data
    topPerformers: any[] = [];

    // Staff summary report table
    loadingReport = false;
    reportRows: StaffAttendanceReport[] = [];
    reportTotalRecords = 0;
    reportPage = 0;
    reportSize = 10;

    constructor(private messageService: MessageService) {
        this.initChartOptions();
    }

    ngOnInit() {
        // this.store.select(getAssociatedDepartments).subscribe((departments) => {
        //     this.associatedDepartments = departments;
        //     if (this.associatedDepartments?.length > 0) {
        //         this.logFilters.departments = this.associatedDepartments.map((d) => d.id);
        //         this.analyticsFilters.departments = this.associatedDepartments.map((d) => d.id);
        //     }
        // });
        this.loadAttendanceLogs();
        this.loadStaff();
    }

    // ── Tab switch ─────────────────────────────────────────────
    onTabChange(value: number | string) {
        this.activeTab = value;
        if (value === 1 && !this.departmentChartData?.labels?.length) {
            this.loadAnalytics();
        }
    }

    // ── Staff list ─────────────────────────────────────────────
    loadStaff(): void {
        const filterParams = {
            'branch_id.eq': this.commonService.branch?.id,
            'authorities.name.nin': ['IT_ADMINISTRATOR', 'STUDENT']
        };
        this.userService.userSearch(0, 1000, 'id', 'ASC', filterParams).subscribe({
            next: (res: any) => {
                this.staffOptions = (res.content || []).map((s: ITenantUser) => ({
                    label: `${s.firstName} ${s.lastName} (${s.login})`,
                    value: s.id
                }));
            },
            error: (err) => console.error('Failed to load staff', err)
        });
    }

    // ── TAB 1: Attendance Logs ─────────────────────────────────
    loadAttendanceLogs() {
        this.loadingLogs = true;
        const filters: any = {};

        if (this.logFilters.startDate) filters['attendanceDate.gte'] = this.commonService.formatDateForApi(this.logFilters.startDate);
        if (this.logFilters.endDate) filters['attendanceDate.lte'] = this.commonService.formatDateForApi(this.logFilters.endDate);
        if (this.logFilters.departments?.length) filters['departmentId.in'] = this.logFilters.departments;
        if (this.logFilters.staffIds?.length) filters['staffId.in'] = this.logFilters.staffIds.map((id) => id.toString());

        filters['branchId.eq'] = this.commonService.branch?.id?.toString() || '';

        this.staffAttendanceService.searchAttendance({ filters, page: 0, size: 100 }).subscribe({
            next: (response) => {
                this.attendanceLogs = response.content;
                this.filteredLogs = [...this.attendanceLogs];
                this.loadingLogs = false;
            },
            error: () => {
                this.loadingLogs = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load attendance logs' });
            }
        });
    }

    applyFilters() {
        this.loadAttendanceLogs();
    }

    // ── TAB 2: Analytics ───────────────────────────────────────
    applyAnalyticsFilters() {
        this.loadAnalytics();
        this.loadReportTable(0);
    }

    loadAnalytics() {
        this.loadingAnalytics = true;

        const payload: any = {
            branchIds: [this.commonService.branch?.id?.toString()],
            departmentIds: this.analyticsFilters.departments?.length ? this.analyticsFilters.departments : undefined,
            startDate: this.analyticsFilters.startDate ? this.commonService.formatDateForApi(this.analyticsFilters.startDate) : undefined,
            endDate: this.analyticsFilters.endDate ? this.commonService.formatDateForApi(this.analyticsFilters.endDate) : undefined
        };

        this.staffAttendanceService.getAnalytics(payload).subscribe({
            next: (data) => {
                this.buildDepartmentChart(data.departmentStats);
                this.buildMonthlyTrendChart(data.monthlyTrend);
                this.buildStatusDistributionChart(data.statusDistribution);
                this.topPerformers = (data.topPerformers || []).map((p: any) => ({
                    name: p.staffName,
                    department: p.departmentName,
                    percentage: p.attendancePercentage,
                    present: p.presentDays,
                    total: p.totalDays
                }));
                this.loadingAnalytics = false;
            },
            error: () => {
                this.loadingAnalytics = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load analytics' });
            }
        });

        this.loadReportTable(0);
    }

    loadReportTable(page: number) {
        this.loadingReport = true;
        this.reportPage = page;

        const filters: any = {
            branchIds: [this.commonService.branch?.id?.toString()]
        };
        if (this.analyticsFilters.departments?.length) filters.departmentIds = this.analyticsFilters.departments;
        if (this.analyticsFilters.startDate && this.analyticsFilters.endDate) filters.attendanceDateRange = [this.commonService.formatDateForApi(this.analyticsFilters.startDate), this.commonService.formatDateForApi(this.analyticsFilters.endDate)];

        this.staffAttendanceService.generateReport({ filters, page, size: this.reportSize }).subscribe({
            next: (res) => {
                this.reportRows = res.content as any;
                this.reportTotalRecords = res.totalElements;
                this.loadingReport = false;
            },
            error: () => {
                this.loadingReport = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load report' });
            }
        });
    }

    onReportPage(event: any) {
        this.loadReportTable(event.page);
    }

    // ── Chart builders ─────────────────────────────────────────
    private buildDepartmentChart(deptStats: any[]) {
        this.departmentChartData = {
            labels: deptStats.map((d) => d.departmentName),
            datasets: [
                { label: 'Present', backgroundColor: '#22c55e', borderRadius: 6, data: deptStats.map((d) => d.presentDays) },
                { label: 'Absent', backgroundColor: '#ef4444', borderRadius: 6, data: deptStats.map((d) => d.absentDays) },
                { label: 'Late', backgroundColor: '#f97316', borderRadius: 6, data: deptStats.map((d) => d.lateDays) },
                { label: 'Leave', backgroundColor: '#3b82f6', borderRadius: 6, data: deptStats.map((d) => d.leaveDays) }
            ]
        };
    }

    private buildMonthlyTrendChart(trends: any[]) {
        this.monthlyTrendData = {
            labels: trends.map((t) => t.month),
            datasets: [
                {
                    label: 'Attendance %',
                    data: trends.map((t) => t.attendancePercentage),
                    fill: true,
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249,115,22,0.1)',
                    tension: 0.4,
                    pointBackgroundColor: '#f97316',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }
            ]
        };
    }

    private buildStatusDistributionChart(dist: any) {
        if (!dist) return;
        this.statusDistributionData = {
            labels: ['Present', 'Absent', 'Late', 'Leave', 'Half Day'],
            datasets: [
                {
                    data: [dist.present, dist.absent, dist.late, dist.leave, dist.halfDay],
                    backgroundColor: ['#22c55e', '#ef4444', '#f97316', '#3b82f6', '#8b5cf6'],
                    borderWidth: 0
                }
            ]
        };
    }

    private initChartOptions() {
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, font: { size: 12 } } }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        };
        this.pieChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, font: { size: 12 } } }
            }
        };
    }

    // ── Helpers ────────────────────────────────────────────────
    getInitials(name: string): string {
        if (!name) return 'NA';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' | 'secondary' | 'contrast' {
        const map: any = { PRESENT: 'success', ABSENT: 'danger', LATE: 'warn', LEAVE: 'info', HALF_DAY: 'warn' };
        return map[status] || 'info';
    }

    getAttendanceBadgeClass(pct: number): string {
        if (pct >= 90) return 'text-green-600 dark:text-green-400';
        if (pct >= 75) return 'text-orange-500 dark:text-orange-400';
        return 'text-red-500 dark:text-red-400';
    }
}
