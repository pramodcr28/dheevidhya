import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ApiLoaderService } from '../../../../core/services/loaderService';
import { TimetableViewComponent } from '../../../../shared/timetable-view/timetable-view.component';
import { ClassSection, DepartmentTimetable } from '../../../models/time-table';
import { TimeTableService } from '../../../service/time-table.service';
import { CommonService } from './../../../../core/services/common.service';
@Component({
    selector: 'app-review',
    standalone: true,
    imports: [CommonModule, DialogModule, ToastModule, MessageModule, TimetableViewComponent],
    providers: [MessageService],
    templateUrl: './review.component.html'
})
export class ReviewComponent {
    showTimetableDialog = false;
    timetableJson: DepartmentTimetable | null = null;
    messageService = inject(MessageService);
    commonService = inject(CommonService);
    timeTableService = inject(TimeTableService);
    router = inject(Router);
    validationErrors: string[];
    loader = inject(ApiLoaderService);

    generateTimetable() {
        const teachers = this.timeTableService.getTeachersWithAvailability().map((t) => ({
            id: t.id,
            name: t.name,
            preferred_periods: t.timeOn,
            avoided_periods: t.timeOff,
            unavailable_periods: t.unavailable_periods
        }));

        const exportData: any = {
            days: this.timeTableService.timeTable.settings.workingDays.map((day, index) => (day.selected ? index : -1)).filter((index) => index !== -1),
            periods_per_day: this.timeTableService.timeTable.settings.periodsPerDay,
            teachers,
            classes: this.timeTableService.classes
        };

        const errors = this.validateTimetable(exportData);
        if (errors.length) {
            this.validationErrors = errors;
            return;
        }

        this.validationErrors = [];
        this.loader.show('Generating Weekly Slots');
        this.timeTableService.generateTimeTable(exportData).subscribe(
            (response: any) => {
                this.loader.hide();
                const rawTimetable = response.timetable;
                const classSections: any[] = [];
                if (rawTimetable) {
                    for (const key of Object.keys(rawTimetable)) {
                        const [classId, sectionId] = key.split('-');
                        const classEntry = this.timeTableService.classes.find((cls) => cls.id === key);

                        let className = '';
                        let sectionName = '';

                        if (classEntry) {
                            [className, sectionName] = classEntry.name.split('-');
                        }

                        const dayEntries = rawTimetable[key];
                        const schedules: any[] = [];
                        const settings = this.timeTableService.timeTable.settings;

                        // Get enabled breaks, sorted by afterPeriod
                        const enabledBreaks = (settings.breaks || []).filter((b) => b.enabled).sort((a, b) => a.afterPeriod - b.afterPeriod);

                        let dayStartMinutes = this.toMinutes(settings.startTime);

                        for (const dayIndex of Object.keys(dayEntries)) {
                            const periods: any[] = [];
                            const periodEntries = dayEntries[dayIndex];
                            let currentStart = dayStartMinutes;
                            let lecturePeriodCount = 0; // Track actual lecture periods

                            for (const periodIndex of Object.keys(periodEntries)) {
                                const period = periodEntries[periodIndex];
                                lecturePeriodCount++;

                                const startTimeStr = this.toHHmm(currentStart);
                                const endTimeStr = this.toHHmm(currentStart + settings.periodDuration);

                                // Add lecture period
                                periods.push({
                                    startTime: startTimeStr,
                                    endTime: endTimeStr,
                                    type: 'lecture',
                                    name: period.subject_name,
                                    subject: {
                                        id: period.subject_id,
                                        name: period.subject_name
                                    },
                                    instructor: {
                                        id: period.teacher_id,
                                        name: period.teacher_name
                                    }
                                });

                                currentStart += settings.periodDuration;

                                // Check if we need to insert a break after this lecture period
                                const breakToInsert = enabledBreaks.find((b) => b.afterPeriod === lecturePeriodCount);

                                if (breakToInsert) {
                                    const breakStartTime = this.toHHmm(currentStart);
                                    const breakEndTime = this.toHHmm(currentStart + breakToInsert.duration);

                                    // Insert break period
                                    periods.push({
                                        startTime: breakStartTime,
                                        endTime: breakEndTime,
                                        type: 'break',
                                        name: breakToInsert.name,
                                        subject: null,
                                        instructor: null
                                    });

                                    currentStart += breakToInsert.duration;
                                }
                            }

                            schedules.push({
                                day: dayIndex,
                                periods
                            });
                        }

                        classSections.push({
                            classId,
                            className,
                            sectionId,
                            sectionName,
                            schedules
                        });
                    }
                    this.timetableJson = {
                        id: null,
                        status: 'draft',
                        departmentId: this.timeTableService.timeTable.department.id,
                        academicYear: this.timeTableService.timeTable.settings.academicYear,
                        branch: this.commonService.branch?.id || null,
                        branchName: this.commonService.branch?.name || '',
                        departmentName: this.timeTableService.timeTable?.department?.name,
                        settings: { ...this.timeTableService.timeTable.settings },
                        classSections
                    };

                    this.showTimetableDialog = true;
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate timetable. Please Contact IT Admin.' });
                }
            },
            (errors) => {
                this.loader.hide();
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate timetable. Please Contact IT Admin.' });
            }
        );
    }

