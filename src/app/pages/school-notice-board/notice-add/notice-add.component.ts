import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { EditorModule } from 'primeng/editor';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CommonService } from '../../../core/services/common.service';
import { ExamTypeLabels } from '../../models/examination.model';
import { CategoryType, Notice, Priority, Status, TargetType } from '../../models/notification.model';

@Component({
    selector: 'app-notice-add',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, SelectModule, ButtonModule, InputTextModule, DialogModule, EditorModule, DatePickerModule, PanelModule, InputNumberModule, SelectButtonModule, CheckboxModule],
    templateUrl: './notice-add.component.html',
    styles: ``
})
export class NoticeAddComponent implements OnInit, OnChanges {
    @Input() visible = false;
    @Input() editMode = false;
    @Input() noticeData: Notice | null = null;

    categoryOptions: any[] = [
        { label: 'General', value: 'GENERAL', icon: 'pi pi-bell', colorClass: 'bg-yellow-500' },
        { label: 'Time Table', value: 'TIMETABLE', icon: 'pi pi-calendar', colorClass: 'bg-blue-500' },
        { label: 'Meeting', value: 'MEETING', icon: 'pi pi-users', colorClass: 'bg-emerald-500' },
        { label: 'Attendance', value: 'ATTENDANCE', icon: 'pi pi-check-circle', colorClass: 'bg-orange-500' },
        { label: 'Exam Announcement', value: 'EXAM_ANNOUNCEMENT', icon: 'pi pi-file-edit', colorClass: 'bg-red-500' },
        { label: 'Exam Result', value: 'EXAM_RESULT', icon: 'pi pi-trophy', colorClass: 'bg-green-500' },
        { label: 'Festival', value: 'FEST', icon: 'pi pi-heart', colorClass: 'bg-purple-500' },
        { label: 'Holiday', value: 'HOLIDAY', icon: 'pi pi-sun', colorClass: 'bg-amber-500' },
        { label: 'Appreciation', value: 'APPRECIATION', icon: 'pi pi-star', colorClass: 'bg-pink-500' },
        { label: 'School Achievement', value: 'SCHOOL_ACHIEVEMENT', icon: 'pi pi-trophy', colorClass: 'bg-teal-500' }
    ];

    @Input() priorityOptions: any[] = [];
    @Output() save = new EventEmitter<Notice>();
    @Output() cancel = new EventEmitter<void>();

    targetTypeOptions = Object.values(TargetType).map((v) => ({ label: v, value: v }));
    examTypes = Object.entries(ExamTypeLabels).map(([value, label]) => ({ label, value }));

    schoolAchievementCategories = [
        { label: 'Academic', value: 'Academic' },
        { label: 'Infrastructure', value: 'Infrastructure' },
        { label: 'Awards', value: 'Awards' },
        { label: 'Recognition', value: 'Recognition' }
    ];

    meetingTypes = [
        { label: 'Parent-Teacher Meeting', value: 'PTM' },
        { label: 'Individual', value: 'Individual' },
        { label: 'Emergency', value: 'Emergency' },
        { label: 'Progress Review', value: 'Progress' },
        { label: 'Staff Meeting', value: 'Staff' }
    ];

    holidayTypes = [
        { label: 'Emergency', value: 'Emergency' },
        { label: 'Government', value: 'Government' },
        { label: 'Weather', value: 'Weather' },
        { label: 'Week Off', value: 'Week_off' },
        { label: 'Festival', value: 'Festival' }
    ];

    festTypes = [
        { label: 'Cultural', value: 'Cultural' },
        { label: 'Sports', value: 'Sports' },
        { label: 'Science', value: 'Science' },
        { label: 'Literary', value: 'Literary' }
    ];

    attendanceTypes = [
        { label: 'Low Attendance', value: 'Low' },
        { label: 'Absent', value: 'Absent' },
        { label: 'Improvement Needed', value: 'Improvement' }
    ];

    appreciationCategories = [
        { label: 'Academic', value: 'Academic' },
        { label: 'Sports', value: 'Sports' },
        { label: 'Cultural', value: 'Cultural' },
        { label: 'Social', value: 'Social' }
    ];

