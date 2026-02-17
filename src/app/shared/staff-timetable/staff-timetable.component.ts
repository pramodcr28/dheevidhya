import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../core/services/common.service';
import { TimeTableService } from '../../pages/service/time-table.service';

interface PersonalTimetableResponse {
    dayIndex: string;
    className: string;
    sectionName: string;
    deptName: string;
    startTime: string;
    endTime: string;
    instructorName: string;
    subjectName?: string;
}

interface PeriodSlot {
    startTime: string;
    endTime: string;
    subjectName?: string;
    className?: string;
    sectionName?: string;
    type: 'lecture' | 'break' | 'free';
}

interface TimeSlot {
    startTime: string;
    endTime: string;
}

@Component({
    selector: 'app-staff-timetable',
    standalone: true,
    imports: [CommonModule, TooltipModule, ToastModule],
    providers: [MessageService],
    templateUrl: './staff-timetable.component.html',
    styles: [
        `
            :host {
                display: block;
            }
            .animate-fade-in {
                animation: fadeIn 0.5s ease-out forwards;
            }
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `
    ]
})
export class StaffTimetableComponent implements OnInit {
    private timeTableService = inject(TimeTableService);
    private messageService = inject(MessageService);
    commonService = inject(CommonService);
    isLoading = false;
    weekSchedule: { dayName: string; periods: PeriodSlot[] }[] = [];
    timeSlots: TimeSlot[] = [];
    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    ngOnInit() {
        this.fetchStaffTimetable();
    }

    fetchStaffTimetable() {
        this.isLoading = true;
        this.timeTableService.getPersonalTimetable(this.commonService.currentUser.userId).subscribe({
            next: (res: PersonalTimetableResponse[]) => {
                if (res && res.length > 0) {
                    this.processData(res);
                }
                this.isLoading = false;
            },
            error: () => (this.isLoading = false)
        });
    }

    private processData(data: PersonalTimetableResponse[]) {
        const grouped = new Map<number, PeriodSlot[]>();
        const allTimeSlots = new Set<string>();

        // Group by day and collect all unique time slots
        data.forEach((item) => {
            const dayIdx = parseInt(item.dayIndex);
            const slot: PeriodSlot = {
                startTime: item.startTime,
                endTime: item.endTime,
                subjectName: item.subjectName,
                className: item.className,
                sectionName: item.sectionName,
                type: item.subjectName ? 'lecture' : 'free'
            };

            const existing = grouped.get(dayIdx) || [];
            grouped.set(dayIdx, [...existing, slot]);

            // Collect time slots
            allTimeSlots.add(`${item.startTime}-${item.endTime}`);
        });

        // Sort periods by start time for each day
        grouped.forEach((periods) => {
            periods.sort((a, b) => {
                const timeA = this.timeToMinutes(a.startTime);
                const timeB = this.timeToMinutes(b.startTime);
                return timeA - timeB;
            });
        });

        // Build complete time slots array (including gaps/breaks)
        this.buildCompleteTimeSlots(grouped);

        // Map days with their periods
        this.weekSchedule = this.days
            .map((name, idx) => ({
                dayName: name,
                periods: grouped.get(idx) || []
            }))
            .filter((d) => d.periods.length > 0);
    }

    private buildCompleteTimeSlots(grouped: Map<number, PeriodSlot[]>) {
        // Get all unique time slots from all days
        const allSlots = new Map<string, TimeSlot>();

        grouped.forEach((periods) => {
            periods.forEach((period) => {
                const key = `${period.startTime}-${period.endTime}`;
                if (!allSlots.has(key)) {
                    allSlots.set(key, {
                        startTime: period.startTime,
                        endTime: period.endTime
                    });
                }
            });
        });

        this.timeSlots = Array.from(allSlots.values()).sort((a, b) => {
            return this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime);
        });
        this.fillTimeSlotGaps();
    }

    private fillTimeSlotGaps() {
        if (this.timeSlots.length === 0) return;

        const filledSlots: TimeSlot[] = [];

        for (let i = 0; i < this.timeSlots.length; i++) {
            filledSlots.push(this.timeSlots[i]);

            if (i < this.timeSlots.length - 1) {
                const currentEnd = this.timeSlots[i].endTime;
                const nextStart = this.timeSlots[i + 1].startTime;

                if (currentEnd !== nextStart) {
                    filledSlots.push({
                        startTime: currentEnd,
                        endTime: nextStart
                    });
                }
            }
        }

        this.timeSlots = filledSlots;
    }

    private timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    getGridCols(): string {
        const dayColWidth = '80px';
        const slotColWidth = '110px';
        return `${dayColWidth} repeat(${this.timeSlots.length}, minmax(${slotColWidth}, 1fr))`;
    }

    formatTime(time: string | undefined): string {
        if (!time) return '';

        return time.split(':').slice(0, 2).join(':');
    }

    isPeriodScheduled(day: any, slot: TimeSlot): boolean {
        return day.periods.some((p: PeriodSlot) => p.startTime === slot.startTime && p.endTime === slot.endTime);
    }

    getPeriodForSlot(day: any, slot: TimeSlot): PeriodSlot | null {
        return day.periods.find((p: PeriodSlot) => p.startTime === slot.startTime && p.endTime === slot.endTime) || null;
    }

    // isBreakTime(slot: TimeSlot): boolean {
    //     return this.commonBreakTimes.some((breakTime) => breakTime.startTime === slot.startTime && breakTime.endTime === slot.endTime);
    // }

    getCellClasses(day: any, slot: TimeSlot): string {
        const isScheduled = this.isPeriodScheduled(day, slot);
        // const isBreak = this.isBreakTime(slot);

        if (isScheduled) {
            return 'bg-gradient-to-br from-white to-primary-50/30 dark:from-gray-700 dark:to-gray-800 border-primary-300 dark:border-primary-600 hover:shadow-lg hover:border-primary-500 dark:hover:border-primary-400 min-h-[85px]';
        } else {
            return 'bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-surface-800/30 dark:to-surface-900/30 border-dashed border-slate-300 dark:border-surface-600 hover:border-slate-400 min-h-[85px]';
        }
    }

    onCellClick(day: any, slot: TimeSlot) {
        const period = this.getPeriodForSlot(day, slot);

        if (period && period.type === 'lecture') {
            this.messageService.add({
                severity: 'info',
                summary: `${period.subjectName}`,
                detail: `${period.className} - ${period.sectionName} | ${period.startTime} - ${period.endTime}`,
                life: 3000
            });
        } else {
            this.messageService.add({
                severity: 'info',
                summary: 'Free Period',
                detail: `No class scheduled for ${slot.startTime} - ${slot.endTime}`,
                life: 2000
            });
        }
    }
}
