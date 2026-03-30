import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { EditorModule } from 'primeng/editor';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TreeSelectModule } from 'primeng/treeselect';
import { ITEMS_PER_PAGE } from '../../../core/model/pagination.constants';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { ExamTypeLabels } from '../../models/examination.model';
import { CategoryType, Notice, Priority, Status, TargetType } from '../../models/notification.model';
import { ITenantUser } from '../../models/user.model';
import { UserService } from '../../service/user.service';

// ── Channel option shape ──────────────────────────────────────────────────────
export interface NotificationChannelOption {
    id: string;
    label: string;
    description: string;
    icon: string;
    activeClass: string;
    alwaysOn?: boolean; // Cannot be deselected (e.g. PUSH)
    disabled?: boolean; // Cannot be selected at all (e.g. if backend doesn't support it yet)
}

@Component({
    selector: 'app-notice-add',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        SelectModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        EditorModule,
        DatePickerModule,
        PanelModule,
        InputNumberModule,
        SelectButtonModule,
        CheckboxModule,
        TreeSelectModule,
        MultiSelectModule,
        ChipModule
    ],
    templateUrl: './notice-add.component.html',
    styles: ``
})
export class NoticeAddComponent implements OnInit {
    @Input() visible = false;
    @Input() editMode = false;
    @Input() get noticeData(): Notice | null {
        return this._noticeData;
    }
    set noticeData(value: Notice | null) {
        this.initializeForm();
        this._noticeData = value;
        if (value?.id) {
            this.populateForm();
        } else {
            this.resetForm();
        }
    }

    private _noticeData: Notice | null = null;

    // ── Notification channel configuration ───────────────────────────────────
    // Add/remove entries here to dynamically show/hide channel options in the UI.
    // The `id` must match the getChannelId() of the corresponding backend channel class.
    notificationChannelOptions: NotificationChannelOption[] = [
        {
            id: 'PUSH',
            label: 'Push Notification',
            description: 'In-app & mobile alerts',
            icon: 'pi pi-bell',
            activeClass: 'bg-blue-500',
            alwaysOn: true,
            disabled: false
        },
        {
            id: 'EMAIL',
            label: 'Email',
            description: 'Delivered to inbox',
            icon: 'pi pi-envelope',
            activeClass: 'bg-emerald-500',
            disabled: true
        },
        {
            id: 'SMS',
            label: 'SMS',
            description: 'Text to phone',
            icon: 'pi pi-mobile',
            activeClass: 'bg-amber-500',
            disabled: true
        },
        {
            id: 'WHATSAPP',
            label: 'WhatsApp',
            description: 'Instant message',
            icon: 'pi pi-comment',
            activeClass: 'bg-green-600',
            disabled: true
        }
    ];

    // Always starts with PUSH selected (it's always-on)
    selectedChannels: Set<string> = new Set(['PUSH']);

    toggleChannel(channelId: string) {
        const channel = this.notificationChannelOptions.find((c) => c.id === channelId);

        if (!channel || channel.disabled) {
            return;
        }

        // toggle logic (if needed later)
    }

    isChannelSelected(channelId: string): boolean {
        const channel = this.notificationChannelOptions.find((c) => c.id === channelId);
        return !!channel?.alwaysOn;
    }

