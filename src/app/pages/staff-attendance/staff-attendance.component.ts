import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ConfirmationService, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { CommonService } from '../../core/services/common.service';
import { StaffAttendance } from '../models/staff-attendence.mdel';
import { StaffAttendanceService } from '../service/staff-attendance.service';

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    attendance: StaffAttendance | null;
}

@Component({
    selector: 'app-staff-attendance',
    standalone: true,
    imports: [DatePickerModule, CommonModule, FormsModule, SelectModule, CardModule, ButtonModule, TagModule, ToastModule, ConfirmDialogModule, AvatarModule, ChartModule, DialogModule, TextareaModule, FloatLabelModule, InputTextModule],
    providers: [MessageService, ConfirmationService, DatePipe],
    templateUrl: './staff-attendance.component.html',
    styles: `
        @keyframes bounce-subtle {
            0%,
            100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-4px);
            }
        }

        @keyframes ping-slow {
            0% {
                transform: scale(1);
                opacity: 1;
            }
            75%,
            100% {
                transform: scale(1.1);
                opacity: 0;
            }
        }

        .animate-bounce-subtle {
            animation: bounce-subtle 2s ease-in-out infinite;
        }

        .animate-ping-slow {
            animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
    `
})
export class StaffAttendanceComponent implements OnInit {
    loading = false;
    currentTime = '';
    currentViewDate = new Date();

    private datePipe = inject(DatePipe);
    staffAttendanceService = inject(StaffAttendanceService);
    commonService = inject(CommonService);

    userInfo: any = null;
    todayAttendance: StaffAttendance | null = null;

    chartData: any;
    chartOptions: any;

    calendarDays: CalendarDay[] = [];
    weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    attendanceHistory: StaffAttendance[] = [];
    monthlyAttendanceMap: Map<string, StaffAttendance> = new Map();

    showDetailDialog = false;
    selectedDayAttendance: StaffAttendance | null = null;

    statusOptions = [
        { label: 'Present', value: 'PRESENT' },
        { label: 'Absent', value: 'ABSENT' }
        // { label: 'Late', value: 'LATE' },
        // { label: 'Leave', value: 'LEAVE' }
        // { label: 'Half Day', value: 'HALF_DAY' },
        // { label: 'On Duty', value: 'ON_DUTY' }
    ];

