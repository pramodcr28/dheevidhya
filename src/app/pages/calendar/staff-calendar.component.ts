import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
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
import { DheeConfirmationService } from '../../core/services/dhee-confirmation.service';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { Holiday, HOLIDAY_TYPE_COLORS, HOLIDAY_TYPE_ICONS, HOLIDAY_TYPE_LABELS } from '../models/holiday.model';
import { AttendanceStatus, StaffAttendance } from '../models/staff-attendence.mdel';
import { HolidayService } from '../service/holiday.service';
import { StaffAttendanceService } from '../service/staff-attendance.service';

// ─── Calendar types ────────────────────────────────────────────────────────────

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    attendance: StaffAttendance | null;
    /** APPROVED holidays that cover this day */
    holidays: Holiday[];
}

interface EventIndicator {
    icon: string;
    color: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
    selector: 'app-staff-attendance-calendar',
    standalone: true,
    imports: [
        DatePickerModule,
        CommonModule,
        FormsModule,
        SelectModule,
        CardModule,
        ButtonModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        AvatarModule,
        ChartModule,
        DialogModule,
        TextareaModule,
        FloatLabelModule,
        InputTextModule,
        ChipModule,
        ConfirmationDialogComponent
    ],
    providers: [MessageService, DheeConfirmationService, DatePipe],
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

    todayAttendance: StaffAttendance | null = null;
    chartData: any;
    chartOptions: any;
    calendarDays: CalendarDay[] = [];
    weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    attendanceHistory: StaffAttendance[] = [];
    /** All APPROVED holidays for the current visible month (from the dedicated holiday API) */
    holidays: Holiday[] = [];

    showDetailDialog = false;
    showEventsDialog = false;
    selectedDayAttendance: StaffAttendance | null = null;
    selectedDayHolidays: Holiday[] = [];
    selectedDayDate: Date | null = null;

    hasEvents = false;
    hasEventsToday = false;

    statusOptions = [
        { label: 'Present', value: 'PRESENT' },
        { label: 'Absent', value: 'ABSENT' },
        { label: 'Leave', value: 'LEAVE' }
    ];

    timeErrors: { checkIn: string; checkOut: string } = { checkIn: '', checkOut: '' };

    monthStats = { present: 0, absent: 0, onDuty: 0, leave: 0, total: 0, percentage: 0 };

    // Holiday display maps
    typeLabels = HOLIDAY_TYPE_LABELS;
    typeColors = HOLIDAY_TYPE_COLORS;
    typeIcons = HOLIDAY_TYPE_ICONS;

    commonService = inject(CommonService);
    staffAttendanceService = inject(StaffAttendanceService);
    holidayService = inject(HolidayService);

    constructor(private messageService: MessageService) {}

    ngOnInit() {
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
        this.initializeChart();
        this.loadMonthData();
    }

    // ── Time ──────────────────────────────────────────────────────────────────

    updateCurrentTime() {
        const now = new Date();
        this.currentTime = this.datePipe.transform(now, 'hh:mm:ss a') || '';
    }

    // ── Load ──────────────────────────────────────────────────────────────────

    /** Single entry-point: loads holidays first, then attendance if staff */
    loadMonthData() {
        this.loading = true;
        const { monthStart, monthEnd } = this.getMonthBounds();

        this.holidayService.getForCalendar(this.datePipe.transform(monthStart, 'yyyy-MM-dd')!, this.datePipe.transform(monthEnd, 'yyyy-MM-dd')!).subscribe({
            next: (holidays) => {
                this.holidays = holidays;

                if (!this.commonService.isStudent) {
                    this.loadAttendance(monthStart, monthEnd);
                } else {
                    this.finishLoading();
                }
            },
            error: () => {
                // Don't block the calendar if holiday API fails
                this.holidays = [];
                if (!this.commonService.isStudent) {
                    this.loadAttendance(monthStart, monthEnd);
                } else {
                    this.finishLoading();
                }
            }
        });
    }

