import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { BreakConfig, DepartmentTimetable } from '../../pages/models/time-table';
import { TimeTableService } from '../../pages/service/time-table.service';

// interface InstructorSlot {
//     dayIndex: number;
//     periodIndex: number;
//     className: string;
//     sectionName: string;
//     startTime: string;
//     endTime: string;
// }

// interface InstructorConflicts {
//     instructorId: string;
//     instructorName: string;
//     allocatedSlots: InstructorSlot[];
// }

@Component({
    selector: 'app-timetable-view',
    standalone: true,
    imports: [CommonModule, ToastModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './timetable-view.component.html',
    styles: [``]
})
export class TimetableViewComponent {
    @Input() dailogeType: 'Edit' | 'View' = 'View';
    @Output() publish = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
    @Output() timetableChange = new EventEmitter<DepartmentTimetable>();

    timeTableService = inject(TimeTableService);
    displayTimeTableJson!: DepartmentTimetable | any;

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

        this.displayTimeTableJson.classSections?.forEach((classSec) => {
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
            classSec.schedules.forEach((schedule) => {
                const cells: any[] = [];
                schedule.dayName = this.getDayName(schedule.day);
                columns.forEach((col) => {
                    if (col.type === 'period') {
                        const period = schedule.periods[col.index];

                        cells.push({
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
        const selectedName = this.timetableJson.settings.workingDays[dayIndex]?.name;
        return selectedName || '';
    }

    calculateDuration(startTime: string, endTime: string): number {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        return endMinutes - startMinutes;
    }

    onPublish(): void {
        this.publish.emit();
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
