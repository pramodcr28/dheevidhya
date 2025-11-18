import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Store } from '@ngrx/store';
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
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CommonService } from '../../core/services/common.service';
import { UserProfileState } from '../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments } from '../../core/store/user-profile/user-profile.selectors';
import { StaffAttendance, StaffAttendanceReport } from '../models/staff-attendence.mdel';
import { StaffAttendanceService } from '../service/staff-attendance.service';

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
        TabViewModule,
        ChartModule,
        MultiSelectModule,
        ProgressBarModule,
        InputTextModule,
        AvatarModule,
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService],
    templateUrl: './staff-attendance-management.component.html',
    styles: []
})
export class StaffAttendanceManagementComponent implements OnInit {
    activeTab = 0;
    loadingLogs = false;
    // loadingReport = false;
    // searchQuery = '';

    staffAttendanceService = inject(StaffAttendanceService);
    associatedDepartments: any[] = [];
    // selectedDepartments: any;
    private store = inject(Store<{ userProfile: UserProfileState }>);
    commonService = inject(CommonService);
    // todayStats = {
    //     present: 0,
    //     absent: 0,
    //     late: 0,
    //     leave: 0
    // };

    // departments: any[] = [
    //     { id: 'DEPT001', name: 'Computer Science' },
    //     { id: 'DEPT002', name: 'Mathematics' },
    //     { id: 'DEPT003', name: 'Physics' },
    //     { id: 'DEPT004', name: 'Chemistry' },
    //     { id: 'DEPT005', name: 'English' }
    // ];

    logFilters = {
        startDate: null as Date | null,
        endDate: null as Date | null,
        departments: [] as string[]
    };

    // reportFilters = {
    //     startDate: null as Date | null,
    //     endDate: null as Date | null,
    //     departments: [] as string[]
    // };

    attendanceLogs: StaffAttendance[] = [];
    filteredLogs: StaffAttendance[] = [];
    attendanceReport: StaffAttendanceReport[] = [];

    departmentChartData: any;
    monthlyTrendData: any;
    statusDistributionData: any;
    chartOptions: any;
    pieChartOptions: any;

    topPerformers: any[] = [];

    constructor(private messageService: MessageService) {
        this.initializeChartData();
    }

    ngOnInit() {
        this.store.select(getAssociatedDepartments).subscribe((departments) => {
            this.associatedDepartments = departments;
            this.logFilters.departments = this.associatedDepartments.map((dept) => dept.id);
        });
        this.loadAttendanceLogs();
    }

    // loadTodayStats() {
    //     const today = new Date().toISOString().split('T')[0];

    //     this.staffAttendanceService
    //         .searchAttendance({
    //             filters: {
    //                 attendanceDateRange: [today, today]
    //             },
    //             page: 0,
    //             size: 1000
    //         })
    //         .subscribe({
    //             next: (response) => {
    //                 const records = response.content;
    //                 this.todayStats = {
    //                     present: records.filter((r: any) => r.status === 'PRESENT').length,
    //                     absent: records.filter((r: any) => r.status === 'ABSENT').length,
    //                     late: records.filter((r: any) => r.status === 'LATE').length,
    //                     leave: records.filter((r: any) => r.status === 'LEAVE').length
    //                 };
    //             }
    //         });
    // }

