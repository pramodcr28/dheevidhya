import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { ExamType, ExamTypeLabels } from '../../models/examination.model';
import { Attachment, CategoryType, Notice, Priority, Status, TargetType } from '../../models/notification.model';

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

    noticeForm!: FormGroup<{
        categoryType: FormControl<CategoryType | null>;
        title: FormControl<string | null>;
        content: FormControl<string | null>;
        priority: FormControl<Priority | null>;
        targetAudience: FormGroup<{
            type: FormControl<TargetType | null>;
            targetIds: FormControl<string | null>;
            includeAll: FormControl<boolean | null>;
        }>;
        attachments: FormControl<Attachment[] | null>;
        timetable: FormGroup<{ effectiveDate: FormControl<string | null> }>;
        attendance: FormGroup<{
            attendancePercentage: FormControl<number | null>;
            attendanceType: FormControl<string | null>;
            parentMeetingRequired: FormControl<boolean | null>;
        }>;
        examAnnouncement: FormGroup<{
            examTitle: FormControl<string | null>;
            examType: FormControl<ExamType | null>;
            examStartDate: FormControl<string | null>;
            examEndDate: FormControl<string | null>;
        }>;
        examResult: FormGroup<{
            examTitle: FormControl<string | null>;
            examType: FormControl<ExamType | null>;
            resultDeclarationDate: FormControl<string | null>;
        }>;
        holiday: FormGroup<{
            holidayType: FormControl<string | null>;
            holidayStartDate: FormControl<string | null>;
            holidayEndDate: FormControl<string | null>;
            weekOffDay: FormControl<string | null>;
        }>;
        meeting: FormGroup<{
            meetingType: FormControl<string | null>;
            meetingDate: FormControl<string | null>;
            meetingTime: FormControl<string | null>;
            venue: FormControl<string | null>;
        }>;
        fest: FormGroup<{
            festName: FormControl<string | null>;
            festType: FormControl<string | null>;
            eventStartDate: FormControl<string | null>;
            eventEndDate: FormControl<string | null>;
            venue: FormControl<string | null>;
        }>;
        appreciation: FormGroup<{
            recipientIds: FormControl<string | null>;
            achievementCategory: FormControl<string | null>;
            recognitionLevel: FormControl<string | null>;
        }>;
        schoolAchievement: FormGroup<{
            achievementCategory: FormControl<string | null>;
            achievementDate: FormControl<string | null>;
            recipientIds: FormControl<string | null>;
        }>;
    }>;

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
            categoryType: this.fb.control<CategoryType | null>(CategoryType.GENERAL, Validators.required),
            title: this.fb.control<string | null>(null, [Validators.required, Validators.minLength(5)]),
            content: this.fb.control<string | null>(null, []),
            priority: this.fb.control<Priority | null>(Priority.MEDIUM, Validators.required),

            targetAudience: this.fb.group({
                type: this.fb.control<TargetType | null>(TargetType.ALL, Validators.required),
                targetIds: this.fb.control<string | null>(null),
                includeAll: this.fb.control<boolean | null>(true)
            }),

            attachments: this.fb.control<Attachment[] | null>([]),

            timetable: this.fb.group({
                effectiveDate: this.fb.control<string | null>(null)
            }),
            attendance: this.fb.group({
                attendancePercentage: this.fb.control<number | null>(null),
                attendanceType: this.fb.control<string | null>(null),
                parentMeetingRequired: this.fb.control<boolean | null>(false)
            }),
            examAnnouncement: this.fb.group({
                examTitle: this.fb.control<string | null>(null),
                examType: this.fb.control<ExamType | null>(null),
                examStartDate: this.fb.control<string | null>(null),
                examEndDate: this.fb.control<string | null>(null)
            }),
            examResult: this.fb.group({
                examTitle: this.fb.control<string | null>(null),
                examType: this.fb.control<ExamType | null>(null),
                resultDeclarationDate: this.fb.control<string | null>(null)
            }),
            holiday: this.fb.group({
                holidayType: this.fb.control<string | null>(null),
                holidayStartDate: this.fb.control<string | null>(null),
                holidayEndDate: this.fb.control<string | null>(null),
                weekOffDay: this.fb.control<string | null>(null)
            }),
            meeting: this.fb.group({
                meetingType: this.fb.control<string | null>(null),
                meetingDate: this.fb.control<string | null>(null),
                meetingTime: this.fb.control<string | null>(null),
                venue: this.fb.control<string | null>(null)
            }),
            fest: this.fb.group({
                festName: this.fb.control<string | null>(null),
                festType: this.fb.control<string | null>(null),
                eventStartDate: this.fb.control<string | null>(null),
                eventEndDate: this.fb.control<string | null>(null),
                venue: this.fb.control<string | null>(null)
            }),
            appreciation: this.fb.group({
                recipientIds: this.fb.control<string | null>(null),
                achievementCategory: this.fb.control<string | null>(null),
                recognitionLevel: this.fb.control<string | null>(null)
            }),
            schoolAchievement: this.fb.group({
                achievementCategory: this.fb.control<string | null>(null),
                achievementDate: this.fb.control<string | null>(null),
                recipientIds: this.fb.control<string | null>(null)
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
                targetIds: notice.targetAudience.targetIds?.join(', '),
                includeAll: notice.targetAudience.type === TargetType.ALL
            },
            attachments: notice.attachments || ([] as any),
            timetable: notice.timetable || {},
            attendance: notice.attendance || {},
            examAnnouncement: notice.examAnnouncement || {},
            examResult: notice.examResult || ({} as any),
            holiday: notice.holiday || {},
            meeting: notice.meeting || {},
            fest: notice.fest || {},
            appreciation: notice.appreciation
                ? {
                      ...notice.appreciation,
                      recipientIds: notice.appreciation.recipientIds?.join(', ')
                  }
                : {},
            schoolAchievement: notice.schoolAchievement
                ? {
                      ...notice.schoolAchievement,
                      recipientIds: notice.schoolAchievement.recipientIds?.join(', ')
                  }
                : {}
        });
    }

    get categoryType(): CategoryType | null {
        return this.noticeForm.controls.categoryType.value ?? null;
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

    submit(): void {
        if (!this.noticeForm.valid) {
            this.noticeForm.markAllAsTouched();
            return;
        }

        const raw = this.noticeForm.getRawValue();
        const targetIds = this.parseCsv(raw.targetAudience.targetIds);
        const appreciationRecipientIds = this.parseCsv(raw.appreciation.recipientIds);
        const schoolAchievementRecipientIds = this.parseCsv(raw.schoolAchievement.recipientIds);

        const notice: Notice = {
            id: this.editMode && this.noticeData ? this.noticeData.id : null,
            academicYear: this.commonService.getUserInfo.academicYear,
            categoryType: raw.categoryType as CategoryType,
            title: raw.title ?? '',
            content: raw.content ?? '',
            priority: raw.priority as Priority,
            status: Status.PUBLISHED,
            publishedAt: this.editMode && this.noticeData ? this.noticeData.publishedAt : new Date().toISOString(),
            targetAudience: {
                type: raw.targetAudience.type as TargetType,
                targetIds: targetIds.length ? targetIds : ['all']
            },
            attachments: raw.attachments ?? [],
            timetable: raw.timetable
        };

        // Add conditional fields
        if (raw.attendance && Object.values(raw.attendance).some((v) => v !== null && v !== false)) {
            notice.attendance = {
                attendancePercentage: raw.attendance.attendancePercentage,
                attendanceType: raw.attendance.attendanceType as 'Low' | 'Absent' | 'Improvement',
                parentMeetingRequired: raw.attendance.parentMeetingRequired
            };
        }

        if (raw.examAnnouncement && Object.values(raw.examAnnouncement).some((v) => v !== null)) {
            notice.examAnnouncement = {
                examTitle: raw.examAnnouncement.examTitle,
                examType: raw.examAnnouncement.examType,
                examStartDate: this.formatDate(raw.examAnnouncement.examStartDate),
                examEndDate: this.formatDate(raw.examAnnouncement.examEndDate)
            };
        }

        if (raw.examResult && Object.values(raw.examResult).some((v) => v !== null)) {
            notice.examResult = {
                examTitle: raw.examResult.examTitle,
                examType: raw.examResult.examType,
                resultDeclarationDate: raw.examResult.resultDeclarationDate
            };
        }

        if (raw.holiday && Object.values(raw.holiday).some((v) => v !== null)) {
            notice.holiday = {
                holidayType: raw.holiday.holidayType as 'Emergency' | 'Government' | 'Weather',
                holidayStartDate: this.formatDate(raw.holiday.holidayStartDate),
                holidayEndDate: this.formatDate(raw.holiday.holidayEndDate),
                weekOffDay: raw.holiday.weekOffDay ?? undefined
            };
        }

        if (raw.meeting && Object.values(raw.meeting).some((v) => v !== null)) {
            notice.meeting = {
                meetingType: raw.meeting.meetingType as 'PTM' | 'Individual' | 'Emergency' | 'Progress' | 'Staff',
                meetingDate: this.formatDate(raw.meeting.meetingDate),
                meetingTime: raw.meeting.meetingTime,
                venue: raw.meeting.venue
            };
        }

        if (raw.fest && Object.values(raw.fest).some((v) => v !== null)) {
            notice.fest = {
                festName: raw.fest.festName,
                festType: raw.fest.festType as 'Cultural' | 'Sports' | 'Science' | 'Literary',
                eventStartDate: this.formatDate(raw.fest.eventStartDate),
                eventEndDate: this.formatDate(raw.fest.eventEndDate),
                venue: raw.fest.venue
            };
        }

        if (raw.appreciation && appreciationRecipientIds.length) {
            notice.appreciation = {
                recipientIds: appreciationRecipientIds,
                achievementCategory: raw.appreciation.achievementCategory as 'Academic' | 'Sports' | 'Cultural' | 'Social',
                recognitionLevel: raw.appreciation.recognitionLevel as 'School' | 'District' | 'State' | 'National'
            };
        }

        if (raw.schoolAchievement && schoolAchievementRecipientIds.length) {
            notice.schoolAchievement = {
                recipientIds: schoolAchievementRecipientIds,
                achievementCategory: raw.schoolAchievement.achievementCategory as 'Academic' | 'Infrastructure' | 'Awards' | 'Recognition',
                achievementDate: this.formatDate(raw.schoolAchievement.achievementDate)
            };
        }

        this.save.emit(notice);
        this.resetForm();
    }

    close(): void {
        this.cancel.emit();
        this.resetForm();
    }

    private resetForm(): void {
        this.noticeForm.reset();
        this.noticeForm.controls.categoryType.setValue(CategoryType.GENERAL);
        this.noticeForm.controls.priority.setValue(Priority.MEDIUM);
        this.noticeForm.controls.targetAudience.controls.type.setValue(TargetType.ALL);
        this.noticeForm.controls.targetAudience.controls.includeAll.setValue(true);
        this.noticeForm.controls.attachments.setValue([]);
    }

    private parseCsv(input: string | null | undefined): string[] {
        if (!input) return [];
        return input
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }

    onHolidayTypeChange(): void {
        const holidayType = this.noticeForm.controls.holiday.controls.holidayType.value;
        const holidayGroup = this.noticeForm.controls.holiday;

        if (holidayType === 'Week_off') {
            holidayGroup.controls.holidayStartDate.setValue(null);
            holidayGroup.controls.holidayEndDate.setValue(null);
        } else {
            holidayGroup.controls.weekOffDay.setValue(null);
        }
    }
}