    recognitionLevels = [
        { label: 'School Level', value: 'School' },
        { label: 'District Level', value: 'District' },
        { label: 'State Level', value: 'State' },
        { label: 'National Level', value: 'National' }
    ];

    weekDays = [
        { label: 'Monday', value: 'MONDAY' },
        { label: 'Tuesday', value: 'TUESDAY' },
        { label: 'Wednesday', value: 'WEDNESDAY' },
        { label: 'Thursday', value: 'THURSDAY' },
        { label: 'Friday', value: 'FRIDAY' },
        { label: 'Saturday', value: 'SATURDAY' },
        { label: 'Sunday', value: 'SUNDAY' }
    ];

    noticeForm!: FormGroup;

    commonService = inject(CommonService);

    constructor(private fb: FormBuilder) {}

    ngOnInit(): void {
        this.initializeForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['noticeData'] && this.noticeData && this.editMode) {
            this.populateForm(this.noticeData);
        } else if (changes['visible'] && !this.visible) {
            this.resetForm();
        }
    }

    private initializeForm(): void {
        this.noticeForm = this.fb.group({
            categoryType: [CategoryType.GENERAL, Validators.required],
            title: ['', [Validators.required, Validators.minLength(5)]],
            content: [''],
            priority: [Priority.MEDIUM, Validators.required],

            targetAudience: this.fb.group({
                type: [TargetType.ALL, Validators.required],
                targetIds: [''],
                includeAll: [true]
            }),

            attachments: [[]],

            timetable: this.fb.group({
                effectiveDate: [null]
            }),

            attendance: this.fb.group({
                attendancePercentage: [null],
                attendanceType: [null],
                parentMeetingRequired: [false]
            }),

            examAnnouncement: this.fb.group({
                examTitle: [null],
                examType: [null],
                examStartDate: [null],
                examEndDate: [null]
            }),

            examResult: this.fb.group({
                examTitle: [null],
                examType: [null],
                resultDeclarationDate: [null]
            }),

            holiday: this.fb.group({
                holidayType: [null],
                holidayStartDate: [null],
                holidayEndDate: [null],
                weekOffDay: [null]
            }),

            meeting: this.fb.group({
                meetingType: [null],
                meetingDate: [null],
                meetingTime: [null],
                venue: [null]
            }),

            fest: this.fb.group({
                festName: [null],
                festType: [null],
                eventStartDate: [null],
                eventEndDate: [null],
                venue: [null]
            }),

            appreciation: this.fb.group({
                recipientIds: [null],
                achievementCategory: [null],
                recognitionLevel: [null]
            }),

            schoolAchievement: this.fb.group({
                achievementCategory: [null],
                achievementDate: [null],
                recipientIds: [null]
            })
        });
    }

    private populateForm(notice: Notice): void {
        this.noticeForm.patchValue({
            categoryType: notice.categoryType,
            title: notice.title,
            content: notice.content,
            priority: notice.priority,
            targetAudience: {
                type: notice.targetAudience.type,
                targetIds: notice.targetAudience.targetIds?.join(', ') || '',
                includeAll: notice.targetAudience.type === TargetType.ALL
            },
            attachments: notice.attachments || [],
            timetable: notice.timetable || { effectiveDate: null },
            attendance: notice.attendance || { attendancePercentage: null, attendanceType: null, parentMeetingRequired: false },
            examAnnouncement: notice.examAnnouncement || { examTitle: null, examType: null, examStartDate: null, examEndDate: null },
            examResult: notice.examResult || { examTitle: null, examType: null, resultDeclarationDate: null },
            holiday: notice.holiday || { holidayType: null, holidayStartDate: null, holidayEndDate: null, weekOffDay: null },
            meeting: notice.meeting || { meetingType: null, meetingDate: null, meetingTime: null, venue: null },
            fest: notice.fest || { festName: null, festType: null, eventStartDate: null, eventEndDate: null, venue: null },
            appreciation: notice.appreciation
                ? {
                      recipientIds: notice.appreciation.recipientIds?.join(', ') || null,
                      achievementCategory: notice.appreciation.achievementCategory,
                      recognitionLevel: notice.appreciation.recognitionLevel
                  }
                : { recipientIds: null, achievementCategory: null, recognitionLevel: null },
            schoolAchievement: notice.schoolAchievement
                ? {
                      recipientIds: notice.schoolAchievement.recipientIds?.join(', ') || null,
                      achievementCategory: notice.schoolAchievement.achievementCategory,
                      achievementDate: notice.schoolAchievement.achievementDate
                  }
                : { recipientIds: null, achievementCategory: null, achievementDate: null }
        });
    }

    get categoryType(): CategoryType | null {
        return this.noticeForm.get('categoryType')?.value ?? null;
    }

    private formatDate(date: any): string | null {
        if (!date) return null;
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return null;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return null;
        }
    }

    private hasValidData(obj: any): boolean {
        if (!obj) return false;
        return Object.values(obj).some((v) => {
            if (v === null || v === undefined || v === '' || v === false) return false;
            if (Array.isArray(v) && v.length === 0) return false;
            return true;
        });
    }

    submit(): void {
        if (!this.noticeForm.valid) {
            this.noticeForm.markAllAsTouched();
            return;
        }

        const raw = this.noticeForm.getRawValue();
        const targetIds = this.parseCsv(raw.targetAudience?.targetIds);

        const notice: Notice = {
            id: this.editMode && this.noticeData ? this.noticeData.id : null,
            academicYear: this.commonService.currentUser.academicYear,
            categoryType: raw.categoryType as CategoryType,
            title: raw.title ?? '',
            content: raw.content ?? '',
            priority: raw.priority as Priority,
            status: Status.PUBLISHED,
            publishedAt: this.editMode && this.noticeData ? this.noticeData.publishedAt : new Date().toISOString(),
            targetAudience: {
                type: raw.targetAudience?.type as TargetType,
                targetIds: targetIds.length ? targetIds : ['all']
            },
            attachments: raw.attachments ?? []
        };

        // Only add timetable if it has the effectiveDate
        if (raw.categoryType === CategoryType.TIMETABLE && raw.timetable?.effectiveDate) {
            notice.timetable = {
                effectiveDate: this.formatDate(raw.timetable.effectiveDate)
            };
        }

        // Add attendance if category is ATTENDANCE and has valid data
        if (raw.categoryType === CategoryType.ATTENDANCE && this.hasValidData(raw.attendance)) {
            notice.attendance = {
                attendancePercentage: raw.attendance.attendancePercentage ?? undefined,
                attendanceType: raw.attendance.attendanceType as 'Low' | 'Absent' | 'Improvement',
                parentMeetingRequired: raw.attendance.parentMeetingRequired ?? false
            };
        }

        // Add examAnnouncement if category is EXAM_ANNOUNCEMENT and has valid data
        if (raw.categoryType === CategoryType.EXAM_ANNOUNCEMENT && this.hasValidData(raw.examAnnouncement)) {
            notice.examAnnouncement = {
                examTitle: raw.examAnnouncement.examTitle ?? undefined,
                examType: raw.examAnnouncement.examType ?? undefined,
                examStartDate: this.formatDate(raw.examAnnouncement.examStartDate) ?? undefined,
                examEndDate: this.formatDate(raw.examAnnouncement.examEndDate) ?? undefined
            };
        }

        // Add examResult if category is EXAM_RESULT and has valid data
        if (raw.categoryType === CategoryType.EXAM_RESULT && this.hasValidData(raw.examResult)) {
            notice.examResult = {
                examTitle: raw.examResult.examTitle ?? undefined,
                examType: raw.examResult.examType ?? undefined,
                resultDeclarationDate: this.formatDate(raw.examResult.resultDeclarationDate) ?? undefined
            };
        }

        // Add holiday if category is HOLIDAY and has valid data
        if (raw.categoryType === CategoryType.HOLIDAY && this.hasValidData(raw.holiday)) {
            notice.holiday = {
                holidayType: raw.holiday.holidayType as 'Emergency' | 'Government' | 'Weather',
                holidayStartDate: this.formatDate(raw.holiday.holidayStartDate) ?? undefined,
                holidayEndDate: this.formatDate(raw.holiday.holidayEndDate) ?? undefined,
                weekOffDay: raw.holiday.weekOffDay ?? undefined
            };
        }

        // Add meeting if category is MEETING and has valid data
        if (raw.categoryType === CategoryType.MEETING && this.hasValidData(raw.meeting)) {
            notice.meeting = {
                meetingType: raw.meeting.meetingType as 'PTM' | 'Individual' | 'Emergency' | 'Progress' | 'Staff',
                meetingDate: this.formatDate(raw.meeting.meetingDate) ?? undefined,
                meetingTime: raw.meeting.meetingTime ?? undefined,
                venue: raw.meeting.venue ?? undefined
            };
        }

        // Add fest if category is FEST and has valid data
        if (raw.categoryType === CategoryType.FEST && this.hasValidData(raw.fest)) {
            notice.fest = {
                festName: raw.fest.festName ?? undefined,
                festType: raw.fest.festType as 'Cultural' | 'Sports' | 'Science' | 'Literary',
                eventStartDate: this.formatDate(raw.fest.eventStartDate) ?? undefined,
                eventEndDate: this.formatDate(raw.fest.eventEndDate) ?? undefined,
                venue: raw.fest.venue ?? undefined
            };
        }

        // Add appreciation if category is APPRECIATION and has valid data
        if (raw.categoryType === CategoryType.APPRECIATION && this.hasValidData(raw.appreciation)) {
            const appreciationRecipientIds = this.parseCsv(raw.appreciation.recipientIds);
            if (appreciationRecipientIds.length > 0) {
                notice.appreciation = {
                    recipientIds: appreciationRecipientIds,
                    achievementCategory: raw.appreciation.achievementCategory as 'Academic' | 'Sports' | 'Cultural' | 'Social',
                    recognitionLevel: raw.appreciation.recognitionLevel as 'School' | 'District' | 'State' | 'National'
                };
            }
        }

        // Add schoolAchievement if category is SCHOOL_ACHIEVEMENT and has valid data
        if (raw.categoryType === CategoryType.SCHOOL_ACHIEVEMENT && this.hasValidData(raw.schoolAchievement)) {
            const schoolAchievementRecipientIds = this.parseCsv(raw.schoolAchievement.recipientIds);
            notice.schoolAchievement = {
                recipientIds: schoolAchievementRecipientIds.length > 0 ? schoolAchievementRecipientIds : undefined,
                achievementCategory: raw.schoolAchievement.achievementCategory as 'Academic' | 'Infrastructure' | 'Awards' | 'Recognition',
                achievementDate: this.formatDate(raw.schoolAchievement.achievementDate) ?? undefined
            };
        }

        console.log('Final Notice Object:', JSON.stringify(notice, null, 2));
        this.save.emit(notice);
        this.resetForm();
    }

    close(): void {
        this.cancel.emit();
        this.resetForm();
    }

    private resetForm(): void {
        if (this.noticeForm) {
            this.noticeForm.reset({
                categoryType: CategoryType.GENERAL,
                priority: Priority.MEDIUM,
                targetAudience: {
                    type: TargetType.ALL,
                    includeAll: true,
                    targetIds: ''
                },
                attachments: [],
                timetable: { effectiveDate: null },
                attendance: { attendancePercentage: null, attendanceType: null, parentMeetingRequired: false },
                examAnnouncement: { examTitle: null, examType: null, examStartDate: null, examEndDate: null },
                examResult: { examTitle: null, examType: null, resultDeclarationDate: null },
                holiday: { holidayType: null, holidayStartDate: null, holidayEndDate: null, weekOffDay: null },
                meeting: { meetingType: null, meetingDate: null, meetingTime: null, venue: null },
                fest: { festName: null, festType: null, eventStartDate: null, eventEndDate: null, venue: null },
                appreciation: { recipientIds: null, achievementCategory: null, recognitionLevel: null },
                schoolAchievement: { recipientIds: null, achievementCategory: null, achievementDate: null }
            });
        }
    }

    private parseCsv(input: string | null | undefined): string[] {
        if (!input) return [];
        return input
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }

    onHolidayTypeChange(): void {
        const holidayType = this.noticeForm.get('holiday.holidayType')?.value;
        const holidayGroup = this.noticeForm.get('holiday') as FormGroup;

        if (holidayType === 'Week_off') {
            holidayGroup.get('holidayStartDate')?.setValue(null);
            holidayGroup.get('holidayEndDate')?.setValue(null);
        } else {
            holidayGroup.get('weekOffDay')?.setValue(null);
        }
    }
}
