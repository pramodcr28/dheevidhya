import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../../core/services/common.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { AttendanceException, AttendanceRequest, AttendanceStatus } from '../../models/attendence.model';
import { IProfileConfig } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { StudentAttendenceServiceService } from '../../service/student-attendence-service.service';
import { TimeTableService } from '../../service/time-table.service';

interface TimetableSlot {
    dayIndex: string;
    className: string;
    sectionName: string;
    classId: string;
    sectionId: string;
    deptName: string;
    deptId: string;
    startTime: string;
    endTime: string;
    instructorName: string;
    instructorId: string;
    subjectName: string;
}

interface SlotWithDate extends TimetableSlot {
    displayDate: Date;
    isPast: boolean;
    isToday: boolean;
    hasAttendance?: boolean;
}

interface DaySchedule {
    dayName: string;
    dayIndex: number;
    date: Date;
    slots: SlotWithDate[];
}

@Component({
    selector: 'app-take-attendence',
    imports: [CommonModule, FormsModule, ButtonModule, SelectModule, TooltipModule, InputTextModule, CardModule, BadgeModule, TagModule, TableModule, ToastModule, DialogModule],
    templateUrl: './take-attendence.component.html',
    providers: [MessageService]
})
export class TakeAttendenceComponent implements OnInit {
    attendenceService = inject(StudentAttendenceServiceService);
    commonService = inject(CommonService);
    profileService = inject(ProfileConfigService);
    messageService = inject(MessageService);
    loader = inject(ApiLoaderService);
    private store = inject(Store<{ userProfile: UserProfileState }>);
    showSlotPicker = false;
    instructorTimetable: TimetableSlot[] = [];
    weekSchedule: DaySchedule[] = [];
    selectedSlot: SlotWithDate | null = null;
    selectedWeekStart: Date = new Date();
    timeTableService = inject(TimeTableService);
    currentAttendence: AttendanceException[] = [];
    today: Date = new Date();
    takeAttandence = false;
    todayAttendence: AttendanceRequest;
    dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    ngOnInit() {
        this.loadInstructorTimetable();
        this.setCurrentWeek();
    }

    loadInstructorTimetable() {
        let request = {
            academicYear: this.commonService.currentUser.academicYear,
            instructorIds: [this.commonService.currentUser.userId],
            departmentId: null,
            scheduleDay: null
        };
        this.timeTableService.getInstructorSlots(request).subscribe((slots) => {
            this.instructorTimetable = slots;
            this.generateWeekSchedule();
        });
    }