    // ── Existing options ──────────────────────────────────────────────────────
    categoryOptions: any[] = [
        { label: 'General', value: 'GENERAL', icon: 'pi pi-bell', colorClass: 'bg-yellow-500' },
        { label: 'Time Table', value: 'TIMETABLE', icon: 'pi pi-calendar', colorClass: 'bg-blue-500' },
        { label: 'Meeting', value: 'MEETING', icon: 'pi pi-users', colorClass: 'bg-emerald-500' },
        { label: 'Attendance', value: 'ATTENDANCE', icon: 'pi pi-check-circle', colorClass: 'bg-orange-500' },
        { label: 'Exam Announcement', value: 'EXAM_ANNOUNCEMENT', icon: 'pi pi-file-edit', colorClass: 'bg-red-500' },
        { label: 'Exam Result', value: 'EXAM_RESULT', icon: 'pi pi-trophy', colorClass: 'bg-green-500' },
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
    users = signal<ITenantUser[]>([]);
    departmentsList = this.commonService.associatedDepartments;
    departmentConfigService = inject(DepartmentConfigService);
    availableAuthorities: any[] = [];
    userService = inject(UserService);
    loader = inject(ApiLoaderService);
    messageService = inject(MessageService);
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 0;
    sortField = 'id';
    sortOrder: 'ASC' | 'DESC' = 'ASC';
    academicUnitTree: TreeNode[] = [];
    selectedAcademicUnits: any[] = [];
    studentOptions: any[] = [];
    staffOptions: any[] = [];
    roleOptions: any[] = [];

    constructor(private fb: FormBuilder) {}

    ngOnInit(): void {
        this.loadDepartments();

        this.userService.getAuthorities().subscribe((res: any) => {
            this.availableAuthorities = res.body;
            this.roleOptions = this.availableAuthorities.map((auth: any) => ({
                label: auth.name || auth,
                value: auth.name || auth
            }));
        });

        this.loadStudents();
        this.loadStaff();

        this.noticeForm.get('targetAudience.type')?.valueChanges.subscribe((targetType) => {
            this.onTargetTypeChange(targetType);
        });
    }

    loadDepartments(): void {
        if (this.commonService.getUserAuthorities.includes('IT_ADMIN')) {
            const filterParams = { branch: this.commonService.branch?.id };
            this.departmentConfigService.search(0, 100, 'id', 'ASC', filterParams).subscribe({
                next: (res: any) => {
                    if (res?.content) this.buildAcademicUnitTree(res.content);
                },
                error: (error) => console.error('Failed to load departments', error)
            });
        } else {
            this.buildAcademicUnitTree(this.commonService.associatedDepartments);
        }
    }

    buildAcademicUnitTree(departments: any[]): void {
        this.selectedAcademicUnits = [];
        this.academicUnitTree = departments.map((dept) => {
            const academicYear = dept.academicYear || this.commonService.currentUser.academicYear || '';
            const deptId = dept?.id || dept.department?.id;

            const deptNode: TreeNode = {
                key: `${academicYear}:${deptId}`,
                label: dept.department?.name + ' - ' + academicYear || 'Unknown Department',
                data: { id: deptId, type: 'department', code: dept.department?.code, academicYear },
                children: []
            };

            if (dept.department?.classes?.length > 0) {
                deptNode.children = dept.department.classes.map((cls: any) => {
                    const classNode: TreeNode = {
                        key: `${academicYear}:${deptId}:${cls.id}`,
                        label: cls.name || 'Unknown Class',
                        data: { id: cls.id, type: 'class', code: cls.code, departmentId: deptId, academicYear },
                        children:
                            cls.sections?.map((section: any) => ({
                                key: `${academicYear}:${deptId}:${cls.id}:${section.id}`,
                                label: section.name || 'Unknown Section',
                                data: { id: section.id, type: 'section', code: section.code, classId: cls.id, departmentId: deptId, academicYear }
                            })) || []
                    };
                    return classNode;
                });
            }

            return deptNode;
        });

        if (this._noticeData?.id && this._noticeData.targetAudience?.type === TargetType.ACADEMIC_UNIT && this._noticeData.targetAudience?.targetIds) {
            this.selectedAcademicUnits = [];
            this.collectMatchingNodes(this.academicUnitTree, this._noticeData.targetAudience.targetIds, this.selectedAcademicUnits);
        }
    }

    private collectMatchingNodes(nodes: any[], targetIds: string[], result: any[]): void {
        for (const node of nodes) {
            if (targetIds.includes(node.key)) result.push(node);
            if (node.children?.length > 0) this.collectMatchingNodes(node.children, targetIds, result);
        }
    }

    loadStudents(): void {
        const filterParams = {
            'branch_id.eq': this.commonService.branch?.id,
            'authorities.name.equals': 'STUDENT'
        };
        this.userService.userSearch(0, 1000, 'id', 'ASC', filterParams).subscribe({
            next: (res: any) => {
                this.studentOptions = (res.content || []).map((student: ITenantUser) => ({
                    label: `${student.firstName} ${student.lastName} (${student.login})`,
                    value: student.id
                }));
            },
            error: (error) => console.error('Failed to load students', error)
        });
    }

    loadStaff(): void {
        const filterParams = {
            'branch_id.eq': this.commonService.branch?.id,
            'authorities.name.nin': ['IT_ADMINISTRATOR', 'STUDENT'],
            'id.nin': [+this.commonService.currentUser.userId]
        };
        this.userService.userSearch(0, 1000, 'id', 'ASC', filterParams).subscribe({
            next: (res: any) => {
                this.staffOptions = (res.content || []).map((staff: ITenantUser) => ({
                    label: `${staff.firstName} ${staff.lastName} (${staff.login})`,
                    value: staff.id
                }));
            },
            error: (error) => console.error('Failed to load staff', error)
        });
    }

    onTargetTypeChange(targetType: string): void {
        this.selectedAcademicUnits = [];
        this.noticeForm.get('targetAudience.selectedStudents')?.setValue([]);
        this.noticeForm.get('targetAudience.selectedStaff')?.setValue([]);
        this.noticeForm.get('targetAudience.selectedRoles')?.setValue([]);
        if (targetType === 'ACADEMIC_UNIT') this.loadDepartments();
    }

    findNodeByKey(nodes: TreeNode[], key: string): TreeNode | null {
        for (const node of nodes) {
            if (node.key === key) return node;
            if (node.children) {
                const found = this.findNodeByKey(node.children, key);
                if (found) return found;
            }
        }
        return null;
    }

    get categoryType() {
        return this.noticeForm.get('categoryType')?.value;
    }

    initializeForm(): void {
        this.noticeForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(5)]],
            content: ['', Validators.required],
            categoryType: [CategoryType.GENERAL, Validators.required],
            priority: [Priority.MEDIUM, Validators.required],
            attachments: [[]],