    loadAttendanceLogs() {
        this.loadingLogs = true;
        const filters: any = {};

        if (this.logFilters.startDate) {
            filters['attendanceDate.gte'] = this.commonService.formatDateForApi(this.logFilters.startDate);
        }

        if (this.logFilters.endDate) {
            filters['attendanceDate.lte'] = this.commonService.formatDateForApi(this.logFilters.endDate);
        }

        if (this.logFilters.departments && this.logFilters.departments.length > 0) {
            filters['departmentId.in'] = this.logFilters.departments;
        }

        filters['branchId.like'] = this.commonService.getUserInfo?.branchId;

        this.staffAttendanceService.searchAttendance({ filters: filters, page: 0, size: 100 }).subscribe({
            next: (response) => {
                this.attendanceLogs = response.content;
                this.filteredLogs = [...this.attendanceLogs];
                this.loadingLogs = false;
            },
            error: () => {
                this.loadingLogs = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load attendance logs'
                });
            }
        });
    }

    // loadAttendanceReport() {
    //     this.loadingReport = true;
    //     const filters: any = {};

    //     if (this.reportFilters.startDate && this.reportFilters.endDate) {
    //         filters.attendanceDateRange = [this.reportFilters.startDate.toISOString().split('T')[0], this.reportFilters.endDate.toISOString().split('T')[0]];
    //     }

    //     this.staffAttendanceService
    //         .searchAttendance({
    //             filters,
    //             page: 0,
    //             size: 100
    //         })
    //         .subscribe({
    //             next: (response) => {
    //                 this.processReportData(response.content);
    //                 this.loadingReport = false;
    //                 this.updateChartData();
    //             },
    //             error: () => {
    //                 this.loadingReport = false;
    //                 this.messageService.add({
    //                     severity: 'error',
    //                     summary: 'Error',
    //                     detail: 'Failed to generate report'
    //                 });
    //             }
    //         });
    // }

    // processReportData(data: any[]) {
    //     const staffMap = new Map<string, any>();

    //     data.forEach((record) => {
    //         const key = record.staffId;
    //         if (!staffMap.has(key)) {
    //             staffMap.set(key, {
    //                 staffId: record.staffId,
    //                 staffName: record.staffName,
    //                 departmentName: record.departmentName || 'N/A',
    //                 presentDays: 0,
    //                 absentDays: 0,
    //                 lateDays: 0,
    //                 leaveDays: 0,
    //                 halfDays: 0,
    //                 totalDays: 0
    //             });
    //         }

    //         const staff = staffMap.get(key);
    //         staff.totalDays++;

    //         switch (record.status) {
    //             case 'PRESENT':
    //                 staff.presentDays++;
    //                 break;
    //             case 'ABSENT':
    //                 staff.absentDays++;
    //                 break;
    //             case 'LATE':
    //                 staff.lateDays++;
    //                 break;
    //             case 'LEAVE':
    //                 staff.leaveDays++;
    //                 break;
    //             case 'HALF_DAY':
    //                 staff.halfDays++;
    //                 break;
    //         }
    //     });

    //     this.attendanceReport = Array.from(staffMap.values()).map((staff) => ({
    //         ...staff,
    //         attendancePercentage: staff.totalDays > 0 ? Math.round((staff.presentDays / staff.totalDays) * 100) : 0
    //     }));
    // }

    // filterLogs() {
    //     if (!this.searchQuery.trim()) {
    //         this.filteredLogs = [...this.attendanceLogs];
    //         return;
    //     }

    //     const query = this.searchQuery.toLowerCase();
    //     this.filteredLogs = this.attendanceLogs.filter((log) => log.staffName?.toLowerCase().includes(query) || log.departmentName?.toLowerCase().includes(query));
    // }

    applyFilters() {
        this.loadAttendanceLogs();
    }

    // exportLogs() {
    //     this.messageService.add({
    //         severity: 'success',
    //         summary: 'Export Started',
    //         detail: 'Attendance logs are being exported...'
    //     });
    // }

    // exportReport() {
    //     this.messageService.add({
    //         severity: 'success',
    //         summary: 'Export Started',
    //         detail: 'Attendance report is being exported...'
    //     });
    // }

    getInitials(name: string): string {
        if (!name) return 'NA';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    getStatusSeverity(status: string): any {
        const severityMap: any = {
            PRESENT: 'success',
            ABSENT: 'danger',
            LATE: 'warn',
            LEAVE: 'info',
            HALF_DAY: 'warn',
            ON_DUTY: 'info'
        };
        return severityMap[status] || 'info';
    }

    // getProgressBarClass(percentage: number): string {
    //     if (percentage >= 90) return 'bg-green-500';
    //     if (percentage >= 75) return 'bg-yellow-500';
    //     return 'bg-red-500';
    // }

    // getPercentageColor(percentage: number): string {
    //     if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    //     if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400';
    //     return 'text-red-600 dark:text-red-400';
    // }

    initializeChartData() {
        this.departmentChartData = {
            labels: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'English'],
            datasets: [
                {
                    label: 'Present',
                    backgroundColor: '#22c55e',
                    borderRadius: 8,
                    data: [45, 38, 42, 35, 40]
                },
                {
                    label: 'Absent',
                    backgroundColor: '#ef4444',
                    borderRadius: 8,
                    data: [5, 7, 3, 8, 5]
                },
                {
                    label: 'Late',
                    backgroundColor: '#f97316',
                    borderRadius: 8,
                    data: [3, 4, 2, 5, 3]
                }
            ]
        };
        this.monthlyTrendData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Attendance %',
                    data: [92, 94, 91, 95, 93, 96],
                    fill: true,
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    tension: 0.4,
                    pointBackgroundColor: '#f97316',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }
            ]
        };
        this.statusDistributionData = {
            labels: ['Present', 'Absent', 'Late', 'Leave', 'Half Day'],
            datasets: [
                {
                    data: [450, 35, 28, 42, 15],
                    backgroundColor: ['#22c55e', '#ef4444', '#f97316', '#3b82f6', '#8b5cf6'],
                    borderWidth: 0
                }
            ]
        };
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        };
        this.pieChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        };
        this.topPerformers = [
            { name: 'John Doe', department: 'Computer Science', percentage: 98.5, present: 197, total: 200 },
            { name: 'Jane Smith', department: 'Mathematics', percentage: 97.2, present: 194, total: 200 },
            { name: 'Mike Johnson', department: 'Physics', percentage: 96.8, present: 193, total: 200 },
            { name: 'Sarah Williams', department: 'Chemistry', percentage: 95.5, present: 191, total: 200 }
        ];
    }

    // updateChartData() {
    //     if (this.attendanceReport.length === 0) return;

    //     const deptMap = new Map<string, any>();

    //     this.attendanceReport.forEach((report) => {
    //         if (!deptMap.has(report.departmentName)) {
    //             deptMap.set(report.departmentName, {
    //                 present: 0,
    //                 absent: 0,
    //                 late: 0
    //             });
    //         }
    //         const dept = deptMap.get(report.departmentName);
    //         dept.present += report.presentDays;
    //         dept.absent += report.absentDays;
    //         dept.late += report.lateDays;
    //     });

    //     const labels = Array.from(deptMap.keys());
    //     this.departmentChartData = {
    //         labels,
    //         datasets: [
    //             {
    //                 label: 'Present',
    //                 backgroundColor: '#22c55e',
    //                 borderRadius: 8,
    //                 data: labels.map((dept) => deptMap.get(dept).present)
    //             },
    //             {
    //                 label: 'Absent',
    //                 backgroundColor: '#ef4444',
    //                 borderRadius: 8,
    //                 data: labels.map((dept) => deptMap.get(dept).absent)
    //             },
    //             {
    //                 label: 'Late',
    //                 backgroundColor: '#f97316',
    //                 borderRadius: 8,
    //                 data: labels.map((dept) => deptMap.get(dept).late)
    //             }
    //         ]
    //     };

    //     this.topPerformers = this.attendanceReport
    //         .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
    //         .slice(0, 4)
    //         .map((r) => ({
    //             name: r.staffName,
    //             department: r.departmentName,
    //             percentage: r.attendancePercentage,
    //             present: r.presentDays,
    //             total: r.totalDays
    //         }));
    // }
}