    monthStats = {
        present: 0,
        absent: 0,
        late: 0,
        // leave: 0,
        halfDay: 0,
        total: 0,
        percentage: 0
    };

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.userInfo = this.commonService.getUserInfo;
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);

        this.loadTodayAttendance();
        this.loadMonthlyAttendance();
        this.initializeChart();
    }

    updateCurrentTime() {
        const now = new Date();
        this.currentTime = this.datePipe.transform(now, 'hh:mm:ss a') || '';
    }

    initializeChart() {
        this.chartData = {
            labels: ['Present', 'Absent', 'Late'],
            datasets: [
                {
                    data: [0, 0, 0, 0],
                    backgroundColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)', 'rgb(59,130,246)', 'rgb(249, 115, 22)'],
                    borderWidth: 0
                }
            ]
        };

        this.chartOptions = {
            cutout: '75%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: (context: any) => {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${value} days`;
                        }
                    }
                }
            }
        };
    }

    updateChart() {
        if (this.chartData) {
            this.chartData.datasets[0].data = [this.monthStats.present, this.monthStats.absent, this.monthStats.late];
            this.chartData = { ...this.chartData };
        }
    }

    getAvatarInitials(fullName: string): string {
        if (!fullName) return '';
        return fullName
            .split(' ')
            .map((name) => name.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    loadTodayAttendance() {
        const todayStr = this.datePipe.transform(new Date(), 'yyyy-MM-dd');

        this.staffAttendanceService
            .searchAttendance({
                filters: {
                    staffId: this.userInfo?.userId,
                    attendanceDateRange: [todayStr, todayStr]
                },
                page: 0,
                size: 1
            })
            .subscribe({
                next: (response) => {
                    if (response.content && response.content.length > 0) {
                        this.todayAttendance = response.content[0];
                    }
                }
            });
    }

    checkIn() {
        const now = new Date();
        const attendance: StaffAttendance = {
            staffId: this.userInfo.userId,
            staffName: this.userInfo.fullName,
            branchId: this.userInfo.branchId,
            branchName: this.userInfo.branchName,
            attendanceDate: this.datePipe.transform(now, 'yyyy-MM-dd'),
            checkInTime: this.datePipe.transform(now, 'HH:mm:ss'),
            status: 'PRESENT'
        };

        this.staffAttendanceService.addAttendance(attendance).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Checked In',
                    detail: 'Your attendance has been recorded'
                });
                this.loadTodayAttendance();
                this.loadMonthlyAttendance();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to check in'
                });
            }
        });
    }

    private normalizeTime(value: any): string | null {
        if (!value) return null;

        // 🔹 If already a string in HH:mm or HH:mm:ss → return as is
        if (typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
            return value;
        }

        // 🔹 If it's a valid Date object or ISO string → convert to time
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString('en-GB', { hour12: false });
        }

        console.warn('Invalid time format:', value);
        return null;
    }

    loadMonthlyAttendance() {
        this.loading = true;
        const startOfMonth = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth(), 1);
        const endOfMonth = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth() + 1, 0);

        const startStr = this.datePipe.transform(startOfMonth, 'yyyy-MM-dd');
        const endStr = this.datePipe.transform(endOfMonth, 'yyyy-MM-dd');

        this.staffAttendanceService
            .searchAttendance({
                filters: {
                    'staffId.like': this.userInfo?.userId
                },
                page: 0,
                size: 100
            })
            .subscribe({
                next: (response) => {
                    this.attendanceHistory = response.content;
                    this.buildMonthlyAttendanceMap();
                    this.generateCalendar();
                    this.calculateMonthStats();
                    this.updateChart();
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load attendance data'
                    });
                }
            });
    }

    getIconBasedOnStataus(status: string): string {
        const iconMap: any = {
            PRESENT: 'pi pi-check-circle mr-1  text-green-600 dark:text-green-500',
            ABSENT: 'pi pi-times-circle mr-1 text-red-600 dark:text-red-500',
            // LATE: 'pi pi-clock mr-1 text-orange-600 dark:text-orange-500',
            LEAVE: 'pi pi-calendar-minus mr-1 text-blue-600 dark:text-blue-500'
            // HALF_DAY: 'pi pi-adjust mr-1 text-yellow-600 dark:text-yellow-500',
            // ON_DUTY: 'pi pi-briefcase mr-1 text-teal-600 dark:text-teal-500'
        };
        return iconMap[status] || 'pi-info-circle';
    }

    buildMonthlyAttendanceMap() {
        this.monthlyAttendanceMap.clear();
        this.attendanceHistory.forEach((attendance) => {
            const dateKey = this.datePipe.transform(new Date(String(attendance.attendanceDate)), 'yyyy-MM-dd');
            if (dateKey) {
                this.monthlyAttendanceMap.set(dateKey, attendance);
            }
        });
    }

    generateCalendar() {
        this.calendarDays = [];
        const year = this.currentViewDate.getFullYear();
        const month = this.currentViewDate.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();

        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        const lastDate = lastDay.getDate();

        // Previous month's trailing days
        const prevMonth = new Date(year, month, 0);
        const prevMonthLastDate = prevMonth.getDate();

        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthLastDate - i);
            this.calendarDays.push({
                date,
                isCurrentMonth: false,
                isToday: this.isToday(date),
                attendance: null
            });
        }

        // Current month's days
        for (let i = 1; i <= lastDate; i++) {
            const date = new Date(year, month, i);
            const dateKey = this.datePipe.transform(date, 'yyyy-MM-dd');
            const isToday = this.isToday(date);
            this.calendarDays.push({
                date,
                isCurrentMonth: true,
                isToday: isToday,
                attendance: dateKey ? this.monthlyAttendanceMap.get(dateKey) || null : null
            });

            if (isToday) {
                this.todayAttendance = dateKey ? this.monthlyAttendanceMap.get(dateKey) || null : null;
            }
        }

        // Next month's leading days
        const remainingDays = 42 - this.calendarDays.length; // 6 rows * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i);
            this.calendarDays.push({
                date,
                isCurrentMonth: false,
                isToday: this.isToday(date),
                attendance: null
            });
        }
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }

    calculateMonthStats() {
        this.monthStats = {
            present: 0,
            absent: 0,
            late: 0,
            // leave: 0,
            halfDay: 0,
            total: this.attendanceHistory.length,
            percentage: 0
        };

        this.attendanceHistory.forEach((record) => {
            switch (record.status) {
                case 'PRESENT':
                    this.monthStats.present++;
                    break;
                case 'ABSENT':
                    this.monthStats.absent++;
                    break;
                // case 'LATE':
                //     this.monthStats.late++;
                //     break;
                // case 'LEAVE':
                //     this.monthStats.leave++;
                //     break;
                // case 'HALF_DAY':
                //     this.monthStats.halfDay++;
                //     break;
            }
        });

        if (this.monthStats.total > 0) {
            this.monthStats.percentage = Math.round((this.monthStats.present / this.monthStats.total) * 100);
        }
    }

    previousMonth() {
        this.currentViewDate = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth() - 1, 1);
        this.loadMonthlyAttendance();
    }

    nextMonth() {
        this.currentViewDate = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth() + 1, 1);
        this.loadMonthlyAttendance();
    }

    onDayClick(day: CalendarDay) {
        if (!day.isCurrentMonth) return;

        if (day.attendance) {
            // View/Edit existing attendance
            this.selectedDayAttendance = { ...day.attendance };
            this.showDetailDialog = true;
        } else {
            // Check if date is in the past or today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(day.date);
            selectedDate.setHours(0, 0, 0, 0);

            if (selectedDate <= today) {
                // Create new attendance for past date or today
                this.selectedDayAttendance = {
                    staffId: this.userInfo.userId,
                    staffName: this.userInfo.fullName,
                    branchId: this.userInfo.branchId,
                    branchName: this.userInfo.branchName,
                    attendanceDate: this.datePipe.transform(day.date, 'yyyy-MM-dd'),
                    status: 'PRESENT',
                    checkInTime: null,
                    checkOutTime: null
                };
                this.showDetailDialog = true;
            } else {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Future Date',
                    detail: 'Cannot add attendance for future dates'
                });
            }
        }
    }

    // updateAttendanceStatus() {
    //     // Status updated in the dialog
    // }

    saveAttendanceChanges() {
        if (!this.selectedDayAttendance) return;

        this.staffAttendanceService.addAttendance({ ...this.selectedDayAttendance, checkInTime: this.normalizeTime(this.selectedDayAttendance.checkInTime), checkOutTime: this.normalizeTime(this.selectedDayAttendance.checkOutTime) }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Attendance updated successfully'
                });
                this.showDetailDialog = false;
                this.loadTodayAttendance();
                this.loadMonthlyAttendance();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update attendance'
                });
            }
        });
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

    exportDailyReport() {
        const headers = ['Date', 'Status', 'Check-In', 'Check-Out'];
        const rows = this.attendanceHistory.map((record) => [record.attendanceDate, record.status, record.checkInTime || '-', record.checkOutTime || '-']);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance-${this.datePipe.transform(this.currentViewDate, 'yyyy-MM')}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.messageService.add({
            severity: 'success',
            summary: 'Exported',
            detail: 'Monthly report downloaded successfully'
        });
    }

    checkOut() {
        if (!this.todayAttendance) return;

        const now = new Date();
        const updatedAttendance = {
            ...this.todayAttendance,
            checkOutTime: this.datePipe.transform(now, 'HH:mm:ss')
        };

        this.staffAttendanceService.addAttendance(updatedAttendance).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Checked Out',
                    detail: 'Your check-out has been recorded'
                });
                this.loadTodayAttendance();
                this.loadMonthlyAttendance();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to check out'
                });
            }
        });
    }

    getDayClasses(day: any) {
        const classes: any = {};

        classes['bg-white dark:bg-gray-800 border'] = day.isCurrentMonth && !day.attendance;
        classes['bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-40'] = !day.isCurrentMonth;
        classes['ring-2 ring-blue-100 dark:ring-blue-900'] = day.isToday;

        if (day.isCurrentMonth && day.attendance) {
            classes['hover:bg-gray-50 dark:hover:bg-gray-700'] = true;

            switch (day.attendance.status) {
                case 'PRESENT':
                    classes['border-green-500 dark:border-green-400'] = true;
                    break;

                case 'ABSENT':
                    classes['border-red-500 dark:border-red-400'] = true;
                    break;

                case 'LEAVE':
                    classes['border-blue-500 dark:border-blue-400'] = true;
                    break;

                // case 'HALF_DAY':
                //     classes['border-yellow-500 dark:border-yellow-400'] = true;
                //     break;

                default:
                    classes['border-gray-300 dark:border-gray-600'] = true;
                    break;
            }
        }

        return classes;
    }
}
