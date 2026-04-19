import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Teacher } from '../../../models/time-table';
import { TimeTableService } from '../../../service/time-table.service';

@Component({
    selector: 'app-teachers',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule],
    templateUrl: './teachers.component.html'
})
export class TeachersComponent {
    timeTableService = inject(TimeTableService);
    selectedTeacher: Teacher | null = null;
    showDialog = false;

    getTeachers() {
        return this.timeTableService.getTeachersList();
    }

    getWorkingDays() {
        return this.timeTableService.timeTable.settings.workingDays.filter((day) => day.selected);
    }

    getPeriods() {
        return this.timeTableService.periods.slice(0, this.timeTableService.timeTable.settings.periodsPerDay);
    }

    openDialog(teacher: Teacher) {
        this.selectedTeacher = teacher;
        this.showDialog = true;
    }

    toggleAvailability(periodIndex: number, day) {
        if (!this.selectedTeacher) return;
        this.timeTableService.togglePeriodAvailability(this.selectedTeacher.id, day, periodIndex);
    }

    setBulkStatus(status: 'available' | 'unavailable' | 'neutral') {
        if (!this.selectedTeacher) return;

        const workingDays = this.timeTableService.timeTable.settings.workingDays;
        const periodsPerDay = this.timeTableService.timeTable.settings.periodsPerDay;

        // Clear existing
        this.selectedTeacher.timeOn = [];
        this.selectedTeacher.timeOff = [];

        // Set new status for all periods
        for (let dayIndex = 0; dayIndex < workingDays.length; dayIndex++) {
            const day = workingDays[dayIndex];

            if (day.selected) {
                for (let periodIndex = 0; periodIndex < periodsPerDay; periodIndex++) {
                    const key: [number, number] = [dayIndex, periodIndex];

                    if (status === 'available') {
                        this.selectedTeacher.timeOn.push(key);
                    } else if (status === 'unavailable') {
                        this.selectedTeacher.timeOff.push(key);
                    }
                }
            }
        }

        // for (let dayIndex = 0; dayIndex < workingDays.length; dayIndex++) {
        //     for (let periodIndex = 0; periodIndex < periodsPerDay; periodIndex++) {
        //         const key: [number, number] = [dayIndex, periodIndex];

        //         if (status === 'available') {
        //             this.selectedTeacher.timeOn.push(key);
        //         } else if (status === 'unavailable') {
        //             this.selectedTeacher.timeOff.push(key);
        //         }
        //     }
        // }
    }

    getCellClass(day, periodIndex: number): string {
        if (!this.selectedTeacher) return '';

        const status = this.timeTableService.getPeriodStatus(this.selectedTeacher, day, periodIndex);
        const base = 'transition-colors duration-200';

        switch (status) {
            case 'available':
                return `${base} bg-green-100 hover:bg-green-200 border-l-4 border-green-500 dark:bg-green-900 dark:hover:bg-green-800 dark:border-green-700`;
            case 'unavailable':
                return `${base} bg-red-100 hover:bg-red-200 border-l-4 border-red-500 dark:bg-red-900 dark:hover:bg-red-800 dark:border-red-700`;
            default:
                return `${base} bg-gray-100 hover:bg-gray-200 border-l-4 border-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-400`;
        }
    }

    getIndicatorClass(dayIndex: number, periodIndex: number): string {
        if (!this.selectedTeacher) return '';

        const status = this.timeTableService.getPeriodStatus(this.selectedTeacher, dayIndex, periodIndex);

        switch (status) {
            case 'available':
                return 'bg-green-500 dark:bg-green-400';
            case 'unavailable':
                return 'bg-red-500 dark:bg-red-400';
            default:
                return 'bg-gray-400 dark:bg-gray-500';
        }
    }

    // Get PrimeNG icon class based on status
    getIconClass(day, periodIndex: number): string {
        if (!this.selectedTeacher) return 'pi pi-circle';

        const status = this.timeTableService.getPeriodStatus(this.selectedTeacher, day, periodIndex);

        switch (status) {
            case 'available':
                return 'pi pi-check';
            case 'unavailable':
                return 'pi pi-times';
            default:
                return '';
        }
    }

    getSummary(teacher: Teacher) {
        return this.timeTableService.getAvailabilitySummary(teacher);
    }

    saveChanges() {
        // Implement save logic here
        console.log('Saving changes for:', this.selectedTeacher?.name);
        this.showDialog = false;
    }
}
