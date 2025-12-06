import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DragDropModule } from 'primeng/dragdrop';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { BreakConfig, DepartmentTimetable } from '../../pages/models/time-table';
import { TimeTableService } from '../../pages/service/time-table.service';

interface ConflictInfo {
    dayIndex: string;
    className: string;
    sectionName: string;
    deptName: string;
    branchName: string;
    startTime: string;
    endTime: string;
    instructorName: string;
    instructorId: string;
}

interface SelectedPeriod {
    classSec: any;
    scheduleIndex: number;
    periodIndex: number;
    period: any;
    isValidForMove: boolean;
    conflictInfo?: ConflictInfo[];
}

interface CellConflictStatus {
    hasConflict: boolean;
    conflictDetails?: ConflictInfo;
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
            .selected-period {
                @apply border-4 border-blue-500 bg-blue-50 dark:bg-blue-900/40 shadow-lg !important;
            }
            .drag-valid-target {
                @apply border-2 border-green-500 bg-green-50 dark:bg-green-900/20 !important;
            }
            .drag-conflict-target {
                @apply border-2 border-red-500 bg-red-50 dark:bg-red-900/20 !important;
            }
            .has-conflict-badge {
                @apply absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold !important;
            }
        `
    ]
})
export class TimetableViewComponent {
    @Input() dailogeType: 'Edit' | 'View' = 'View';
    @Output() publish = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
    @Output() timetableChange = new EventEmitter<DepartmentTimetable>();

    timeTableService = inject(TimeTableService);
    messageService = inject(MessageService);
    displayTimeTableJson!: DepartmentTimetable | any;

    selectedPeriod: SelectedPeriod | null = null;
    validDropTargets: Set<string> = new Set();
    conflictDropTargets: Map<string, ConflictInfo> = new Map();
    isValidatingConflicts = false;

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
                            cssClasses: period?.cssClasses
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
            this.deselectPeriod();
            return;
        }

        this.deselectPeriod();
        this.isValidatingConflicts = true;

        const request = {
            timeTableId: this.timetableJson.id,
            periodIndex: periodIndex,
            dayIndex: scheduleIndex,
            classId: classSec.classId,
            sectionId: classSec.sectionId
        };

        this.timeTableService.getPeriodConflicts(request).subscribe(
            (response: ConflictInfo[]) => {
                this.isValidatingConflicts = false;

                this.selectedPeriod = {
                    classSec,
                    scheduleIndex,
                    periodIndex,
                    period: cell,
                    isValidForMove: true,
                    conflictInfo: response
                };

                this.validateDropTargetsLocally(classSec, scheduleIndex, periodIndex, response);

                this.messageService.add({
                    severity: 'info',
                    summary: 'Period Selected',
                    detail: 'Drag to move within same section',
                    life: 2000
                });
            },
            (error) => {
                this.isValidatingConflicts = false;
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

    private validateDropTargetsLocally(classSec: any, sourceScheduleIndex: number, sourcePeriodIndex: number, conflictInfo: ConflictInfo[]) {
        this.validDropTargets.clear();
        this.conflictDropTargets.clear();

        classSec.schedules.forEach((schedule: any, dayIdx: number) => {
            schedule.periods.forEach((period: any, periodIdx: number) => {
                if (dayIdx === sourceScheduleIndex && periodIdx === sourcePeriodIndex) {
                    return;
                }

                const cellKey = this.getCellKey(dayIdx, periodIdx);

                const cellConflict = conflictInfo.find((conflict) => {
                    return parseInt(conflict.dayIndex) === dayIdx && conflict.instructorId === period?.instructor?.id;
                });

                if (cellConflict) {
                    this.conflictDropTargets.set(cellKey, cellConflict);
                } else {
                    this.validDropTargets.add(cellKey);
                }
            });
        });
    }

    isValidDropTarget(scheduleIndex: number, periodIndex: number): boolean {
        if (!this.selectedPeriod) return false;
        const cellKey = this.getCellKey(scheduleIndex, periodIndex);
        return this.validDropTargets.has(cellKey);
    }

    isConflictTarget(scheduleIndex: number, periodIndex: number): boolean {
        if (!this.selectedPeriod) return false;
        const cellKey = this.getCellKey(scheduleIndex, periodIndex);
        return this.conflictDropTargets.has(cellKey);
    }

    isSelectedPeriod(scheduleIndex: number, periodIndex: number): boolean {
        if (!this.selectedPeriod) return false;
        return this.selectedPeriod.scheduleIndex === scheduleIndex && this.selectedPeriod.periodIndex === periodIndex;
    }

    deselectPeriod() {
        this.selectedPeriod = null;
        this.validDropTargets.clear();
        this.conflictDropTargets.clear();
    }

    onDragStart(classSec: any, scheduleIndex: number, periodIndex: number) {
        if (!this.isSelectedPeriod(scheduleIndex, periodIndex)) {
            return;
        }
    }

    onDrop(classSec: any, targetScheduleIndex: number, targetPeriodIndex: number) {
        if (!this.selectedPeriod) {
            return;
        }
        if (this.isConflictTarget(targetScheduleIndex, targetPeriodIndex)) {
            const conflictInfo = this.conflictDropTargets.get(this.getCellKey(targetScheduleIndex, targetPeriodIndex));
            this.messageService.add({
                severity: 'error',
                summary: 'Conflict Detected',
                detail: `Cannot drop. Conflict with: ${conflictInfo?.instructorName} at ${conflictInfo?.startTime}`,
                life: 3000
            });
            return;
        }

        if (!this.isValidDropTarget(targetScheduleIndex, targetPeriodIndex)) {
            return;
        }

        const sourceSchedule = this.selectedPeriod.classSec.schedules[this.selectedPeriod.scheduleIndex];
        const targetSchedule = classSec.schedules[targetScheduleIndex];

        const sourcePeriod = sourceSchedule.periods[this.selectedPeriod.periodIndex];
        const targetPeriod = targetSchedule.periods[targetPeriodIndex];

        sourceSchedule.periods[this.selectedPeriod.periodIndex] = targetPeriod;
        targetSchedule.periods[targetPeriodIndex] = sourcePeriod;

        this.processForDisplay();
        this.deselectPeriod();

        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Period moved successfully',
            life: 2000
        });

        this.timetableChange.emit(this.displayTimeTableJson);
    }

    getTooltipText(scheduleIndex: number, periodIndex: number, cell: any): string {
        if (this.isSelectedPeriod(scheduleIndex, periodIndex)) {
            return 'Selected - Drag to move within section';
        }
        if (this.isValidDropTarget(scheduleIndex, periodIndex)) {
            return 'Valid drop target';
        }
        if (this.isConflictTarget(scheduleIndex, periodIndex)) {
            const conflictInfo = this.conflictDropTargets.get(this.getCellKey(scheduleIndex, periodIndex));
            return `Conflict: ${conflictInfo?.instructorName} at ${conflictInfo?.startTime}-${conflictInfo?.endTime}`;
        }
        if (this.selectedPeriod) {
            return 'Validating...';
        }
        return cell.tooltip || `${cell.subject?.name || 'Free Period'}<br/>${cell.startTime} - ${cell.endTime}`;
    }

    onPublish(): void {
        this.publish.emit();
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
