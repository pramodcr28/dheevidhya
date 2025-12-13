import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DragDropModule } from 'primeng/dragdrop';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ApiLoaderService } from '../../core/services/loaderService';
import { BreakConfig, DepartmentTimetable } from '../../pages/models/time-table';
import { TimeTableService } from '../../pages/service/time-table.service';

interface SelectedPeriod {
    classSec: any;
    scheduleIndex: number;
    periodIndex: number;
    period: any;
    isValidForMove: boolean;
    conflictInfo?: any[];
}

@Component({
    selector: 'app-timetable-view',
    standalone: true,
    imports: [CommonModule, ToastModule, TooltipModule, DragDropModule],
    providers: [MessageService],
    templateUrl: './timetable-view.component.html',
    styles: [
        `
            .drag-over-active {
                @apply border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/40 border-dashed !important;
            }
            .cursor-grab {
                cursor: grab;
            }
            .cursor-grabbing {
                cursor: grabbing;
            }
            .drag-valid-target {
                @apply border-2 border-green-500 bg-green-50 dark:bg-green-900/20 !important;
            }
            .drag-conflict-target {
                @apply border-2 border-red-500 bg-red-50 dark:bg-red-900/20 !important;
            }
            .other-section {
                @apply opacity-90 blur-sm pointer-events-none !important;
            }
            .validating-spinner {
                @apply inline-block w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin;
            }
            .selected-period {
                @apply border-4 border-blue-500 bg-blue-50 dark:bg-blue-900/40 shadow-lg !important;
            }
        `
    ]
})
export class TimetableViewComponent {
    @Input() dailogeType: 'Edit' | 'View' | any = 'View';
    @Output() publish = new EventEmitter<DepartmentTimetable>();
    @Output() cancel = new EventEmitter<void>();
    @Output() timetableChange = new EventEmitter<DepartmentTimetable>();
    loader = inject(ApiLoaderService);
    timeTableService = inject(TimeTableService);
    messageService = inject(MessageService);
    displayTimeTableJson!: DepartmentTimetable | any;

    selectedPeriod: SelectedPeriod | null = null;
    isValidatingConflicts = false;
    validatingPeriodKey: string | null = null;

    @Input()
    set timetableJson(value: DepartmentTimetable | null) {
        if (!value) return;
        this.displayTimeTableJson = structuredClone(value);
        this.processForDisplay();
    }

    get timetableJson(): DepartmentTimetable | null {
        return this.displayTimeTableJson;
    }

    private processForDisplay() {
        const breaks: BreakConfig[] = this.displayTimeTableJson.settings?.breaks || [];

        this.displayTimeTableJson.classSections?.forEach((classSec: any) => {
            const columns: any[] = [];
            const periodsPerDay = classSec.schedules[0]?.periods?.length || 0;

            for (let p = 1; p <= periodsPerDay; p++) {
                columns.push({
                    type: 'period',
                    index: p - 1
                });

                const breakCfg = breaks.find((b) => b.afterPeriod == p);
                if (breakCfg) {
                    columns.push({
                        type: 'break',
                        breakItem: breakCfg
                    });
                }
            }
            (classSec as any)._columns = columns;
            (classSec as any)._columnsCount = columns.length + 1;

            classSec.schedules.forEach((schedule: any) => {
                const cells: any[] = [];
                schedule.dayName = this.getDayName(schedule.day);

                columns.forEach((col) => {
                    if (col.type === 'period') {
                        const period = schedule.periods[col.index];
                        cells.push({
                            realPeriodIndex: col.index,
                            dayIndex: schedule.day,
                            type: period?.type === 'lecture' ? 'lecture' : period?.type === 'free' ? 'free' : 'free',
                            name: period?.name,
                            subject: period?.subject,
                            instructor: period?.instructor,
                            startTime: period?.startTime,
                            endTime: period?.endTime,
                            tooltip: period?.tooltip,
                            cssClasses: period?.cssClasses,
                            canDrop: true
                        });
                    } else {
                        cells.push({
                            type: 'break',
                            breakItem: col.breakItem
                        });
                    }
                });

                (schedule as any)._cells = cells;
            });
            this.deselectPeriod(classSec);
        });
    }

    getDayName(dayIndex: number): string {
        const selectedName = this.timetableJson?.settings.workingDays[dayIndex]?.name;
        return selectedName || '';
    }

    getCellKey(scheduleIndex: number, periodIndex: number): string {
        return `${scheduleIndex}-${periodIndex}`;
    }

