import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DragDropModule } from 'primeng/dragdrop'; // <--- 1. Import PrimeNG DragDrop
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { BreakConfig, DepartmentTimetable } from '../../pages/models/time-table';
import { TimeTableService } from '../../pages/service/time-table.service';

@Component({
    selector: 'app-timetable-view',
    standalone: true,
    imports: [CommonModule, ToastModule, TooltipModule, DragDropModule], // <--- 2. Add Module here
    providers: [MessageService],
    templateUrl: './timetable-view.component.html',
    styles: [
        `
            /* 3. Add Drag Styles */
            .drag-over-active {
                @apply border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/40 border-dashed !important;
            }
            .cursor-grab {
                cursor: grab;
            }
            .cursor-grabbing {
                cursor: grabbing;
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
    displayTimeTableJson!: DepartmentTimetable | any;

    // Holds the data of the item currently being dragged
    draggedPeriodData: any = null;

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
                    index: p - 1 // Real index in the periods array
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
                            // Helper properties for identifying slots
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

    // --- Drag and Drop Logic ---

    onDragStart(classSec: any, scheduleIndex: number, periodIndex: number) {
        this.draggedPeriodData = {
            classSec,
            scheduleIndex, // The index of the day (row)
            periodIndex // The index of the period (column) in the real data array
        };
    }

    onDragEnd() {
        this.draggedPeriodData = null;
    }

    onDrop(classSec: any, targetScheduleIndex: number, targetPeriodIndex: number) {
        const source = this.draggedPeriodData;

        // Validation:
        // 1. Must have source data
        // 2. Must be within the same Class Section (optional, but safer logic)
        if (!source || source.classSec !== classSec) {
            return;
        }

        // Do not swap if dropped on itself
        if (source.scheduleIndex === targetScheduleIndex && source.periodIndex === targetPeriodIndex) {
            return;
        }

        // Perform the Swap on the REAL data structure
        const sourceSchedule = classSec.schedules[source.scheduleIndex];
        const targetSchedule = classSec.schedules[targetScheduleIndex];

        const sourcePeriod = sourceSchedule.periods[source.periodIndex];
        const targetPeriod = targetSchedule.periods[targetPeriodIndex];

        // Swap
        sourceSchedule.periods[source.periodIndex] = targetPeriod;
        targetSchedule.periods[targetPeriodIndex] = sourcePeriod;

        // Refresh UI
        this.processForDisplay();
        this.draggedPeriodData = null;

        // Notify parent if needed
        // this.timetableChange.emit(this.displayTimeTableJson);
    }

    onPublish(): void {
        this.publish.emit();
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
