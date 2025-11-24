import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, effect, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ClassSection, DepartmentTimetable, Period } from '../../pages/models/time-table';

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
    imports: [CommonModule, ToastModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './timetable-view.component.html',
    styles: [
        `
            /* ensure selected cells keep visible outline only for keyboard users */
            [aria-selected='true'] {
                box-shadow: none;
            }

            /* Fix border rendering */
            .grid > div {
                border-style: solid;
                border-width: 1px;
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

    constructor(
        private messageService: MessageService,
        private http: HttpClient
    ) {
        effect(() => {
            if (!this.prepared() && !this.draggedItem()) {
                this.instructorConflicts.set(null);
            }
        });
    }

    /* grid template with minmax to prevent collapse */
    gridTemplateColumns(slotCount: number): string {
        if (!slotCount || slotCount <= 0) return 'minmax(120px, 160px)';
        const repeatCols = `repeat(${slotCount}, minmax(140px, 1fr))`;
        return `minmax(120px, 160px) ${repeatCols}`;
    }

    getSlotIndexes(classSec: ClassSection): number[] {
        if (!classSec?.schedules?.[0]?.periods) {
            return [];
        }
        return classSec.schedules[0].periods.map((_, i: number) => i);
    }

    getDayName(dayIndex: number): string {
        return this.timetableJson.settings.workingDays.filter((day) => day.selected)[dayIndex]?.name || '';
    }

    canDragPeriod(classSection: ClassSection, dayIndex: number, periodIndex: number): boolean {
        if (this.dailogeType !== 'Edit') return false;

        const prepared = this.prepared();
        if (!prepared) return false;

        // Only allow dragging from the currently prepared period
        return prepared.classSection.classId === classSection.classId && prepared.dayIndex === dayIndex && prepared.periodIndex === periodIndex && this.preparedForDrag();
    }

    async onPeriodClick(period: Period, classSection: ClassSection, dayIndex: number, periodIndex: number): Promise<void> {
        if (this.dailogeType !== 'Edit') return;

        const current = this.prepared();
        if (current && current.classSection.classId === classSection.classId && current.dayIndex === dayIndex && current.periodIndex === periodIndex) {
            this.prepared.set(null);
            return;
        }

        this.prepared.set({ period, classSection, dayIndex, periodIndex });

        // Reset conflicts when selecting a new period
        this.instructorConflicts.set(null);
        this.loadingConflicts.set(false);

        // Only check conflicts for lecture periods with instructors
        if (period.type !== 'lecture' || !period.instructor?.id) {
            return;
        }

        this.loadingConflicts.set(true);
        try {
            await this.fetchInstructorConflicts(period.instructor.id, period.instructor.name);
        } catch (err) {
            console.error('Error fetching conflicts', err);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to check instructor schedule' });
            this.instructorConflicts.set(null);
        } finally {
            this.loadingConflicts.set(false);
        }
    }

    preparedForDrag(): boolean {
        const p = this.prepared();
        if (!p) return false;

        // For non-lecture periods, always allow drag
        if (p.period.type !== 'lecture') return true;

        // For lecture periods, only allow drag if no conflicts or no instructor
        if (!p.period.instructor?.id) return true;

        return !this.loadingConflicts();
    }

    isSelectedPeriod(classSection: ClassSection, dayIndex: number, periodIndex: number): boolean {
        const p = this.prepared();
        if (!p) return false;

        // Only highlight periods in the SAME class section
        return p.classSection.classId === classSection.classId && p.dayIndex === dayIndex && p.periodIndex === periodIndex;
    }

    async fetchInstructorConflicts(instructorId: string, instructorName: string): Promise<void> {
        const response = await this.simulateApiCall(instructorId);
        this.instructorConflicts.set({
            instructorId,
            instructorName,
            allocatedSlots: response.allocatedSlots
        });
    }

    private async simulateApiCall(instructorId: string): Promise<{ allocatedSlots: InstructorSlot[] }> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const allocatedSlots: InstructorSlot[] = [];
                for (const classSection of this.timetableJson.classSections) {
                    classSection.schedules.forEach((schedule, dayIdx) => {
                        schedule.periods.forEach((period, periodIdx) => {
                            if (period.instructor?.id === instructorId && period.type === 'lecture') {
                                allocatedSlots.push({
                                    dayIndex: dayIdx,
                                    periodIndex: periodIdx,
                                    className: classSection.className,
                                    sectionName: classSection.sectionName,
                                    startTime: period.startTime,
                                    endTime: period.endTime
                                });
                            }
                        });
                    });
                }
                resolve({ allocatedSlots });
            }, 300);
        });
    }

    onNativeDragStart(event: DragEvent, period: Period, classSection: ClassSection, dayIndex: number, periodIndex: number): void {
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

        this.draggedItem.set(prepared);
        event.dataTransfer!.effectAllowed = 'move';
        event.dataTransfer!.setData('text/plain', 'move');

        // If this is a lecture period with instructor and we don't have conflicts yet, fetch them
        if (prepared.period.type === 'lecture' && prepared.period.instructor?.id && !this.instructorConflicts()) {
            this.loadingConflicts.set(true);
            this.fetchInstructorConflicts(prepared.period.instructor.id, prepared.period.instructor.name).finally(() => this.loadingConflicts.set(false));
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        const dragged = this.draggedItem();
        if (dragged) event.dataTransfer!.dropEffect = 'move';
    }

    onDrop(event: DragEvent, targetClassSection: ClassSection, targetDayIndex: number, targetPeriodIndex: number): void {
        event.preventDefault();
        const dragged = this.draggedItem();
        if (!dragged) {
            this.resetDragState();
            return;
        }

        // Allow dropping on any slot type (including breaks and free periods)
        if (dragged.classSection.classId === targetClassSection.classId && dragged.dayIndex === targetDayIndex && dragged.periodIndex === targetPeriodIndex) {
            this.resetDragState();
            return;
        }

        const validation = this.canDropAtSlot(targetClassSection, targetDayIndex, targetPeriodIndex);
        if (!validation.canDrop) {
            this.messageService.add({ severity: 'error', summary: 'Cannot Drop', detail: validation.reason || 'Invalid drop location' });
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

        this.messageService.add({ severity: 'success', summary: 'Period Moved', detail: 'Timetable updated' });

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

    canDropAtSlot(targetClassSection: ClassSection, targetDayIndex: number, targetPeriodIndex: number): { canDrop: boolean; reason?: string } {
        const dragged = this.draggedItem();
        if (!dragged) return { canDrop: false };

        // Allow dropping within the same class section only
        if (dragged.classSection.classId !== targetClassSection.classId) {
            return { canDrop: false, reason: 'Can only move periods within the same class section' };
        }

        // Don't allow dropping on the same slot
        if (dragged.classSection.classId === targetClassSection.classId && dragged.dayIndex === targetDayIndex && dragged.periodIndex === targetPeriodIndex) {
            return { canDrop: false, reason: 'Cannot drop on same slot' };
        }

        // For non-lecture periods or lecture periods without instructors, allow free movement
        if (dragged.period.type !== 'lecture' || !dragged.period.instructor?.id) {
            return { canDrop: true };
        }

        // For lecture periods with instructors, check conflicts
        const conflicts = this.instructorConflicts();

        // If conflicts data is not available yet, allow drop (we'll check in background)
        if (!conflicts) {
            return { canDrop: true };
        }

        // If conflicts data is available but empty, allow drop
        if (conflicts.allocatedSlots.length === 0) {
            return { canDrop: true };
        }

        // Check if there's a conflict at the target slot
        const hasConflict = conflicts.allocatedSlots.some((slot) => slot.dayIndex === targetDayIndex && slot.periodIndex === targetPeriodIndex);

        if (hasConflict) {
            const conflictSlot = conflicts.allocatedSlots.find((s) => s.dayIndex === targetDayIndex && s.periodIndex === targetPeriodIndex);
            return {
                canDrop: false,
                reason: `${conflicts.instructorName} is teaching ${conflictSlot?.className} - ${conflictSlot?.sectionName} at this time`
            };
        }

        return { canDrop: true };
    }

    computeCellClasses(classSection: ClassSection, dayIndex: number, periodIndex: number, period: Period): string {
        const base = 'px-3 py-2 transition-all duration-150 relative flex items-stretch justify-start cursor-pointer';

        if (this.dailogeType !== 'Edit') {
            return `${base} bg-white dark:bg-gray-800`;
        }

        // Base styles for different period types
        let typeClasses = '';
        switch (period.type) {
            case 'break':
                typeClasses = 'bg-gray-50 dark:bg-gray-800/50';
                break;
            case 'free':
                typeClasses = 'bg-white dark:bg-gray-800';
                break;
            case 'lecture':
                typeClasses = 'bg-white dark:bg-gray-800';
                break;
        }

        const prepared = this.prepared();
        if (!prepared) {
            return `${base} ${typeClasses}`;
        }

        // Selected period (the one being prepared for drag)
        if (prepared.classSection.classId === classSection.classId && prepared.dayIndex === dayIndex && prepared.periodIndex === periodIndex) {
            return `${base} ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/20 ${typeClasses}`;
        }

        // Only show drop targets in the same class section
        if (prepared.classSection.classId === classSection.classId) {
            const validation = this.canDropAtSlot(classSection, dayIndex, periodIndex);

            if (validation.canDrop) {
                return `${base} ring-2 ring-green-400 dark:ring-green-500 bg-green-50 dark:bg-green-900/10 ${typeClasses}`;
            } else {
                // Only show red if there's a specific conflict reason, otherwise use default styling
                if (validation.reason && validation.reason.includes('teaching')) {
                    return `${base} ring-2 ring-red-500 dark:ring-red-400 bg-red-50 dark:bg-red-900/10 cursor-not-allowed ${typeClasses}`;
                } else {
                    // For other restrictions (same slot, different section), use default styling
                    return `${base} ${typeClasses} cursor-not-allowed`;
                }
            }
        }

        return `${base} ${typeClasses}`;
    }

    getDropTooltip(classSection: ClassSection, dayIndex: number, periodIndex: number): string {
        const prepared = this.prepared();
        if (!prepared) return '';

        // Only show tooltips for the same class section
        if (prepared.classSection.classId !== classSection.classId) {
            return 'Can only move within same class section';
        }

        if (prepared.classSection.classId === classSection.classId && prepared.dayIndex === dayIndex && prepared.periodIndex === periodIndex) {
            return 'This is the source period';
        }

        const validation = this.canDropAtSlot(classSection, dayIndex, periodIndex);

        if (validation.canDrop) {
            if (this.loadingConflicts()) {
                return 'Checking conflicts... ✓ Drop here';
            }
            return '✓ Drop here';
        } else {
            return `✗ ${validation.reason || 'Cannot drop here'}`;
        }
    }

    private swapPeriods(source: { classSection: ClassSection; dayIndex: number; periodIndex: number }, target: { classSection: ClassSection; dayIndex: number; periodIndex: number }): void {
        const sourcePeriod = { ...source.classSection.schedules[source.dayIndex].periods[source.periodIndex] };
        const targetPeriod = { ...target.classSection.schedules[target.dayIndex].periods[target.periodIndex] };

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
}