    onPeriodClick(classSec: any, scheduleIndex: number, periodIndex: number, cell: any) {
        if (cell.type !== 'lecture') {
            this.messageService.add({
                severity: 'info',
                summary: 'Info',
                detail: 'Only lecture periods can be moved',
                life: 2000
            });
            return;
        }

        if (this.selectedPeriod && this.selectedPeriod.scheduleIndex === scheduleIndex && this.selectedPeriod.periodIndex === periodIndex) {
            this.deselectPeriod(classSec);
            return;
        }

        this.deselectPeriod(classSec);

        const cellKey = this.getCellKey(scheduleIndex, periodIndex);
        this.validatingPeriodKey = cellKey;
        this.isValidatingConflicts = true;

        const request = {
            timeTableId: this.timetableJson.id,
            periodIndex: periodIndex,
            dayIndex: scheduleIndex,
            classId: classSec.classId,
            sectionId: classSec.sectionId,
            startTime: cell.startTime,
            endTime: cell.endTime
        };

        this.timeTableService.getPeriodConflicts(request).subscribe(
            (response: any[]) => {
                this.isValidatingConflicts = false;
                this.validatingPeriodKey = null;

                this.selectedPeriod = {
                    classSec,
                    scheduleIndex,
                    periodIndex,
                    period: cell,
                    isValidForMove: true,
                    conflictInfo: response
                };

                classSec.schedules.forEach((schedule: any) => {
                    const dayConflicts = this.selectedPeriod.conflictInfo?.filter((conflict) => conflict.dayIndex == schedule.day) || [];
                    console.log('Validating schedule for day:', schedule.day, 'with conflicts:', dayConflicts);
                    schedule._cells.forEach((cell: any, cellIdx: number) => {
                        let conflict = dayConflicts.find((conflict) => conflict.startTime == cell.startTime && conflict.endTime == cell.endTime);
                        cell.canDrop = true;
                        cell.tooltipText = cell.tooltip || `${cell.subject?.name || 'Free Period'}<br/>${cell.startTime} - ${cell.endTime}`;
                        if (conflict) {
                            cell.canDrop = false;
                            cell.tooltipText = `${conflict.conflict.instructorName} is busy in ${conflict.conflict.className} ${conflict.conflict.sectionName} on Day ${conflict.conflict.dayIndex} (${conflict.conflict.startTime} - ${conflict.conflict.endTime})`;
                        }
                    });
                });
                this.messageService.add({
                    severity: 'info',
                    summary: 'Period Selected',
                    detail: 'Drag to move within same section',
                    life: 2000
                });
            },
            (error) => {
                this.isValidatingConflicts = false;
                this.validatingPeriodKey = null;
                console.error('Error:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to validate period',
                    life: 3000
                });
            }
        );
    }

    isSelectedPeriod(scheduleIndex: number, periodIndex: number, cell: any): boolean {
        if (!this.selectedPeriod) return false;
        // return this.selectedPeriod.scheduleIndex === scheduleIndex && this.selectedPeriod.periodIndex === periodIndex;
        return this.selectedPeriod.period === cell;
    }

    isValidatingPeriod(scheduleIndex: number, periodIndex: number): boolean {
        const cellKey = this.getCellKey(scheduleIndex, periodIndex);
        return this.validatingPeriodKey === cellKey && this.isValidatingConflicts;
    }

    deselectPeriod(classSec: any) {
        this.selectedPeriod = null;
        this.validatingPeriodKey = null;

        // Reset cells to default state for this class section only
        if (classSec?.schedules) {
            classSec.schedules.forEach((schedule: any) => {
                schedule._cells.forEach((cell: any) => {
                    // Reset states modified during conflict validation
                    cell.canDrop = false; // or true based on your default rule
                    cell.tooltipText = cell.tooltip || `${cell.subject?.name || 'Free Period'}<br/>${cell.startTime} - ${cell.endTime}`;

                    // If you track conflicts visually, reset those too:
                    delete cell.isConflict;
                });
            });
        }
    }

    onDragStart(classSec: any, scheduleIndex: number, periodIndex: number, cell: any) {
        if (!this.isSelectedPeriod(scheduleIndex, periodIndex, cell)) {
            return;
        }
    }

    onDrop(classSec: any, targetScheduleIndex: number, targetPeriodIndex: number) {
        if (!this.selectedPeriod) {
            return;
        }

        const sourceSchedule = this.selectedPeriod.classSec.schedules.find((s) => s.day == this.selectedPeriod.scheduleIndex.toString());

        const targetSchedule = classSec.schedules.find((s) => s.day == targetScheduleIndex.toString());

        const sourcePeriod = sourceSchedule.periods[this.selectedPeriod.periodIndex];
        const targetPeriod = targetSchedule.periods[targetPeriodIndex];

        // --- Swap ONLY logical properties, not time properties ---
        const sourceCopy = { ...sourcePeriod };
        const targetCopy = { ...targetPeriod };

        // Properties that should NOT be swapped
        const fixedFields = ['startTime', 'endTime', 'duration'];

        Object.keys(sourcePeriod).forEach((key) => {
            if (!fixedFields.includes(key)) {
                sourcePeriod[key] = targetCopy[key];
                targetPeriod[key] = sourceCopy[key];
            }
        });

        this.processForDisplay();
        this.deselectPeriod(classSec);
        this.timetableChange.emit(this.displayTimeTableJson);
    }

    onPublish(): void {
        this.selectedPeriod = null;
        this.publish.emit(this.timetableJson);
    }

    onCancel(): void {
        this.selectedPeriod = null;
        this.cancel.emit();
    }
}