    private loadAttendance(monthStart: Date, monthEnd: Date) {
        this.staffAttendanceService
            .searchAttendance({
                filters: {
                    'staffId.eq': this.commonService.getUserInfo?.userId,
                    'attendanceDate.gte': this.datePipe.transform(monthStart, 'yyyy-MM-dd'),
                    'attendanceDate.lte': this.datePipe.transform(monthEnd, 'yyyy-MM-dd')
                },
                page: 0,
                size: 100
            })
            .subscribe({
                next: (response) => {
                    this.attendanceHistory = response.content;
                    this.finishLoading();
                },
                error: () => {
                    this.loading = false;
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load attendance data' });
                }
            });
    }

    private finishLoading() {
        this.generateCalendar();
        this.calculateMonthStats();
        this.updateChart();
        this.checkTodayEvents();
        this.loading = false;
    }

    private getMonthBounds(): { monthStart: Date; monthEnd: Date } {
        const y = this.currentViewDate.getFullYear();
        const m = this.currentViewDate.getMonth();
        return {
            monthStart: new Date(y, m, 1),
            monthEnd: new Date(y, m + 1, 0)
        };
    }

    // ── Calendar generation ───────────────────────────────────────────────────

    generateCalendar() {
        this.calendarDays = [];
        const year = this.currentViewDate.getFullYear();
        const month = this.currentViewDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        const prevMonthLastDate = new Date(year, month, 0).getDate();

        // Prev-month padding
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthLastDate - i);
            this.calendarDays.push(this.buildDay(date, false));
        }

        // Current month
        for (let i = 1; i <= lastDate; i++) {
            const date = new Date(year, month, i);
            const day = this.buildDay(date, true);

            if (day.isToday) {
                this.todayAttendance = this.attendanceHistory.find((a) => a.attendanceDate === this.datePipe.transform(date, 'yyyy-MM-dd')) || null;
            }

            this.calendarDays.push(day);
        }

        // Next-month padding
        const remaining = 42 - this.calendarDays.length;
        for (let i = 1; i <= remaining; i++) {
            const date = new Date(year, month + 1, i);
            this.calendarDays.push(this.buildDay(date, false));
        }
    }

    private buildDay(date: Date, isCurrentMonth: boolean): CalendarDay {
        const dateStr = this.datePipe.transform(date, 'yyyy-MM-dd') || '';
        return {
            date,
            isCurrentMonth,
            isToday: this.isToday(date),
            attendance: this.attendanceHistory.find((a) => a.attendanceDate === dateStr) || null,
            holidays: this.getHolidaysForDate(date)
        };
    }

    isToday(date: Date): boolean {
        const t = new Date();
        return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
    }

    // ── Holiday resolution ────────────────────────────────────────────────────

    /**
     * Returns all approved holidays active on a given date.
     * - WEEK_OFF: matches if the day-of-week equals weekOffDay
     * - Others: active if date is within [startDate, endDate]
     */
    getHolidaysForDate(date: Date): Holiday[] {
        const dayOfWeek = date.getDay();
        const dateStr = this.datePipe.transform(date, 'yyyy-MM-dd')!;

        const dayMap: Record<string, number> = {
            SUNDAY: 0,
            MONDAY: 1,
            TUESDAY: 2,
            WEDNESDAY: 3,
            THURSDAY: 4,
            FRIDAY: 5,
            SATURDAY: 6
        };

        return this.holidays.filter((h) => {
            if (h.holidayType === 'WEEK_OFF') {
                return dayOfWeek === dayMap[(h.weekOffDay ?? 'SUNDAY').toUpperCase()];
            }
            if (!h.startDate) return false;

            const start = h.startDate;
            const end = h.endDate ?? h.startDate;
            return dateStr >= start && dateStr <= end;
        });
    }

    checkTodayEvents() {
        const todayHolidays = this.getHolidaysForDate(new Date());
        this.hasEventsToday = todayHolidays.length > 0;
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    previousMonth() {
        this.currentViewDate = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth() - 1, 1);
        this.loadMonthData();
    }

    nextMonth() {
        this.currentViewDate = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth() + 1, 1);
        this.loadMonthData();
    }

    // ── Day click ─────────────────────────────────────────────────────────────

    onDayClick(day: CalendarDay) {
        if (!day.isCurrentMonth) return;

        if (day.holidays.length > 0) {
            this.selectedDayHolidays = day.holidays;
            this.selectedDayDate = day.date;
            this.showEventsDialog = true;
            return;
        }

        if (this.commonService.isStudent) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(day.date);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            this.messageService.add({ severity: 'warn', summary: 'Future Date', detail: 'Cannot add attendance for future dates' });
            return;
        }

        if (day.attendance) {
            const a = day.attendance;
            this.selectedDayAttendance = {
                ...a,
                checkInTime: a.checkInTime ? this.combineDateAndTime(a.attendanceDate, a.checkInTime) : null,
                checkOutTime: a.checkOutTime ? this.combineDateAndTime(a.attendanceDate, a.checkOutTime) : null
            };
        } else {
            const base = new Date(day.date);
            const ci = new Date(base);
            ci.setHours(9, 0, 0, 0);
            const co = new Date(base);
            co.setHours(18, 0, 0, 0);

            this.selectedDayAttendance = {
                staffId: this.commonService.getUserInfo?.userId,
                staffName: this.commonService.getUserInfo?.fullName,
                branchId: this.commonService.branch?.id?.toString() || '',
                departmentIds: this.commonService.associatedDepartments.map((d) => d.id),
                departmentNames: this.commonService.associatedDepartments.map((d) => d.name),
                branchName: this.commonService.branch?.name || '',
                attendanceDate: this.datePipe.transform(day.date, 'yyyy-MM-dd') || '',
                status: 'PRESENT',
                checkInTime: ci,
                checkOutTime: co
            };
        }

        this.hasEvents = day.holidays.length > 0;
        this.timeErrors = { checkIn: '', checkOut: '' };
        this.showDetailDialog = true;
    }

    // ── Stats & Chart ─────────────────────────────────────────────────────────

    calculateMonthStats() {
        this.monthStats = { present: 0, absent: 0, leave: 0, onDuty: 0, total: 0, percentage: 0 };
        this.attendanceHistory.forEach((r) => {
            switch (r.status) {
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

    initializeChart() {
        this.chartData = {
            labels: ['Present', 'Absent', 'Leave'],
            datasets: [
                {
                    data: [0, 0, 0],
                    backgroundColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)', 'rgb(59, 130, 246)'],
                    borderWidth: 0
                }
            ]
        };
        this.chartOptions = {
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed} days` }
                }
            }
        };
    }

    updateChart() {
        if (this.chartData) {
            this.chartData.datasets[0].data = [this.monthStats.present, this.monthStats.absent, this.monthStats.leave];
            this.chartData = { ...this.chartData };
        }
    }

    // ── Cell style helpers ────────────────────────────────────────────────────

    hasWeekOffHoliday(holidays: Holiday[]): boolean {
        return holidays.some((h) => h.holidayType === 'WEEK_OFF');
    }

    hasRegularHoliday(holidays: Holiday[]): boolean {
        return holidays.some((h) => h.holidayType !== 'WEEK_OFF');
    }

    isHolidayStart(day: CalendarDay): boolean {
        const current = this.datePipe.transform(day.date, 'yyyy-MM-dd')!;
        return day.holidays.some((h) => h.holidayType !== 'WEEK_OFF' && h.startDate === current);
    }

    isHolidayEnd(day: CalendarDay): boolean {
        const current = this.datePipe.transform(day.date, 'yyyy-MM-dd')!;
        return day.holidays.some((h) => {
            if (h.holidayType === 'WEEK_OFF') return true;
            return (h.endDate ?? h.startDate) === current;
        });
    }

    getEventIndicators(holidays: Holiday[]): EventIndicator[] {
        const indicators: EventIndicator[] = [];
        const weekOffs = holidays.filter((h) => h.holidayType === 'WEEK_OFF');
        if (weekOffs.length) indicators.push({ icon: 'pi pi-calendar-clock', color: 'text-amber-500' });

        const regular = holidays.filter((h) => h.holidayType !== 'WEEK_OFF');
        for (let i = 0; i < Math.min(regular.length, 2 - indicators.length); i++) {
            indicators.push({ icon: 'pi pi-star-fill', color: 'text-purple-500' });
        }
        return indicators;
    }

    getCellBorderClass(day: CalendarDay): string {
        if (!day.isCurrentMonth) return 'border-gray-200 dark:border-gray-700';

        if (day.holidays.length > 0) {
            if (this.hasWeekOffHoliday(day.holidays)) {
                return 'border-amber-200 dark:border-amber-400 border-2 border-dashed rounded-lg';
            }
            if (this.isHolidayStart(day) && this.isHolidayEnd(day)) {
                return 'border-purple-500 dark:border-purple-400 border-2 rounded-lg';
            } else if (this.isHolidayStart(day)) {
                return 'border-purple-500 dark:border-purple-400 border-l-2 border-t-2 border-b-2 rounded-l-lg';
            } else if (this.isHolidayEnd(day)) {
                return 'border-purple-500 dark:border-purple-400 border-r-2 border-t-2 border-b-2 rounded-r-lg';
            } else if (this.hasRegularHoliday(day.holidays)) {
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
            }
        }

        if (day.isToday) return 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900';

        return 'border-gray-200 dark:border-gray-700';
    }

    // ── Holiday display helpers ───────────────────────────────────────────────

    getHolidayTypeDisplay(type: string): string {
        return HOLIDAY_TYPE_LABELS[type as keyof typeof HOLIDAY_TYPE_LABELS] ?? type;
    }

    getHolidayTypeColor(type: string): string {
        return HOLIDAY_TYPE_COLORS[type as keyof typeof HOLIDAY_TYPE_COLORS] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }

    getHolidayIcon(type: string): string {
        return HOLIDAY_TYPE_ICONS[type as keyof typeof HOLIDAY_TYPE_ICONS] ?? 'pi pi-calendar';
    }

    isSingleDayHoliday(h: Holiday): boolean {
        if (h.holidayType === 'WEEK_OFF') return true;
        if (!h.endDate) return true;
        return h.startDate === h.endDate;
    }

    getHolidayDuration(h: Holiday): number {
        if (h.holidayType === 'WEEK_OFF' || !h.startDate) return 1;
        const end = h.endDate ?? h.startDate;
        const ms = new Date(end).getTime() - new Date(h.startDate).getTime();
        return Math.ceil(ms / 86_400_000) + 1;
    }

    getWeekOffDayName(h: Holiday): string {
        if (!h.weekOffDay) return 'Sunday';
        return h.weekOffDay.charAt(0) + h.weekOffDay.slice(1).toLowerCase();
    }

    // ── Attendance save ───────────────────────────────────────────────────────

    saveAttendanceChanges() {
        if (!this.selectedDayAttendance) return;

        this.timeErrors = { checkIn: '', checkOut: '' };
        const s = this.selectedDayAttendance;

        if (s.status !== AttendanceStatus.ABSENT && s.status !== AttendanceStatus.LEAVE) {
            if (!s.checkInTime) {
                this.timeErrors.checkIn = 'Check-in time is required.';
                this.messageService.add({ severity: 'error', summary: 'Check-In Required', detail: 'Enter a check-in time.' });
                return;
            }
            if (!s.checkOutTime) {
                this.timeErrors.checkOut = 'Check-out time is required.';
                this.messageService.add({ severity: 'error', summary: 'Check-Out Required', detail: 'Enter a check-out time.' });
                return;
            }

            const base = new Date(s.attendanceDate);
            const ci = new Date(base);
            ci.setHours(s.checkInTime.getHours(), s.checkInTime.getMinutes(), s.checkInTime.getSeconds(), 0);
            const co = new Date(base);
            co.setHours(s.checkOutTime.getHours(), s.checkOutTime.getMinutes(), s.checkOutTime.getSeconds(), 0);

            if (co <= ci) {
                this.timeErrors.checkOut = 'Check-out must be after check-in.';
                this.messageService.add({ severity: 'error', summary: 'Invalid Range', detail: 'Check-out must be after check-in.' });
                return;
            }
            const hrs = (co.getTime() - ci.getTime()) / 3_600_000;
            if (hrs < 1) {
                this.timeErrors.checkOut = `Only ${Math.round(hrs * 60)} min — minimum is 1 hour.`;
                this.messageService.add({ severity: 'error', summary: 'Too Short', detail: 'Minimum 1 hour required.' });
                return;
            }
            if (hrs > 16) {
                this.timeErrors.checkOut = `${hrs.toFixed(1)} hrs exceeds the 16-hour limit.`;
                this.messageService.add({ severity: 'error', summary: 'Too Long', detail: 'Cannot exceed 16 hours.' });
                return;
            }
        }

        this.staffAttendanceService
            .addAttendance({
                ...s,
                checkInTime: this.normalizeTime(s.checkInTime),
                checkOutTime: this.normalizeTime(s.checkOutTime)
            })
            .subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Attendance updated' });
                    this.showDetailDialog = false;
                    this.loadMonthData();
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update attendance' })
            });
    }

    // ── Check-in / Check-out ─────────────────────────────────────────────────

    checkIn() {
        const now = new Date();
        const attendance: StaffAttendance = {
            staffId: this.commonService.getUserInfo.userId,
            staffName: this.commonService.getUserInfo.fullName,
            departmentIds: this.commonService.associatedDepartments.map((d) => d.id),
            departmentNames: this.commonService.associatedDepartments.map((d) => d.name),
            branchId: this.commonService.branch?.id?.toString() || '',
            branchName: this.commonService.branch?.name || '',
            attendanceDate: this.datePipe.transform(now, 'yyyy-MM-dd'),
            checkInTime: this.datePipe.transform(now, 'HH:mm:ss'),
            status: 'PRESENT'
        };
        this.staffAttendanceService.addAttendance(attendance).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Checked In', detail: 'Attendance recorded' });
                this.loadMonthData();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to check in' })
        });
    }

    checkOut() {
        if (!this.todayAttendance) return;
        const checkOut = new Date();
        const checkIn = this.combineDateAndTime(this.todayAttendance.attendanceDate, this.todayAttendance.checkInTime);
        const hrs = (checkOut.getTime() - checkIn.getTime()) / 3_600_000;
        if (hrs < 1) {
            this.messageService.add({ severity: 'error', summary: 'Too Short', detail: 'Minimum 1 hour required.' });
            return;
        }
        this.staffAttendanceService
            .addAttendance({
                ...this.todayAttendance,
                checkOutTime: this.datePipe.transform(checkOut, 'HH:mm:ss')
            })
            .subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Checked Out', detail: 'Check-out recorded' });
                    this.loadMonthData();
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to check out' })
            });
    }

    // ── Utility ───────────────────────────────────────────────────────────────

    getAvatarInitials(fullName: string): string {
        if (!fullName) return '';
        return fullName
            .split(' ')
            .map((n) => n.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    getStatusSeverity(status: string): any {
        return ({ PRESENT: 'success', ABSENT: 'danger', LEAVE: 'info', ON_DUTY: 'warn' } as any)[status] ?? 'info';
    }

    getIconBasedOnStatus(status: string): string {
        return (
            (
                {
                    PRESENT: 'pi pi-check-circle text-green-600 dark:text-green-500 text-sm',
                    ABSENT: 'pi pi-times-circle text-red-600 dark:text-red-500 text-sm',
                    LEAVE: 'pi pi-calendar-minus text-blue-600 dark:text-blue-500 text-sm',
                    ON_DUTY: 'pi pi-clock text-orange-600 dark:text-orange-500 text-sm'
                } as any
            )[status] ?? 'pi pi-info-circle text-sm'
        );
    }

    private normalizeTime(value: any): string | null {
        if (!value) return null;
        if (typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) return value;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d.toLocaleTimeString('en-GB', { hour12: false });
    }

    combineDateAndTime(dateStr: string, time: string | Date): Date {
        if (!time) return null as any;
        if (time instanceof Date) {
            const r = new Date(dateStr);
            r.setHours(time.getHours(), time.getMinutes(), time.getSeconds());
            return r;
        }
        return new Date(`${dateStr}T${time}`);
    }

    exportDailyReport() {
        const headers = ['Date', 'Status', 'Check-In', 'Check-Out', 'Remarks'];
        const rows = this.attendanceHistory
            .filter((r) => {
                const d = new Date(r.attendanceDate);
                return d.getFullYear() === this.currentViewDate.getFullYear() && d.getMonth() === this.currentViewDate.getMonth();
            })
            .map((r) => [r.attendanceDate, r.status, r.checkInTime || '-', r.checkOutTime || '-', r.remarks || '-']);

        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-${this.datePipe.transform(this.currentViewDate, 'yyyy-MM')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'Report downloaded' });
    }
}
