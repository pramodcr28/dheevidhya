import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

export interface AcademicYearEntry {
    academicYear: string;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
}

@Component({
    selector: 'app-academic-year-manager',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, DatePickerModule, TagModule, DividerModule, ToastModule, TooltipModule],
    templateUrl: './academic-year-entry.component.html',
    providers: [MessageService]
})
export class AcademicYearManagerComponent implements OnChanges {
    messageService = inject(MessageService);

    @Input() visible: boolean = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Input() employeeId: string = '';
    @Input() existingAcademicYears: string[] = [];
    @Input() currentAcademicYear: string = '';

    @Output() yearAdded = new EventEmitter<string>();

    yearEntries: AcademicYearEntry[] = [];
    newYearDateRange: Date[] | null = null;
    newYearLabel: string = '';
    dateError: string = '';
    showAddForm: boolean = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['existingAcademicYears'] || changes['currentAcademicYear']) {
            this.buildYearEntries();
        }
    }

    private buildYearEntries(): void {
        this.yearEntries = this.existingAcademicYears
            .map((ay) => {
                const parsed = this.parseAcademicYear(ay);
                return parsed
                    ? {
                          academicYear: ay,
                          startDate: parsed[0],
                          endDate: parsed[1],
                          isCurrent: ay === this.currentAcademicYear
                      }
                    : null;
            })
            .filter((e): e is AcademicYearEntry => e !== null)
            .sort((a, b) => b.startDate.getTime() - a.startDate.getTime()); // newest first
    }

    onDateRangeChange(value: Date[]): void {
        this.dateError = '';
        this.newYearLabel = '';

        if (!value || value.filter((v) => v != null).length !== 2) {
            return;
        }

        const [rawStart, rawEnd] = value;
        const startYear = rawStart.getFullYear();
        const endYear = rawEnd.getFullYear();

        if (endYear - startYear !== 1) {
            this.dateError = 'Academic year must span exactly two consecutive years (e.g. 2024–2025).';
            this.newYearDateRange = null;
            return;
        }

        const candidate = `${startYear}-${endYear}`;

        if (this.isOverlapping(startYear)) {
            this.dateError = `The period ${candidate} overlaps with an existing academic year. Choose a different year.`;
            this.newYearDateRange = null;
            return;
        }

        this.newYearLabel = candidate;
    }

    private isOverlapping(candidateStartYear: number): boolean {
        return this.yearEntries.some((e) => e.startDate.getFullYear() === candidateStartYear);
    }

    addYear(): void {
        if (!this.newYearLabel || this.dateError) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Select a valid range',
                detail: this.dateError || 'Please select a valid academic year range first.'
            });
            return;
        }

        this.yearAdded.emit(this.newYearLabel);
        this.resetAddForm();

        this.messageService.add({
            severity: 'success',
            summary: 'Academic Year Added',
            detail: `${this.newYearLabel} has been queued. Save the employee record to confirm.`
        });
    }

    resetAddForm(): void {
        this.newYearDateRange = null;
        this.newYearLabel = '';
        this.dateError = '';
        this.showAddForm = false;
    }

    close(): void {
        this.resetAddForm();
        this.visibleChange.emit(false);
    }

    parseAcademicYear(academicYear: string): Date[] | null {
        const match = academicYear.match(/^(\d{4})-(\d{4})$/);
        if (!match) return null;
        return [new Date(parseInt(match[1]), 3, 1), new Date(parseInt(match[2]), 2, 31)];
    }
}