    setCurrentWeek() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        monday.setHours(0, 0, 0, 0);
        this.selectedWeekStart = monday;
        this.generateWeekSchedule();
    }

    isCurrentWeek(): boolean {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        monday.setHours(0, 0, 0, 0);
        return this.selectedWeekStart.getTime() === monday.getTime();
    }

    changeWeek(direction: number) {
        const newWeekStart = new Date(this.selectedWeekStart);
        newWeekStart.setDate(newWeekStart.getDate() + direction * 7);
        this.selectedWeekStart = newWeekStart;
        this.generateWeekSchedule();
    }

    generateWeekSchedule() {
        this.weekSchedule = [];
        const slotsByDay: { [key: number]: SlotWithDate[] } = {};

        this.instructorTimetable.forEach((slot) => {
            const dayIndex = parseInt(slot.dayIndex);
            const slotDate = new Date(this.selectedWeekStart);
            slotDate.setDate(this.selectedWeekStart.getDate() + dayIndex - 1);

            const slotWithDate: SlotWithDate = {
                ...slot,
                displayDate: slotDate,
                isPast: this.isDateTimePast(slotDate, slot.endTime),
                isToday: this.isDateToday(slotDate)
            };

            if (!slotsByDay[dayIndex]) {
                slotsByDay[dayIndex] = [];
            }
            slotsByDay[dayIndex].push(slotWithDate);
        });

        for (let i = 1; i <= 5; i++) {
            const date = new Date(this.selectedWeekStart);
            date.setDate(this.selectedWeekStart.getDate() + i - 1);

            this.weekSchedule.push({
                dayName: this.dayNames[i],
                dayIndex: i,
                date: date,
                slots: (slotsByDay[i] || []).sort((a, b) => a.startTime.localeCompare(b.startTime))
            });
        }
    }

    openSlotPicker() {
        this.showSlotPicker = true;
    }

    selectSlot(slot: SlotWithDate) {
        this.selectedSlot = slot;
        this.showSlotPicker = false;
        this.takeAttandence = false;
        this.checkAndLoadAttendance();
    }

    isDateTimePast(date: Date, endTime: string): boolean {
        const slotDateTime = new Date(date);
        const [hours, minutes] = endTime.split(':');
        slotDateTime.setHours(parseInt(hours), parseInt(minutes));
        return slotDateTime < this.today;
    }

    isDateToday(date: Date): boolean {
        return formatDate(date, this.commonService.dateFormate, 'en-US') === formatDate(this.today, this.commonService.dateFormate, 'en-US');
    }

    canSelectSlot(slot: SlotWithDate): boolean {
        return slot.isToday || slot.isPast;
    }

    canTakeAttendance(): boolean {
        if (!this.selectedSlot) return false;
        return this.takeAttandence;
    }

    checkAndLoadAttendance() {
        if (!this.selectedSlot) return;

        this.currentAttendence = [];
        this.loader.show('Fetching Student Attendance');

        this.profileService
            .search(0, 100, 'id', 'ASC', {
                'profileType.equals': 'STUDENT',
                'roles.student.section_id.equals': this.selectedSlot.sectionId,
                'roles.student.class_id.equals': this.selectedSlot.classId,
                'departments.in': [this.selectedSlot.deptId]
            })
            .subscribe({
                next: (res: any) => {
                    this.attendenceService
                        .search(0, 100, 'id', 'ASC', {
                            'departmentId.equals': this.selectedSlot.deptId,
                            'classId.equals': this.selectedSlot.classId,
                            'sectionId.equals': this.selectedSlot.sectionId,
                            'subjectName.equals': this.selectedSlot.subjectName,
                            'sessionDate.equals': formatDate(this.selectedSlot.displayDate, this.commonService.dateFormate, 'en-US'),
                            'startTime.equals': this.selectedSlot.startTime
                        })
                        .subscribe((result: any) => {
                            this.takeAttandence = res?.content?.length > 0;
                            let exceptions: any[] = result?.content[0]?.exceptions ?? [];
                            this.todayAttendence = result?.content[0];

                            res.content?.forEach((student: IProfileConfig) => {
                                let status: AttendanceStatus = 'PRESENT';
                                let exception = exceptions.find((e) => e.studentId === student.userId);

                                if (exception) {
                                    status = exception.status;
                                }

                                this.currentAttendence.push({
                                    studentName: student.fullName,
                                    studentId: student.userId,
                                    status: status
                                });
                            });
                            if (res.content && res.content.length == 0) {
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Error',
                                    detail: 'No Students Found Please Contact Administrator'
                                });
                            }
                            this.loader.hide();
                        });
                }
            });
    }

    updateAttendance(student: AttendanceException, status: 'PRESENT' | 'ABSENT' | 'LATE') {
        student.status = status;
    }

    markAllPresent() {
        this.currentAttendence.forEach((student) => {
            student.status = 'PRESENT';
        });
    }

    saveAttendance() {
        if (!this.selectedSlot) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please select a timetable slot'
            });
            return;
        }

        let attendanceRecord: AttendanceRequest = {
            ...this.todayAttendence,
            academicYear: this.commonService.currentUser.academicYear,
            semester: 'Fall',
            departmentId: this.selectedSlot.deptId,
            classId: this.selectedSlot.classId,
            sectionId: this.selectedSlot.sectionId,
            subjectCode: this.selectedSlot.subjectName,
            subjectName: this.selectedSlot.subjectName,
            instructorName: this.selectedSlot.instructorName,
            instructorId: this.selectedSlot.instructorId,
            sessionDate: formatDate(this.selectedSlot.displayDate, this.commonService.dateFormate, 'en-US'),
            scheduleDay: this.dayNames[parseInt(this.selectedSlot.dayIndex)].toLowerCase(),
            startTime: this.selectedSlot.startTime,
            endTime: this.selectedSlot.endTime,
            period: 0,
            exceptions: this.currentAttendence.filter((attendence) => attendence.status != 'PRESENT')
        };

        this.attendenceService.create(attendanceRecord).subscribe({
            next: (res) => {
                this.messageService.add({
                    text: 'Attendance saved successfully!',
                    summary: 'Success',
                    severity: 'success',
                    closeIcon: 'close'
                });
                this.takeAttandence = true;
                this.checkAndLoadAttendance();
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save attendance'
                });
            }
        });
    }

    getTagSeverity(status: any): 'success' | 'danger' | 'warn' {
        switch (status) {
            case 'PRESENT':
                return 'success';
            case 'ABSENT':
                return 'danger';
            case 'LATE':
                return 'warn';
            default:
                return 'success';
        }
    }

    getWeekRange(): string {
        const weekEnd = new Date(this.selectedWeekStart);
        weekEnd.setDate(this.selectedWeekStart.getDate() + 4);
        return `${formatDate(this.selectedWeekStart, 'MMM dd', 'en-US')} - ${formatDate(weekEnd, 'MMM dd, yyyy', 'en-US')}`;
    }

    getSelectedSlotDisplay(): string {
        if (!this.selectedSlot) return 'Select a slot';

        return `${this.dayNames[parseInt(this.selectedSlot.dayIndex)]} (${formatDate(this.selectedSlot.displayDate, 'MMM dd', 'en-US')}) - ${this.selectedSlot.className.replace(/_/g, ' ')} ${this.selectedSlot.sectionName.replace(/_/g, ' ')} - ${this.selectedSlot.subjectName} (${this.selectedSlot.startTime}-${this.selectedSlot.endTime})`;
    }
}
