import { formatDate } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CommonService } from '../../core/services/common.service';
import { ExaminationDTO, ExaminationTimeSlot, ExaminationTimeTable, ExamStatus } from '../models/examination.model';
import { IDepartmentConfig } from '../models/org.model';
import { Subject } from '../models/time-table';

export interface StatusTransition {
    from: ExamStatus;
    to: ExamStatus;
    allowed: boolean;
    requiresConfirmation: boolean;
    confirmationMessage?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ExamStatusService {
    timeTable: ExaminationTimeTable = null;
    selectedSubjectsForTimeTable: Subject[] = [];
    scheduleValidationErrors: string[] = [];
    selectedExam: ExaminationDTO;
    messageService = inject(MessageService);
    commonService = inject(CommonService);
    timeSlots = [];
    days = [];
    selectedDepartment: IDepartmentConfig;
    private transitionRules: Map<string, StatusTransition> = new Map([
        [
            'DRAFT->SCHEDULED',
            {
                from: ExamStatus.DRAFT,
                to: ExamStatus.SCHEDULED,
                allowed: true,
                requiresConfirmation: true,
                confirmationMessage: 'Are you sure you want to schedule this exam? Once scheduled, you can only reschedule or cancel it.'
            }
        ],
        [
            'DRAFT->CANCELLED',
            {
                from: ExamStatus.DRAFT,
                to: ExamStatus.CANCELLED,
                allowed: true,
                requiresConfirmation: true,
                confirmationMessage: 'Are you sure you want to cancel this draft exam?'
            }
        ],
        [
            'SCHEDULED->CANCELLED',
            {
                from: ExamStatus.SCHEDULED,
                to: ExamStatus.CANCELLED,
                allowed: true,
                requiresConfirmation: true,
                confirmationMessage: 'Are you sure you want to cancel this scheduled exam? This action cannot be undone.'
            }
        ],
        [
            'SCHEDULED->ONGOING',
            {
                from: ExamStatus.SCHEDULED,
                to: ExamStatus.ONGOING,
                allowed: true,
                requiresConfirmation: false
            }
        ],
        [
            'RE_SCHEDULED->ONGOING',
            {
                from: ExamStatus.RE_SCHEDULED,
                to: ExamStatus.ONGOING,
                allowed: true,
                requiresConfirmation: false
            }
        ],
        [
            'RE_SCHEDULED->CANCELLED',
            {
                from: ExamStatus.RE_SCHEDULED,
                to: ExamStatus.CANCELLED,
                allowed: true,
                requiresConfirmation: true,
                confirmationMessage: 'Are you sure you want to cancel this RE_SCHEDULED exam?'
            }
        ],

        [
            'ONGOING->CANCELLED',
            {
                from: ExamStatus.ONGOING,
                to: ExamStatus.CANCELLED,
                allowed: true,
                requiresConfirmation: true,
                confirmationMessage: 'Are you sure you want to cancel this ongoing exam? This is an emergency action.'
            }
        ]
    ]);
    allValidations = [];
    canTransition(from: ExamStatus, to: ExamStatus): boolean {
        const key = `${from}->${to}`;
        const rule = this.transitionRules.get(key);
        return rule?.allowed || false;
    }

    getTransitionRule(from: ExamStatus, to: ExamStatus): StatusTransition | undefined {
        const key = `${from}->${to}`;
        return this.transitionRules.get(key);
    }

    getAvailableTransitions(currentStatus: ExamStatus): ExamStatus[] {
        const available: ExamStatus[] = [];

        for (const [key, rule] of this.transitionRules.entries()) {
            if (rule.from === currentStatus && rule.allowed) {
                available.push(rule.to);
            }
        }
        return available;
    }

    canDelete(status: ExamStatus): boolean {
        return status === ExamStatus.DRAFT;
    }

    canEdit(status: ExamStatus): boolean {
        return status === ExamStatus.DRAFT || status === ExamStatus.SCHEDULED || status === ExamStatus.RE_SCHEDULED;
    }

    getStatusBadgeClass(status: ExamStatus): string {
        const classes = {
            [ExamStatus.DRAFT]: 'bg-gray-100 text-gray-800',
            [ExamStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
            [ExamStatus.RE_SCHEDULED]: 'bg-orange-100 text-orange-800',
            [ExamStatus.ONGOING]: 'bg-green-100 text-green-800',
            [ExamStatus.RESULT_DECLARED]: 'bg-teal-100 text-teal-800',
            [ExamStatus.CANCELLED]: 'bg-red-100 text-red-800'
        };

        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getStatusIcon(status: ExamStatus): string {
        const icons = {
            [ExamStatus.DRAFT]: 'pi pi-file-edit',
            [ExamStatus.SCHEDULED]: 'pi pi-calendar-plus',
            [ExamStatus.RE_SCHEDULED]: 'pi pi-clock',
            [ExamStatus.ONGOING]: 'pi pi-play-circle',
            [ExamStatus.RESULT_DECLARED]: 'pi pi-verified',
            [ExamStatus.CANCELLED]: 'pi pi-times-circle'
        };

        return icons[status] || 'pi pi-info-circle';
    }

    durationOptions = [
        { label: '30 Minutes', value: 30 },
        { label: '1 Hour', value: 60 },
        { label: '1.5 Hours', value: 90 },
        { label: '2 Hours', value: 120 },
        { label: '2.5 Hours', value: 150 },
        { label: '3 Hours', value: 180 },
        { label: '3.5 Hours', value: 210 },
        { label: '4 Hours', value: 240 }
    ];

    getExactDayDiff(start: Date, end: Date): number {
        const diffMs = end.getTime() - start.getTime();
        return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    getDayDurationInMinutes(): number {
        if (!this.timeTable.settings.dayStartTime || !this.timeTable.settings.dayEndTime) {
            return 0;
        }
        const start = new Date(this.timeTable.settings.dayStartTime);
        const end = new Date(this.timeTable.settings.dayEndTime);
        return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    }

    getTimeSlots(): void {
        const slots: string[] = [];

        let currentTime = new Date(this.timeTable.settings.dayStartTime);

        for (let i = 0; i < this.timeTable.settings.slotsPerDay; i++) {
            const endTime = new Date(currentTime.getTime() + this.timeTable.settings.slotDuration * 60000);
            slots.push(`${this.formatTime(currentTime)} - ${this.formatTime(endTime)}`);

            // Add break time for next slot (except for last slot)
            if (i < this.timeTable.settings.slotsPerDay - 1) {
                currentTime = new Date(endTime.getTime() + this.timeTable.settings.breakDuration * 60000);
            }
        }
        this.timeSlots = slots;
    }

    getSlotTimeRange(slot: ExaminationTimeSlot): string {
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);
        return `${this.formatTime(start)} - ${this.formatTime(end)}`;
    }

    getDays(): void {
        this.days = Array.from(new Set(this.timeTable.schedules.map((slot) => slot.day)));
    }

    getSlotsForDay(dayISO: string): ExaminationTimeSlot[] {
        return this.timeTable.schedules.filter((slot) => slot.day === dayISO);
    }

    formatTime(date: Date): string {
        const hour = date.getHours();
        const minute = date.getMinutes();
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const displayMinute = minute.toString().padStart(2, '0');
        return `${displayHour}:${displayMinute} ${period}`;
    }

    formatDate(date: Date | string): string {
        date = new Date(date);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    }

    getAllValidations() {
        return;
    }

    generateTimeTable() {
        this.validateForm();
        if (this.scheduleValidationErrors.length > 0) {
            return;
        }

        const oldSchedules = [...this.timeTable.schedules];

        const existingScheduleMap = new Map<string, any>();
        const daySlotCounter = new Map<string, number>();

        oldSchedules.forEach((s: any) => {
            const day = s.day;
            const index = daySlotCounter.get(day) ?? 0;

            existingScheduleMap.set(`${day}_${index}`, s);
            daySlotCounter.set(day, index + 1);
        });

        this.timeTable.schedules.length = 0;

        let currentDate = new Date(this.timeTable.settings.startDate);
        let endDate = new Date(this.timeTable.settings.endDate);
        currentDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        while (currentDate <= endDate) {
            let slotStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), this.timeTable.settings.dayStartTime.getHours(), this.timeTable.settings.dayStartTime.getMinutes(), 0, 0);

            const day = formatDate(slotStart, this.commonService.dateFormate, 'en-US');

            for (let i = 0; i < this.timeTable.settings.slotsPerDay; i++) {
                const slotEnd = new Date(slotStart.getTime() + this.timeTable.settings.slotDuration * 60000);

                const key = `${day}_${i}`;
                const existing = existingScheduleMap.get(key);

                this.timeTable.schedules.push({
                    startTime: formatDate(slotStart, this.commonService.dateTimeFormate, 'en-US'),
                    endTime: formatDate(slotEnd, this.commonService.dateTimeFormate, 'en-US'),
                    day,
                    breakDuration: this.timeTable.settings.breakDuration,
                    subjectName: existing?.subjectName ?? '',
                    color: existing?.color ?? ''
                });

                if (i < this.timeTable.settings.slotsPerDay - 1) {
                    slotStart = new Date(slotEnd.getTime() + this.timeTable.settings.breakDuration * 60000);
                }
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        this.getTimeSlots();
        this.getDays();
    }

    validateForm(): void {
        this.scheduleValidationErrors = [];
        let dayDifference = this.getExactDayDiff(this.timeTable.settings.startDate, this.timeTable.settings.endDate);
        if (!this.timeTable.settings.startDate) {
            this.scheduleValidationErrors.push('Start date is required');
        }
        if (!this.timeTable.settings.endDate) {
            this.scheduleValidationErrors.push('End date is required');
        }
        if (this.timeTable.settings.startDate && this.timeTable.settings.endDate) {
            if (this.timeTable.settings.startDate > this.timeTable.settings.endDate) {
                this.scheduleValidationErrors.push('End date must be after start date');
            }
        }

        if (!this.timeTable.settings.dayStartTime) {
            this.scheduleValidationErrors.push('Day start time is required');
        }
        if (!this.timeTable.settings.dayEndTime) {
            this.scheduleValidationErrors.push('Day end time is required');
        }
        if (this.timeTable.settings.dayStartTime && this.timeTable.settings.dayEndTime) {
            if (this.timeTable.settings.dayStartTime >= this.timeTable.settings.dayEndTime) {
                this.scheduleValidationErrors.push('Day end time must be after start time');
            }
        }

        if (!this.timeTable.settings.slotsPerDay || this.timeTable.settings.slotsPerDay < 1) {
            this.scheduleValidationErrors.push('At least 1 slot per day is required');
        }
        if (!this.timeTable.settings.slotDuration || this.timeTable.settings.slotDuration < 30) {
            this.scheduleValidationErrors.push('Slot duration must be at least 30 minutes');
        }

        if (this.timeTable.settings.dayStartTime && this.timeTable.settings.dayEndTime && this.timeTable.settings.slotsPerDay && this.timeTable.settings.slotDuration) {
            const dayDurationMinutes = this.getDayDurationInMinutes();
            const totalSlotDuration = this.timeTable.settings.slotsPerDay * this.timeTable.settings.slotDuration;
            const totalBreakDuration = (this.timeTable.settings.slotsPerDay - (this.timeTable.settings.slotsPerDay <= 1 ? this.timeTable.settings.slotsPerDay : 1)) * this.timeTable.settings.breakDuration;
            const requiredTime = totalSlotDuration + totalBreakDuration;

            if (requiredTime > dayDurationMinutes * dayDifference) {
                this.scheduleValidationErrors.push(`Total time required (${requiredTime} min) exceeds available day time (${dayDurationMinutes} min)`);
            }
        }

        if (this.selectedDepartment && (!this.selectedSubjectsForTimeTable || this.selectedSubjectsForTimeTable.length === 0)) {
            this.scheduleValidationErrors.push('At least one subject is required');
        }

        // if (this.selectedSubjectsForTimeTable?.length && dayDifference && this.timeTable.settings.slotsPerDay) {
        // const totalAvailableSlots = dayDifference * this.timeTable.settings.slotsPerDay;
        // if (totalAvailableSlots < this.selectedSubjectsForTimeTable.length) {
        //     this.scheduleValidationErrors.push(`Insufficient time slots: ${totalAvailableSlots} available, but ${this.selectedSubjectsForTimeTable.length} subjects selected.`);
        // }
        // }
    }
}
