// Modern TimetableViewComponent with Break Column Support and PrimeNG Styling
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, effect, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ClassSection, DepartmentTimetable, Period } from '../../pages/models/time-table';
import { TimeTableService } from '../../pages/service/time-table.service';

interface DragData {
    period: Period;
    classSection: ClassSection;
    dayIndex: number;
    periodIndex: number;
}

interface InstructorSlot {
    dayIndex: number;
    periodIndex: number;
    className: string;
    sectionName: string;
    startTime: string;
    endTime: string;
}

interface InstructorConflicts {
    instructorId: string;
    instructorName: string;
    allocatedSlots: InstructorSlot[];
}

@Component({
    selector: 'app-timetable-view',
    standalone: true,
    imports: [CommonModule, ToastModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './timetable-view.component.html',
    styles: [
        `
            [aria-selected='true'] {
                box-shadow: none;
            }

            /* Smooth animations */
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

            .space-y-6 > * {
                animation: fadeIn 0.3s ease-out;
            }

            /* Break column styling */
            .break-column {
                width: 4rem !important;
                min-width: 4rem !important;
                max-width: 4rem !important;
            }

            /* Compact period cells */
            .compact-period {
                padding: 0.5rem !important;
                min-height: 100px !important;
            }

            /* Smaller font sizes */
            .text-smaller {
                font-size: 0.875rem;
                line-height: 1.25rem;
            }

            .text-xs-smaller {
                font-size: 0.75rem;
                line-height: 1rem;
            }
            /* styles.css or global css */
            .writing-vertical-rl {
                writing-mode: vertical-rl;
                text-orientation: mixed;
            }
        `
    ]
})
export class TimetableViewComponent {
    @Input() timetableJson!: DepartmentTimetable;
    @Input() dailogeType: 'Edit' | 'View' = 'View';
    @Output() publish = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
    @Output() timetableChange = new EventEmitter<DepartmentTimetable>();

    prepared = signal<DragData | null>(null);
    draggedItem = signal<DragData | null>(null);
    instructorConflicts = signal<InstructorConflicts | null>(null);
    loadingConflicts = signal<boolean>(false);

    timeTableService = inject(TimeTableService);

    constructor(
        private messageService: MessageService,
        private http: HttpClient
    ) {
        effect(() => {
            const prep = this.prepared();
            const conflicts = this.instructorConflicts();
            const loading = this.loadingConflicts();

            if (prep) {
                this.updateAllPeriodProperties(prep, conflicts, loading);
            } else {
                this.clearAllPeriodProperties();
            }
        });
    }

    /**
     * Useful helper (if needed elsewhere) to fetch break for a specific slot index (1-based afterPeriod)
     */
    getBreakForSlot(slotIndex: number) {
        return this.timetableJson?.settings?.breaks?.find((b: any) => b.enabled && b.afterPeriod === slotIndex);
    }

    getSlotIndexes(classSec: ClassSection): number[] {
        if (!classSec?.schedules?.[0]?.periods) {
            return [];
        }
        return classSec.schedules[0].periods.map((_, i: number) => i);
    }

    getDayName(dayIndex: number): string {
        // returns Nth selected working day name (your original logic)
        const selected = this.timetableJson.settings.workingDays.filter((d) => d.selected);
        return selected[dayIndex]?.name || '';
    }

    // Calculate duration between two times
    calculateDuration(startTime: string, endTime: string): number {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        return endMinutes - startMinutes;
    }
    async onPeriodClick(period: Period, classSection: ClassSection, dayIndex: number, periodIndex: number): Promise<void> {
        if (this.dailogeType !== 'Edit') return;

        if (period?.type === 'break') {
            this.messageService.add({
                severity: 'info',
                summary: 'Break Period',
                detail: 'Break periods cannot be moved or edited',
                life: 3000
            });
            return;
        }

        const current = this.prepared();

        // Toggle off if clicking same period
        if (current && current.classSection.classId === classSection.classId && current.dayIndex === dayIndex && current.periodIndex === periodIndex) {
            this.prepared.set(null);
            return;
        }

        // Set new prepared period
        this.prepared.set({ period, classSection, dayIndex, periodIndex });

        // Reset conflicts
        this.instructorConflicts.set(null);
        this.loadingConflicts.set(false);

        // Only check conflicts for lecture periods with instructors
        if (period.type !== 'lecture' || !period.instructor?.id) {
            return;
        }

        this.loadingConflicts.set(true);

        let request = {
            timeTableId: this.timetableJson.id,
            periodIndex: periodIndex,
            dayIndex: dayIndex,
            classId: classSection.classId,
            sectionId: classSection.sectionId
        };
        this.timeTableService.getPeriodConflicts(request).subscribe((response: any[]) => {
            // Group by instructorName
            const grouped: { [key: string]: any[] } = {};

            response.forEach((item) => {
                const name = item.instructorName?.trim();

                if (!grouped[name]) {
                    grouped[name] = [];
                }

                // Push only allocated slot fields
                grouped[name].push({
                    dayIndex: item.dayIndex,
                    className: item.className,
                    sectionName: item.sectionName,
                    deptName: item.deptName,
                    branchName: item.branchName,
                    startTime: item.startTime,
                    endTime: item.endTime
                });
            });

            // Convert grouped object into your required structure
            Object.keys(grouped).forEach((instructorName) => {
                this.instructorConflicts.set({
                    instructorId: null, // put your value here
                    instructorName,
                    allocatedSlots: grouped[instructorName]
                });
            });
            this.loadingConflicts.set(false);
        });
    }

    private updateAllPeriodProperties(prepared: DragData, conflicts: InstructorConflicts | null, loading: boolean): void {
        if (!this.timetableJson?.classSections) return;
        console.log('Updating period properties with prepared:', prepared, 'conflicts:', conflicts, 'loading:', loading);
        this.timetableJson.classSections.forEach((classSection) => {
            classSection.schedules.forEach((schedule, dayIndex) => {
                schedule.periods.forEach((period, periodIndex) => {
                    this.setPeriodProperties(period, classSection, dayIndex, periodIndex, prepared, conflicts, loading);
                });
            });
        });
    }

    private clearAllPeriodProperties(): void {
        if (!this.timetableJson?.classSections) return;

        this.timetableJson.classSections.forEach((classSection) => {
            classSection.schedules.forEach((schedule) => {
                schedule.periods.forEach((period) => {
                    period.cssClasses = this.getBaseCellClasses(period);
                    period.tooltip = '';
                    period.canDrop = false;
                });
            });
        });
    }

    private setPeriodProperties(period: Period, classSection: ClassSection, dayIndex: number, periodIndex: number, prepared: DragData, conflicts: InstructorConflicts | null, loading: boolean): void {
        // Break periods - not interactive
        if (period.type === 'break') {
            period.cssClasses = 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 border-2 border-orange-300 dark:border-orange-700 shadow-md cursor-default';
            period.tooltip = `${period.name} - ${this.calculateDuration(period.startTime, period.endTime)} minutes break`;
            period.canDrop = false;
            return;
        }

        // Free periods (lectures without subjects)
        const isFree = period.type === 'lecture' && !period.subject?.id;

        if (isFree) {
            if (this.dailogeType !== 'Edit') {
                period.cssClasses = 'bg-surface-100 dark:bg-surface-800 border-2 border-dashed border-surface-300 dark:border-surface-600';
                period.tooltip = '';
                period.canDrop = false;
                return;
            }
        }

        // Lecture periods
        if (period.type === 'lecture' && period.subject?.id) {
            // Base style for lectures
            let baseClass = 'bg-white dark:bg-gray-800 border border-primary-200 dark:border-primary-700 shadow-sm hover:shadow-md';

            if (this.dailogeType !== 'Edit') {
                period.cssClasses = baseClass;
                period.tooltip = '';
                period.canDrop = false;
                return;
            }

            // Edit mode styles
            period.cssClasses = baseClass + ' cursor-pointer';

            // Selected period (source)
            if (prepared.classSection.classId === classSection.classId && prepared.dayIndex === dayIndex && prepared.periodIndex === periodIndex) {
                period.cssClasses = 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 dark:border-primary-400 shadow-xl ring-2 ring-primary-300 dark:ring-primary-600 cursor-move';
                period.tooltip = '📍 Selected - Ready to move';
                period.canDrop = false;
                return;
            }

            // Different class section
            if (prepared.classSection.classId !== classSection.classId) {
                period.cssClasses = baseClass + ' opacity-40 cursor-not-allowed';
                period.tooltip = '❌ Can only move within same class section';
                period.canDrop = false;
                return;
            }

            // Same class section - validate drop
            const validation = this.validateDrop(classSection, dayIndex, periodIndex, prepared, conflicts);

            if (validation.canDrop) {
                period.cssClasses = 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-400 shadow-lg  cursor-pointer';
                period.tooltip = loading ? '🔄 Checking conflicts...' : '✅ Drop here to swap periods';
                period.canDrop = true;
            } else {
                if (validation.reason && validation.reason.includes('teaching')) {
                    period.cssClasses = 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-400 opacity-75 cursor-not-allowed';
                    period.tooltip = `❌ ${validation.reason}`;
                    period.canDrop = false;
                } else {
                    period.cssClasses = baseClass + ' opacity-50 cursor-not-allowed';
                    period.tooltip = `⚠️ ${validation.reason || 'Cannot drop here'}`;
                    period.canDrop = false;
                }
            }
        } else {
            // Free periods in edit mode
            let baseClass = 'bg-surface-100 dark:bg-surface-800 border-2 border-dashed border-surface-300 dark:border-surface-600';

            if (this.dailogeType === 'Edit') {
                period.cssClasses = baseClass + ' cursor-pointer hover:border-surface-400 dark:hover:border-surface-500';

                // If this free period can accept drops
                if (prepared.classSection.classId === classSection.classId) {
                    const validation = this.validateDrop(classSection, dayIndex, periodIndex, prepared, conflicts);

                    if (validation.canDrop) {
                        period.cssClasses = 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-400 shadow-lg cursor-pointer';
                        period.tooltip = '✅ Drop here to swap';
                        period.canDrop = true;
                    }
                }
            } else {
                period.cssClasses = baseClass;
                period.tooltip = '';
                period.canDrop = false;
            }
        }
    }

    private getBaseCellClasses(period: Period): string {
        if (period.type === 'break') {
            return 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 border-2 border-orange-300 dark:border-orange-700 shadow-md';
        }

        const isFree = period.type === 'lecture' && !period.subject?.id;

        if (isFree) {
            return 'bg-surface-100 dark:bg-surface-800 border-2 border-dashed border-surface-300 dark:border-surface-600';
        }

        return 'bg-white dark:bg-gray-800 border border-primary-200 dark:border-primary-700 shadow-sm';
    }

    private validateDrop(targetClassSection: ClassSection, targetDayIndex: number, targetPeriodIndex: number, prepared: DragData, conflicts: InstructorConflicts | null): { canDrop: boolean; reason?: string } {
        const targetPeriod = targetClassSection.schedules[targetDayIndex].periods[targetPeriodIndex];

        // Cannot drop on break periods
        if (targetPeriod.type === 'break') {
            return { canDrop: false, reason: 'Cannot swap with break periods' };
        }

        // Same slot
        if (prepared.classSection.classId === targetClassSection.classId && prepared.dayIndex === targetDayIndex && prepared.periodIndex === targetPeriodIndex) {
            return { canDrop: false, reason: 'Cannot drop on same slot' };
        }

        // Different class section
        if (prepared.classSection.classId !== targetClassSection.classId) {
            return { canDrop: false, reason: 'Can only move periods within same class section' };
        }

        // Non-lecture or no instructor - allow free movement
        if (prepared.period.type !== 'lecture' || !prepared.period.instructor?.id) {
            return { canDrop: true };
        }

        // No conflicts data yet or empty
        if (!conflicts || conflicts.allocatedSlots?.length === 0) {
            return { canDrop: true };
        }

        // Check for instructor conflict at target slot
        const conflictSlot = conflicts.allocatedSlots?.find((slot) => slot.dayIndex === targetDayIndex && slot.periodIndex === targetPeriodIndex);

        if (conflictSlot) {
            return {
                canDrop: false,
                reason: `Instructor ${conflicts.instructorName} is teaching ${conflictSlot.className}-${conflictSlot.sectionName} at this time`
            };
        }

        return { canDrop: true };
    }

    canDragPeriod(classSection: ClassSection, dayIndex: number, periodIndex: number): boolean {
        if (this.dailogeType !== 'Edit') return false;

        const period = classSection.schedules[dayIndex].periods[periodIndex];

        // Cannot drag break periods
        if (period.type === 'break') return false;

        const prepared = this.prepared();
        if (!prepared) return false;

        return prepared.classSection.classId === classSection.classId && prepared.dayIndex === dayIndex && prepared.periodIndex === periodIndex && this.preparedForDrag();
    }

    preparedForDrag(): boolean {
        const p = this.prepared();
        if (!p) return false;

        if (p.period.type === 'break') return false;

        if (p.period.type !== 'lecture') return true;

        return !this.loadingConflicts();
    }

    isSelectedPeriod(classSection: ClassSection, dayIndex: number, periodIndex: number): boolean {
        const p = this.prepared();
        if (!p) return false;

        return p.classSection.classId === classSection.classId && p.dayIndex === dayIndex && p.periodIndex === periodIndex;
    }

    onNativeDragStart(event: DragEvent, period: Period, classSection: ClassSection, dayIndex: number, periodIndex: number): void {
        // Prevent dragging break periods
        if (period.type === 'break') {
            event.preventDefault();
            return;
        }

        const prepared = this.prepared();
        if (!prepared) {
            event.preventDefault();
            return;
        }

        if (!(prepared.classSection.classId === classSection.classId && prepared.dayIndex === dayIndex && prepared.periodIndex === periodIndex)) {
            event.preventDefault();
            return;
        }

        if (!this.preparedForDrag()) {
            event.preventDefault();
            return;
        }
        debugger;
        this.draggedItem.set(prepared);
        event.dataTransfer!.effectAllowed = 'move';
        event.dataTransfer!.setData('text/plain', 'move');
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        const dragged = this.draggedItem();
        if (dragged) {
            event.dataTransfer!.dropEffect = 'move';
        }
    }

    onDrop(event: DragEvent, targetClassSection: ClassSection, targetDayIndex: number, targetPeriodIndex: number): void {
        event.preventDefault();
        const dragged = this.draggedItem();

        if (!dragged) {
            this.resetDragState();
            return;
        }

        const targetPeriod = targetClassSection.schedules[targetDayIndex].periods[targetPeriodIndex];

        if (!targetPeriod.canDrop) {
            this.messageService.add({
                severity: 'error',
                summary: 'Cannot Drop',
                detail: targetPeriod.tooltip || 'Invalid drop location',
                life: 4000
            });
            this.resetDragState();
            return;
        }

        this.swapPeriods(
            {
                classSection: dragged.classSection,
                dayIndex: dragged.dayIndex,
                periodIndex: dragged.periodIndex
            },
            {
                classSection: targetClassSection,
                dayIndex: targetDayIndex,
                periodIndex: targetPeriodIndex
            }
        );

        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: '✅ Period moved successfully!',
            life: 3000
        });

        this.resetDragState();
        this.timetableChange.emit(this.timetableJson);
    }

    onDragEnd(): void {
        this.resetDragState();
    }

    resetDragState(): void {
        this.draggedItem.set(null);
        this.prepared.set(null);
        this.instructorConflicts.set(null);
        this.loadingConflicts.set(false);
    }

    private swapPeriods(source: { classSection: ClassSection; dayIndex: number; periodIndex: number }, target: { classSection: ClassSection; dayIndex: number; periodIndex: number }): void {
        const sourcePeriod = { ...source.classSection.schedules[source.dayIndex].periods[source.periodIndex] };
        const targetPeriod = { ...target.classSection.schedules[target.dayIndex].periods[target.periodIndex] };

        // Clear UI properties before swapping
        delete sourcePeriod.cssClasses;
        delete sourcePeriod.tooltip;
        delete sourcePeriod.canDrop;
        delete targetPeriod.cssClasses;
        delete targetPeriod.tooltip;
        delete targetPeriod.canDrop;

        target.classSection.schedules[target.dayIndex].periods[target.periodIndex] = sourcePeriod;
        source.classSection.schedules[source.dayIndex].periods[source.periodIndex] = targetPeriod;
    }

    onPublish(): void {
        this.publish.emit();
    }

    onCancel(): void {
        this.prepared.set(null);
        this.cancel.emit();
    }
    getColumnsWithBreaks(classSec: ClassSection): Array<any> {
        const periods = this.getSlotIndexes(classSec);
        // const breaks = this.timetableJson?.settings?.breaks || [];
        const cols: any[] = [];

        periods.forEach((_, idx) => {
            // period column
            cols.push({ type: 'period', index: idx });

            // check if any break is to be inserted AFTER this period (afterPeriod is 1-based)
            const breakItem = this.timetableJson?.settings?.breaks?.find((b: any) => b.afterPeriod === idx + 1);
            if (breakItem) {
                cols.push({ type: 'break', breakItem });
            }
        });

        return cols;
    }

    gridTemplateColumns(totalColCount: number): string {
        if (!totalColCount || totalColCount <= 0) {
            return 'minmax(120px, 140px)';
        }

        let template = 'minmax(120px, 140px) ';

        for (let i = 0; i < totalColCount; i++) {
            template += 'auto ';
        }

        return template;
    }
}
