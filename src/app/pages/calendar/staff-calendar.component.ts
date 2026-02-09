import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ConfirmationService, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ChipModule } from 'primeng/chip';
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
import { Notice } from '../models/notification.model';
import { StaffAttendance } from '../models/staff-attendence.mdel';
import { NotificationService } from '../service/notification.service';
import { StaffAttendanceService } from '../service/staff-attendance.service';

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    attendance: StaffAttendance | null;
    events: Notice[];
}

interface EventIndicator {
    icon: string;
    color: string;
}

@Component({
    selector: 'app-staff-attendance-calendar',
    standalone: true,
    imports: [DatePickerModule, CommonModule, FormsModule, SelectModule, CardModule, ButtonModule, TagModule, ToastModule, ConfirmDialogModule, AvatarModule, ChartModule, DialogModule, TextareaModule, FloatLabelModule, InputTextModule, ChipModule],
    providers: [MessageService, ConfirmationService, DatePipe],
    templateUrl: './staff-calendar.component.html',
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

        .event-cell {
            position: relative;
            overflow: visible;
        }

        .events-indicator {
            position: absolute;
            top: 2px;
            right: 2px;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 1px;
        }
    `
})
export class StaffAttendanceComponent implements OnInit {
    loading = false;
    currentTime = '';
    currentViewDate = new Date();

    private datePipe = inject(DatePipe);
    // userInfo: any = {};

    todayAttendance: StaffAttendance | null = null;

    chartData: any;
    chartOptions: any;

    calendarDays: CalendarDay[] = [];
    weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Separate data sources
    attendanceHistory: StaffAttendance[] = [];
    events: Notice[] | any = [];
    showDetailDialog = false;
    showEventsDialog = false;
    selectedDayAttendance: StaffAttendance | null = null;
    selectedDayEvents: Notice[] = [];
    selectedDayDate: Date | null = null;
    hasEvents = false;
    hasEventsToday = false;

    statusOptions = [
        { label: 'Present', value: 'PRESENT' },
        { label: 'Absent', value: 'ABSENT' },
        { label: 'Leave', value: 'LEAVE' },
        { label: 'On Duty', value: 'ON_DUTY' }
    ];

    monthStats = {
        present: 0,
        absent: 0,
        onDuty: 0,
        leave: 0,
        total: 0,
        percentage: 0
    };

    commonService = inject(CommonService);
    constructor(private messageService: MessageService) {}
    staffAttendanceService = inject(StaffAttendanceService);
    notificationService = inject(NotificationService);

    ngOnInit() {
        this.loadMonthlyAttendance();
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
        this.initializeChart();
        this.checkTodayEvents();
    }

    updateCurrentTime() {
        const now = new Date();
        this.currentTime = this.datePipe.transform(now, 'hh:mm:ss a') || '';
    }

    checkTodayEvents() {
        const today = new Date();
        const todayEvents = this.getEventsForDate(today);
        this.hasEventsToday = todayEvents.length > 0;
    }

    initializeChart() {
        this.chartData = {
            labels: ['Present', 'Absent', 'Leave', 'On Duty'],
            datasets: [
                {
                    data: [0, 0, 0, 0],
                    backgroundColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)', 'rgb(59, 130, 246)', 'rgb(249, 115, 22)'],
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
            this.chartData.datasets[0].data = [this.monthStats.present, this.monthStats.absent, this.monthStats.leave, this.monthStats.onDuty];
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

    loadMonthlyData() {
        this.loading = true;
        this.generateCalendar();
        this.calculateMonthStats();
        this.updateChart();
        this.loading = false;
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
                    'staffId.like': this.commonService.getUserInfo?.userId,
                    'attendanceDate.gte': startStr,
                    'attendanceDate.lte': endStr
                },
                page: 0,
                size: 100
            })
            .subscribe({
                next: (response) => {
                    this.attendanceHistory = response.content;
                    const request = {
                        page: 0,
                        size: 100,
                        sortBy: 'id',
                        sortDirection: 'desc',
                        filters: {
                            categoryTypes: ['HOLIDAY']
                        }
                    };
                    this.notificationService.search(request).subscribe((result) => {
                        this.events = result.content;
                        this.generateCalendar();
                        this.calculateMonthStats();
                        this.updateChart();
                        this.loading = false;
                        this.checkTodayEvents();
                    });
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

    getEventsForDate(date: Date): Notice[] {
        const dateKey = this.datePipe.transform(date, 'yyyy-MM-dd') || '';
        const dayOfWeek = date.getDay();
        return this.events.filter((event) => {
            if (event.holiday.holidayType === 'Week_off') {
                const dayMap: { [key: string]: number } = {
                    SUNDAY: 0,
                    MONDAY: 1,
                    TUESDAY: 2,
                    WEDNESDAY: 3,
                    THURSDAY: 4,
                    FRIDAY: 5,
                    SATURDAY: 6
                };

                const weekOffDay = event.holiday.weekOffDay || 'SUNDAY';
                return dayOfWeek === dayMap[weekOffDay.toUpperCase()];
            }

            if (!event.holiday.holidayStartDate) return false;

            const startDate = new Date(event.holiday.holidayStartDate);
            const endDate = event.holiday.holidayEndDate ? new Date(event.holiday.holidayEndDate) : new Date(event.holiday.holidayStartDate);

            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            return checkDate >= startDate && checkDate <= endDate;
        });
    }

    generateCalendar() {
        this.calendarDays = [];
        const year = this.currentViewDate.getFullYear();
        const month = this.currentViewDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();

        const lastDay = new Date(year, month + 1, 0);
        const lastDate = lastDay.getDate();

        const prevMonth = new Date(year, month, 0);
        const prevMonthLastDate = prevMonth.getDate();

        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthLastDate - i);
            this.calendarDays.push({
                date,
                isCurrentMonth: false,
                isToday: this.isToday(date),
                attendance: this.attendanceHistory.find((attendance) => attendance.attendanceDate === this.datePipe.transform(date, 'yyyy-MM-dd')) || null,
                events: this.getEventsForDate(date)
            });
        }

        for (let i = 1; i <= lastDate; i++) {
            const date = new Date(year, month, i);
            const dateKey = this.datePipe.transform(date, 'yyyy-MM-dd') || '';
            const isToday = this.isToday(date);

            this.calendarDays.push({
                date,
                isCurrentMonth: true,
                isToday: isToday,
                attendance: this.attendanceHistory.find((attendance) => attendance.attendanceDate === dateKey) || null,
                events: this.getEventsForDate(date)
            });

            if (isToday) {
                this.todayAttendance = this.attendanceHistory.find((attendance) => attendance.attendanceDate === dateKey) || null;
            }
        }

        // Next month's leading days
        const remainingDays = 42 - this.calendarDays.length;
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i);
            this.calendarDays.push({
                date,
                isCurrentMonth: false,
                isToday: this.isToday(date),
                attendance: this.attendanceHistory.find((attendance) => attendance.attendanceDate === this.datePipe.transform(date, 'yyyy-MM-dd')) || null,
                events: this.getEventsForDate(date)
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
            leave: 0,
            onDuty: 0,
            total: 0,
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
                case 'LEAVE':
                    this.monthStats.leave++;
                    break;
                case 'ON_DUTY':
                    this.monthStats.onDuty++;
                    break;
            }
        });

        this.monthStats.total = this.attendanceHistory.length;

        if (this.monthStats.total > 0) {
            this.monthStats.percentage = Math.round((this.monthStats.present / this.monthStats.total) * 100);
        }
    }

    previousMonth() {
        this.currentViewDate = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth() - 1, 1);
        this.loadMonthlyData();
    }

    nextMonth() {
        this.currentViewDate = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth() + 1, 1);
        this.loadMonthlyData();
    }

    onDayClick(day: CalendarDay) {
        if (!day.isCurrentMonth) return;

        // Check if it has events first
        if (day.events.length > 0) {
            this.selectedDayEvents = day.events;
            this.selectedDayDate = day.date;
            this.showEventsDialog = true;
            return;
        }

        // Check if date is in the past or today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(day.date);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Future Date',
                detail: 'Cannot add attendance for future dates'
            });
            return;
        }

        if (day.attendance) {
            this.selectedDayAttendance = { ...day.attendance };
        } else {
            this.selectedDayAttendance = {
                staffId: this.commonService.getUserInfo.userId,
                staffName: this.commonService.getUserInfo.fullName,
                branchId: this.commonService.branch?.id?.toString() || '',
                departmentId: this.commonService.getUserInfo.departmentId,
                departmentName: this.commonService.getUserInfo.departmentName,
                branchName: this.commonService.branch?.name || '',
                attendanceDate: this.datePipe.transform(day.date, 'yyyy-MM-dd') || '',
                status: 'PRESENT',
                checkInTime: undefined,
                checkOutTime: undefined
            };
        }

        this.hasEvents = day.events.length > 0;
        this.showDetailDialog = true;
    }

    private normalizeTime(value: any): string | null {
        if (!value) return null;

        if (typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
            return value;
        }

        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString('en-GB', { hour12: false });
        }

        console.warn('Invalid time format:', value);
        return null;
    }

    saveAttendanceChanges() {
        if (!this.selectedDayAttendance) return;

        const { checkInTime, checkOutTime } = this.selectedDayAttendance;
        const normalizedCheckIn = new Date(checkInTime);
        const normalizedCheckOut = new Date(checkOutTime);
        const now = new Date();

        if (!checkInTime || !checkOutTime) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Check-in time and Check-out time are required.'
            });
            return;
        }

        if (normalizedCheckIn > now) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Check-in Time',
                detail: 'Check-in time cannot be in the future.'
            });
            return;
        }

        if (normalizedCheckOut > now) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Check-out Time',
                detail: 'Check-out time cannot be in the future.'
            });
            return;
        }

        this.staffAttendanceService
            .addAttendance({
                ...this.selectedDayAttendance,
                checkInTime: this.normalizeTime(this.selectedDayAttendance.checkInTime),
                checkOutTime: this.normalizeTime(this.selectedDayAttendance.checkOutTime)
            })
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Attendance updated successfully'
                    });
                    this.showDetailDialog = false;
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

    checkIn() {
        const now = new Date();
        const attendance: StaffAttendance = {
            staffId: this.commonService.getUserInfo.userId,
            staffName: this.commonService.getUserInfo.fullName,
            departmentId: this.commonService.getUserInfo.departmentId,
            departmentName: this.commonService.getUserInfo.departmentName,
            branchId: this.commonService.branch?.id?.toString() || '',
            branchName: this.commonService.branch?.name || '',
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

    getStatusSeverity(status: string): any {
        const severityMap: any = {
            PRESENT: 'success',
            ABSENT: 'danger',
            LEAVE: 'info',
            ON_DUTY: 'warn'
        };
        return severityMap[status] || 'info';
    }

    getIconBasedOnStatus(status: string): string {
        const iconMap: any = {
            PRESENT: 'pi pi-check-circle text-green-600 dark:text-green-500 text-sm',
            ABSENT: 'pi pi-times-circle text-red-600 dark:text-red-500 text-sm',
            LEAVE: 'pi pi-calendar-minus text-blue-600 dark:text-blue-500 text-sm',
            ON_DUTY: 'pi pi-clock text-orange-600 dark:text-orange-500 text-sm'
        };
        return iconMap[status] || 'pi pi-info-circle text-sm';
    }

    exportDailyReport() {
        const headers = ['Date', 'Status', 'Check-In', 'Check-Out', 'Remarks'];
        const rows = this.attendanceHistory
            .filter((record) => {
                const date = new Date(record.attendanceDate);
                return date.getFullYear() === this.currentViewDate.getFullYear() && date.getMonth() === this.currentViewDate.getMonth();
            })
            .map((record) => [record.attendanceDate, record.status, record.checkInTime || '-', record.checkOutTime || '-', record.remarks || '-']);

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

    // Event-related helper methods
    isSingleDayEvent(event: Notice): boolean {
        if (event.holiday.holidayType === 'Week_off') return true;

        if (!event.holiday.holidayEndDate) return true;

        const startDate = new Date(event.holiday.holidayStartDate);
        const endDate = new Date(event.holiday.holidayEndDate);

        return startDate.getTime() === endDate.getTime();
    }

    getEventDuration(event: Notice): number {
        if (event.holiday.holidayType === 'Week_off') return 1;

        const startDate = new Date(event.holiday.holidayStartDate);
        const endDate = event.holiday.holidayEndDate ? new Date(event.holiday.holidayEndDate) : new Date(event.holiday.holidayStartDate);

        const timeDiff = endDate.getTime() - startDate.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

        return dayDiff;
    }

    getWeekOffDayName(event: Notice): string {
        if (event.holiday.holidayType !== 'Week_off') return '';

        const dayMap: { [key: string]: string } = {
            SUNDAY: 'Sunday',
            MONDAY: 'Monday',
            TUESDAY: 'Tuesday',
            WEDNESDAY: 'Wednesday',
            THURSDAY: 'Thursday',
            FRIDAY: 'Friday',
            SATURDAY: 'Saturday'
        };

        const weekOffDay = event.holiday.weekOffDay || 'SUNDAY';
        return dayMap[weekOffDay.toUpperCase()] || 'Sunday';
    }

    getEventTypeDisplay(eventType: string): string {
        const typeMap: { [key: string]: string } = {
            Week_off: 'Weekly Off',
            Government: 'Government Holiday',
            Festival: 'Festival',
            Company: 'Company Holiday',
            Emergency: 'Emergency Holiday',
            Weather: 'Weather Holiday'
        };
        return typeMap[eventType] || eventType;
    }

    getEventTypeColor(eventType: string): string {
        const colorMap: any = {
            Week_off: 'bg-amber-100 text-amber-400 dark:bg-amber-900 dark:text-amber-200',
            Government: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            Festival: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
            Company: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
            Emergency: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            Weather: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };
        return colorMap[eventType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }

    getEventIcon(eventType: string): string {
        const iconMap: any = {
            Week_off: 'pi pi-calendar-clock',
            Government: 'pi pi-flag-fill',
            Festival: 'pi pi-star-fill',
            Company: 'pi pi-building',
            Emergency: 'pi pi-exclamation-triangle',
            Weather: 'pi pi-cloud'
        };
        return iconMap[eventType] || 'pi pi-calendar';
    }

    // Check if this day is the start of an event
    isEventStart(day: CalendarDay): boolean {
        if (day.events.length === 0) return false;

        const currentDate = this.datePipe.transform(day.date, 'yyyy-MM-dd');

        // Check if any regular event starts on this day
        return day.events.some((event) => {
            if (event.holiday.holidayType === 'Week_off') return false;

            const eventStart = this.datePipe.transform(new Date(event.holiday.holidayStartDate), 'yyyy-MM-dd');
            return currentDate === eventStart;
        });
    }

    // Check if this day is the end of an event
    isEventEnd(day: CalendarDay): boolean {
        if (day.events.length === 0) return false;

        const currentDate = this.datePipe.transform(day.date, 'yyyy-MM-dd');

        // Check if any regular event ends on this day
        return day.events.some((event) => {
            if (event.holiday.holidayType === 'Week_off') return true; // Week_off events are considered both start and end

            if (!event.holiday.holidayEndDate) return false;

            const eventEnd = this.datePipe.transform(new Date(event.holiday.holidayEndDate), 'yyyy-MM-dd');
            return currentDate === eventEnd;
        });
    }

    // Check if day has Week_off events
    hasWeekOffEvent(events: Notice[]): boolean {
        return events.some((event) => event.holiday.holidayType === 'Week_off');
    }

    // Check if day has regular events (non Week_off)
    hasRegularEvents(events: Notice[]): boolean {
        return events.some((event) => event.holiday.holidayType !== 'Week_off');
    }

    // Get event indicators for calendar display
    getEventIndicators(events: Notice[]): EventIndicator[] {
        const indicators: EventIndicator[] = [];

        // Add Week_off events first
        const weekOffEvents = events.filter((event) => event.holiday.holidayType === 'Week_off');
        if (weekOffEvents.length > 0) {
            indicators.push({
                icon: 'pi pi-calendar-clock',
                color: 'text-amber-500'
            });
        }

        // Add regular events (limit to 2 for display)
        const regularEvents = events.filter((event) => event.holiday.holidayType !== 'Week_off');
        for (let i = 0; i < Math.min(regularEvents.length, 2 - indicators.length); i++) {
            indicators.push({
                icon: 'pi pi-star-fill',
                color: 'text-purple-500'
            });
        }

        return indicators;
    }

    getCellBorderClass(day: CalendarDay): string {
        if (!day.isCurrentMonth) {
            return 'border-gray-200 dark:border-gray-700';
        }

        if (day.events.length > 0) {
            // Week_off events - dashed amber border
            if (this.hasWeekOffEvent(day.events)) {
                return 'border-amber-200 dark:border-amber-400 border-2 border-dashed rounded-lg';
            }

            // Regular events - solid purple border
            if (this.isEventStart(day) && this.isEventEnd(day)) {
                return 'border-purple-500 dark:border-purple-400 border-2 rounded-lg';
            } else if (this.isEventStart(day)) {
                return 'border-purple-500 dark:border-purple-400 border-l-2 border-t-2 border-b-2 rounded-l-lg';
            } else if (this.isEventEnd(day)) {
                return 'border-purple-500 dark:border-purple-400 border-r-2 border-t-2 border-b-2 rounded-r-lg';
            } else if (this.hasRegularEvents(day.events)) {
                return 'border-purple-500 dark:border-purple-400 border-t-2 border-b-2';
            }
        }

        if (day.attendance) {
            switch (day.attendance.status) {
                case 'PRESENT':
                    return 'border-green-500 dark:border-green-400 border-2';
                case 'ABSENT':
                    return 'border-red-500 dark:border-red-400 border-2';
                case 'LEAVE':
                    return 'border-blue-500 dark:border-blue-400 border-2';
                case 'ON_DUTY':
                    return 'border-orange-500 dark:border-orange-400 border-2';
                default:
                    return 'border-gray-300 dark:border-gray-600';
            }
        }

        if (day.isToday) {
            return 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900';
        }

        return 'border-gray-200 dark:border-gray-700';
    }
}