            targetAudience: this.fb.group({
                type: [TargetType.ALL, Validators.required],
                targetIds: [''],
                selectedStudents: [[]],
                selectedStaff: [[]],
                selectedRoles: [[]]
            }),

            timetable: this.fb.group({ effectiveDate: [null] }),
            attendance: this.fb.group({ attendancePercentage: [null], attendanceType: [null], parentMeetingRequired: [false] }),
            examAnnouncement: this.fb.group({ examTitle: [null], examType: [null], examStartDate: [null], examEndDate: [null] }),
            examResult: this.fb.group({ examTitle: [null], examType: [null], resultDeclarationDate: [null] }),
            holiday: this.fb.group({ holidayType: [null], holidayStartDate: [null], holidayEndDate: [null], weekOffDay: [null] }),
            meeting: this.fb.group({ meetingType: [null], meetingDate: [null], meetingTime: [null], venue: [null] }),
            fest: this.fb.group({ festName: [null], festType: [null], eventStartDate: [null], eventEndDate: [null], venue: [null] }),
            appreciation: this.fb.group({ recipientIds: [null], achievementCategory: [null], recognitionLevel: [null] }),
            schoolAchievement: this.fb.group({ recipientIds: [null], achievementCategory: [null], achievementDate: [null] })
        });

        this.noticeForm.get('fest.eventStartDate')?.valueChanges.subscribe(() => this.noticeForm.get('fest.eventEndDate')?.setValue(null));
        this.noticeForm.get('examAnnouncement.examStartDate')?.valueChanges.subscribe(() => this.noticeForm.get('examAnnouncement.examEndDate')?.setValue(null));
        this.noticeForm.get('holiday.holidayStartDate')?.valueChanges.subscribe(() => this.noticeForm.get('holiday.holidayEndDate')?.setValue(null));
    }

    populateForm(): void {
        if (!this._noticeData) return;

        const targetType = this._noticeData.targetAudience?.type;

        this.noticeForm.patchValue({
            title: this._noticeData.title,
            content: this._noticeData.content,
            categoryType: this._noticeData.categoryType,
            priority: this._noticeData.priority,
            attachments: this._noticeData.attachments || [],
            targetAudience: {
                type: targetType || TargetType.ALL,
                targetIds: this._noticeData.targetAudience?.targetIds?.join(',') || ''
            }
        });

        this.onTargetTypeChange(targetType);

        if (targetType === TargetType.STUDENT && this._noticeData.targetAudience?.targetIds) this.noticeForm.get('targetAudience.selectedStudents')?.setValue(this._noticeData.targetAudience.targetIds.map((id) => parseInt(id, 10)));
        else if (targetType === TargetType.STAFF && this._noticeData.targetAudience?.targetIds) this.noticeForm.get('targetAudience.selectedStaff')?.setValue(this._noticeData.targetAudience.targetIds.map((id) => parseInt(id, 10)));
        else if (targetType === TargetType.ROLE && this._noticeData.targetAudience?.targetIds) this.noticeForm.get('targetAudience.selectedRoles')?.setValue(this._noticeData.targetAudience.targetIds);

        if (this._noticeData.timetable) this.noticeForm.get('timetable')?.patchValue(this._noticeData.timetable);
        if (this._noticeData.attendance) this.noticeForm.get('attendance')?.patchValue(this._noticeData.attendance);
        if (this._noticeData.examAnnouncement) this.noticeForm.get('examAnnouncement')?.patchValue(this._noticeData.examAnnouncement);
        if (this._noticeData.examResult) this.noticeForm.get('examResult')?.patchValue(this._noticeData.examResult);
        if (this._noticeData.holiday) this.noticeForm.get('holiday')?.patchValue(this._noticeData.holiday);
        if (this._noticeData.meeting) {
            this.noticeForm.get('meeting')?.patchValue({
                ...this._noticeData.meeting,
                meetingDate: this._noticeData.meeting.meetingDate ? new Date(this._noticeData.meeting.meetingDate) : null,
                meetingTime: this._noticeData.meeting.meetingTime ? new Date(this._noticeData.meeting.meetingTime) : null
            });
        }
        if (this._noticeData.fest) this.noticeForm.get('fest')?.patchValue(this._noticeData.fest);
        if (this._noticeData.appreciation) {
            this.noticeForm.get('appreciation')?.patchValue({
                ...this._noticeData.appreciation,
                recipientIds: this._noticeData.appreciation.recipientIds?.join(',')
            });
        }
        if (this._noticeData.schoolAchievement) {
            this.noticeForm.get('schoolAchievement')?.patchValue({
                ...this._noticeData.schoolAchievement,
                recipientIds: this._noticeData.schoolAchievement.recipientIds?.join(',')
            });
        }
    }

    private hasValidData(obj: any): boolean {
        if (!obj) return false;
        return Object.values(obj).some((val) => {
            if (val === null || val === undefined || val === '') return false;
            if (typeof val === 'boolean') return true;
            if (typeof val === 'number') return true;
            if (typeof val === 'string' && val.trim().length > 0) return true;
            return true;
        });
    }

    submit(): void {
        if (!this.noticeForm.valid) {
            this.noticeForm.markAllAsTouched();
            return;
        }

        const raw = this.noticeForm.getRawValue();
        let targetIds: string[] = [];
        const targetType = raw.targetAudience?.type as TargetType;

        switch (targetType) {
            case TargetType.ACADEMIC_UNIT:
                targetIds = this.selectedAcademicUnits.map((unit: any) => unit.key);
                break;
            case TargetType.STUDENT:
                targetIds = raw.targetAudience?.selectedStudents?.map((id: any) => String(id)) || [];
                break;
            case TargetType.STAFF:
                targetIds = raw.targetAudience?.selectedStaff?.map((id: any) => String(id)) || [];
                break;
            case TargetType.ROLE:
                targetIds = raw.targetAudience?.selectedRoles || [];
                break;
            case TargetType.ALL:
            default:
                targetIds = ['all'];
                break;
        }

        const notice: Notice = {
            id: this.editMode && this._noticeData ? this._noticeData.id : null,
            academicYear: this.commonService.currentUser.academicYear,
            categoryType: raw.categoryType as CategoryType,
            title: raw.title ?? '',
            content: raw.content ?? '',
            priority: raw.priority as Priority,
            status: Status.PUBLISHED,
            publishedAt: this.editMode && this._noticeData ? this._noticeData.publishedAt : new Date().toISOString(),
            targetAudience: {
                type: targetType,
                targetIds: targetIds.length ? targetIds : ['all']
            },
            attachments: raw.attachments ?? [],
            // Pass selected channels so the backend API can use them if needed in future
            notificationChannels: Array.from(this.selectedChannels)
        } as any;

        if (raw.categoryType === CategoryType.TIMETABLE && raw.timetable?.effectiveDate) notice.timetable = { effectiveDate: this.commonService.formatDateForApi(raw.timetable.effectiveDate) };
        if (raw.categoryType === CategoryType.ATTENDANCE && this.hasValidData(raw.attendance))
            notice.attendance = { attendancePercentage: raw.attendance.attendancePercentage ?? undefined, attendanceType: raw.attendance.attendanceType, parentMeetingRequired: raw.attendance.parentMeetingRequired ?? false };
        if (raw.categoryType === CategoryType.EXAM_ANNOUNCEMENT && this.hasValidData(raw.examAnnouncement))
            notice.examAnnouncement = {
                examTitle: raw.examAnnouncement.examTitle,
                examType: raw.examAnnouncement.examType,
                examStartDate: this.commonService.formatDateForApi(raw.examAnnouncement.examStartDate),
                examEndDate: this.commonService.formatDateForApi(raw.examAnnouncement.examEndDate)
            };
        if (raw.categoryType === CategoryType.EXAM_RESULT && this.hasValidData(raw.examResult))
            notice.examResult = { examTitle: raw.examResult.examTitle, examType: raw.examResult.examType, resultDeclarationDate: this.commonService.formatDateForApi(raw.examResult.resultDeclarationDate) };
        if (raw.categoryType === CategoryType.HOLIDAY && this.hasValidData(raw.holiday))
            notice.holiday = {
                holidayType: raw.holiday.holidayType,
                holidayStartDate: this.commonService.formatDateForApi(raw.holiday.holidayStartDate),
                holidayEndDate: this.commonService.formatDateForApi(raw.holiday.holidayEndDate),
                weekOffDay: raw.holiday.weekOffDay
            };
        if (raw.categoryType === CategoryType.MEETING && this.hasValidData(raw.meeting))
            notice.meeting = { meetingType: raw.meeting.meetingType, meetingDate: this.commonService.formatDateForApi(raw.meeting.meetingDate), meetingTime: raw.meeting.meetingTime, venue: raw.meeting.venue };
        if (raw.categoryType === CategoryType.FEST && this.hasValidData(raw.fest))
            notice.fest = {
                festName: raw.fest.festName,
                festType: raw.fest.festType,
                eventStartDate: this.commonService.formatDateForApi(raw.fest.eventStartDate),
                eventEndDate: this.commonService.formatDateForApi(raw.fest.eventEndDate),
                venue: raw.fest.venue
            };
        if (raw.categoryType === CategoryType.APPRECIATION && this.hasValidData(raw.appreciation)) {
            const recipientIds = this.parseCsv(raw.appreciation.recipientIds);
            if (recipientIds.length > 0) notice.appreciation = { recipientIds, achievementCategory: raw.appreciation.achievementCategory, recognitionLevel: raw.appreciation.recognitionLevel };
        }
        if (raw.categoryType === CategoryType.SCHOOL_ACHIEVEMENT && this.hasValidData(raw.schoolAchievement)) {
            const recipientIds = this.parseCsv(raw.schoolAchievement.recipientIds);
            notice.schoolAchievement = {
                recipientIds: recipientIds.length > 0 ? recipientIds : undefined,
                achievementCategory: raw.schoolAchievement.achievementCategory,
                achievementDate: this.commonService.formatDateForApi(raw.schoolAchievement.achievementDate)
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
        if (this.noticeForm) {
            this.noticeForm.reset({
                categoryType: CategoryType.GENERAL,
                priority: Priority.MEDIUM,
                targetAudience: { type: TargetType.ALL, includeAll: true, targetIds: '', selectedStudents: [], selectedStaff: [], selectedRoles: [] },
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
        this.selectedAcademicUnits = [];
        this.selectedChannels = new Set(['PUSH']); // Reset to default
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
