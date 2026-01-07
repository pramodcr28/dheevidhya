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
// TabsModule is now correct for v18+
import { TabsModule } from 'primeng/tabs';
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
        TabsModule, // Ensure this is imported for the new tabs structure
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
    // The 'value' property in p-tabs corresponds to this.
    // In v18, value can be a number or a string.
    activeTab: number | string = 0;

    loadingLogs = false;
    staffAttendanceService = inject(StaffAttendanceService);
    associatedDepartments: any[] = [];
    private store = inject(Store<{ userProfile: UserProfileState }>);
    commonService = inject(CommonService);

    logFilters = {
        startDate: null as Date | null,
        endDate: null as Date | null,
        departments: [] as string[]
    };

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
            if (this.associatedDepartments?.length > 0) {
                this.logFilters.departments = this.associatedDepartments.map((dept) => dept.id);
            }
        });
        this.loadAttendanceLogs();
    }

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

        filters['branchId.eq'] = this.commonService.branch?.id?.toString() || '';

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

    applyFilters() {
        this.loadAttendanceLogs();
    }

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
        const severityMap: { [key: string]: 'success' | 'danger' | 'warn' | 'info' } = {
            PRESENT: 'success',
            ABSENT: 'danger',
            LATE: 'warn',
            LEAVE: 'info',
            HALF_DAY: 'warn',
            ON_DUTY: 'info'
        };
        return severityMap[status] || 'info';
    }

    initializeChartData() {
        // ... (Chart data remains unchanged as it is compatible with ChartModule)
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
                        font: { size: 12 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                    grid: { display: false }
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
                        font: { size: 12 }
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
}