    private toMinutes(timeStr: string): number {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    private toHHmm(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    saveTimetable(status) {
        this.timetableJson['status'] = status;
        this.timeTableService.create(this.timetableJson).subscribe((result: any) => {
            if (result.status != 200) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: result.message
                });
            } else {
                this.router.navigate(['/home/time-table-list']);
                this.messageService.add({ severity: 'success', summary: 'Success Message', detail: 'Congrats! Time Table Added' });
            }
        });
    }

    cancel() {
        this.showTimetableDialog = false;
        this.timetableJson = null;
    }

    getSlotIndexes(classSec: ClassSection): number[] {
        const slots = classSec.schedules[0]?.periods.length || 0;
        return Array.from({ length: slots }, (_, i) => i);
    }

    getWorkingDays() {
        return this.timeTableService.timeTable.settings.workingDays
            .filter((slot) => slot.selected)
            .map((slot) => slot.name)
            .join(',');
    }

    validateTimetable(exportData: any): string[] {
        const errors: string[] = [];
        let timeTable = this.timeTableService.timeTable;
        let settings = timeTable.settings;

        if (!timeTable.department) {
            errors.push('Please select a department.');
        }

        const workingDays = settings.workingDays.filter((d) => d.selected);
        if (!workingDays.length) {
            errors.push('Select at least one working day under General Settings.');
        }

        if (settings.periodsPerDay <= 0) {
            errors.push('Invalid number of periods per day.');
        }

        let totalBreakInMinutes = 0;
        settings.breaks.forEach((brk) => {
            if (brk.enabled) {
                totalBreakInMinutes += brk.duration;
                if (brk.afterPeriod < 1 || brk.afterPeriod >= settings.periodsPerDay) {
                    errors.push('Break period is out of bounds.');
                }
            }
        });

        const totalPeriodDuration = settings.periodsPerDay * settings.periodDuration + totalBreakInMinutes;
        const perDayDurationInMinutes = this.toMinutes(settings.endTime) - this.toMinutes(settings.startTime);

        if (totalPeriodDuration > perDayDurationInMinutes) {
            errors.push('Periods exceed the available daily time. Adjust periods or duration.');
        }

        this.timeTableService.classes.forEach((cls) => {
            let totalPeriods = cls.subjects.reduce((sum, subj) => sum + subj.hours_per_week, 0);
            const totalAvailablePeriods = workingDays.length * settings.periodsPerDay;
            if (totalPeriods > totalAvailablePeriods) {
                errors.push(` ${totalAvailablePeriods} periods are available per week, while Class ${cls.name} requests ${totalPeriods} periods.`);
            }
        });

        let teacherMap = new Map<string, any>();
        this.timeTableService.classes.forEach((cls) => {
            cls.subjects.forEach((subj) => {
                const teacherId = subj.teacher_id;
                if (teacherId) {
                    if (!teacherMap.has(teacherId)) {
                        teacherMap.set(teacherId, { totalAssigned: 0, subAndClass: subj.name + ' - ' + cls.name });
                    }
                    const teacherData = teacherMap.get(teacherId);
                    teacherData.totalAssigned += subj.hours_per_week;
                    teacherMap.set(teacherId, teacherData);
                }
            });
        });
        teacherMap.forEach((data, teacherId) => {
            const teacher = this.timeTableService.teachers.find((t) => t.id === teacherId);
            if (teacher) {
                const totalAvailablePeriods = workingDays.length * settings.periodsPerDay;
                if (data.totalAssigned > totalAvailablePeriods) {
                    errors.push(`Teacher ${teacher.name} is assigned ${data.totalAssigned} periods per week, exceeding the available ${totalAvailablePeriods} periods. Check assignments for ${data.subAndClass}.`);
                }
            }
        });
        return errors;
    }
}
