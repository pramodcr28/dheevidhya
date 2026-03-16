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

    categoryOptions: any[] = [
        { label: 'General', value: 'GENERAL', icon: 'pi pi-bell', colorClass: 'bg-yellow-500' },
        { label: 'Time Table', value: 'TIMETABLE', icon: 'pi pi-calendar', colorClass: 'bg-blue-500' },
        { label: 'Meeting', value: 'MEETING', icon: 'pi pi-users', colorClass: 'bg-emerald-500' },
        { label: 'Attendance', value: 'ATTENDANCE', icon: 'pi pi-check-circle', colorClass: 'bg-orange-500' },
        { label: 'Exam Announcement', value: 'EXAM_ANNOUNCEMENT', icon: 'pi pi-file-edit', colorClass: 'bg-red-500' },
        { label: 'Exam Result', value: 'EXAM_RESULT', icon: 'pi pi-trophy', colorClass: 'bg-green-500' },
        // { label: 'Festival', value: 'FEST', icon: 'pi pi-heart', colorClass: 'bg-purple-500' },
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

    // festTypes = [
    //     { label: 'Cultural', value: 'Cultural' },
    //     { label: 'Sports', value: 'Sports' },
    //     { label: 'Science', value: 'Science' },
    //     { label: 'Literary', value: 'Literary' }
    // ];

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
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 0;
    sortField = 'id';
    sortOrder: 'ASC' | 'DESC' = 'ASC';
    messageService = inject(MessageService);
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

        // Load initial data
        this.loadStudents();
        this.loadStaff();

        // Subscribe to target type changes
        this.noticeForm.get('targetAudience.type')?.valueChanges.subscribe((targetType) => {
            this.onTargetTypeChange(targetType);
        });
    }

    load(): void {
        this.loader.show('Fetching Staff Data');
        let filterParams = {};

        filterParams = {
            'authorities.name.equals': 'STUDENT'
        };
        filterParams = {
            'branch_id.eq': this.commonService.branch?.id,
            'authorities.name.nin': ['IT_ADMINISTRATOR', 'STUDENT']
        };

        this.userService.userSearch(this.page, this.itemsPerPage, this.sortField, this.sortOrder, filterParams).subscribe({
            next: (res: any) => {
                this.users.set(res.content);
                this.totalItems = res.totalElements || 0;
                this.loader.hide();
            },
            error: (error) => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load staff data'
                });
            }
        });
    }

    loadDepartments(): void {
        if (this.commonService.getUserAuthorities.includes('IT_ADMIN')) {
            const filterParams = {
                branch: this.commonService.branch?.id
            };

            this.departmentConfigService.search(0, 100, 'id', 'ASC', filterParams).subscribe({
                next: (res: any) => {
                    if (res?.content) {
                        this.buildAcademicUnitTree(res.content);
                    }
                },
                error: (error) => {
                    console.error('Failed to load departments', error);
                }
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
                data: {
                    id: deptId,
                    type: 'department',
                    code: dept.department?.code,
                    academicYear: academicYear
                },
                children: []
            };

            if (dept.department?.classes && dept.department.classes.length > 0) {
                deptNode.children = dept.department.classes.map((cls: any) => {
                    const classNode: TreeNode = {
                        key: `${academicYear}:${deptId}:${cls.id}`,
                        label: cls.name || 'Unknown Class',
                        data: {
                            id: cls.id,
                            type: 'class',
                            code: cls.code,
                            departmentId: deptId,
                            academicYear: academicYear
                        },
                        children: []
                    };

                    if (cls.sections && cls.sections.length > 0) {
                        classNode.children = cls.sections.map((section: any) => ({
                            key: `${academicYear}:${deptId}:${cls.id}:${section.id}`,
                            label: section.name || 'Unknown Section',
                            data: {
                                id: section.id,
                                type: 'section',
                                code: section.code,
                                classId: cls.id,
                                departmentId: deptId,
                                academicYear: academicYear
                            }
                        }));
                    }

                    return classNode;
                });
            }

            return deptNode;
        });
        if (this._noticeData && this._noticeData.id && this._noticeData.targetAudience?.type === TargetType.ACADEMIC_UNIT && this._noticeData.targetAudience?.targetIds) {
            this.selectedAcademicUnits = [];

            this.collectMatchingNodes(this.academicUnitTree, this._noticeData.targetAudience.targetIds, this.selectedAcademicUnits);
        }
    }

    private collectMatchingNodes(nodes: any[], targetIds: string[], result: any[]): void {
        for (const node of nodes) {
            if (targetIds.includes(node.key)) {
                result.push(node);
            }
            if (node.children && node.children.length > 0) {
                this.collectMatchingNodes(node.children, targetIds, result);
            }
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
            error: (error) => {
                console.error('Failed to load students', error);
            }
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
            error: (error) => {
                console.error('Failed to load staff', error);
            }
        });
    }

    onTargetTypeChange(targetType: string): void {
        this.selectedAcademicUnits = [];
        this.noticeForm.get('targetAudience.selectedStudents')?.setValue([]);
        this.noticeForm.get('targetAudience.selectedStaff')?.setValue([]);
        this.noticeForm.get('targetAudience.selectedRoles')?.setValue([]);

        if (targetType === 'ACADEMIC_UNIT') {
            this.loadDepartments();
        }
    }

    findNodeByKey(nodes: TreeNode[], key: string): TreeNode | null {
        for (const node of nodes) {
            if (node.key === key) {
                return node;
            }
            if (node.children) {
                const found = this.findNodeByKey(node.children, key);
                if (found) {
                    return found;
                }
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
                recipientIds: [null],
                achievementCategory: [null],
                achievementDate: [null]
            })
        });

        this.noticeForm.get('fest.eventStartDate')?.valueChanges.subscribe(() => {
            this.noticeForm.get('fest.eventEndDate')?.setValue(null);
        });
        this.noticeForm.get('examAnnouncement.examStartDate')?.valueChanges.subscribe(() => {
            this.noticeForm.get('examAnnouncement.examEndDate')?.setValue(null);
        });
        this.noticeForm.get('holiday.holidayStartDate')?.valueChanges.subscribe(() => {
            this.noticeForm.get('holiday.holidayEndDate')?.setValue(null);
        });
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
        if (targetType === TargetType.STUDENT && this._noticeData.targetAudience?.targetIds) {
            this.noticeForm.get('targetAudience.selectedStudents')?.setValue(this._noticeData.targetAudience.targetIds.map((id) => parseInt(id, 10)));
        } else if (targetType === TargetType.STAFF && this._noticeData.targetAudience?.targetIds) {
            this.noticeForm.get('targetAudience.selectedStaff')?.setValue(this._noticeData.targetAudience.targetIds.map((id) => parseInt(id, 10)));
        } else if (targetType === TargetType.ROLE && this._noticeData.targetAudience?.targetIds) {
            this.noticeForm.get('targetAudience.selectedRoles')?.setValue(this._noticeData.targetAudience.targetIds);
        }

        // Populate category-specific data
        if (this._noticeData.timetable) {
            this.noticeForm.get('timetable')?.patchValue(this._noticeData.timetable);
        }

        if (this._noticeData.attendance) {
            this.noticeForm.get('attendance')?.patchValue(this._noticeData.attendance);
        }

        if (this._noticeData.examAnnouncement) {
            this.noticeForm.get('examAnnouncement')?.patchValue(this._noticeData.examAnnouncement);
        }

        if (this._noticeData.examResult) {
            this.noticeForm.get('examResult')?.patchValue(this._noticeData.examResult);
        }

        if (this._noticeData.holiday) {
            this.noticeForm.get('holiday')?.patchValue(this._noticeData.holiday);
        }

        if (this._noticeData.meeting) {
            this.noticeForm.get('meeting')?.patchValue({
                ...this._noticeData.meeting,
                meetingDate: this._noticeData.meeting.meetingDate ? new Date(this._noticeData.meeting.meetingDate) : null,
                meetingTime: this._noticeData.meeting.meetingTime ? new Date(this._noticeData.meeting.meetingTime) : null
            });
        }

        if (this._noticeData.fest) {
            this.noticeForm.get('fest')?.patchValue(this._noticeData.fest);
        }

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
            attachments: raw.attachments ?? []
        };

        // Only add timetable if it has the effectiveDate
        if (raw.categoryType === CategoryType.TIMETABLE && raw.timetable?.effectiveDate) {
            notice.timetable = {
                effectiveDate: this.commonService.formatDateForApi(raw.timetable.effectiveDate)
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
                examStartDate: this.commonService.formatDateForApi(raw.examAnnouncement.examStartDate) ?? undefined,
                examEndDate: this.commonService.formatDateForApi(raw.examAnnouncement.examEndDate) ?? undefined
            };
        }

        // Add examResult if category is EXAM_RESULT and has valid data
        if (raw.categoryType === CategoryType.EXAM_RESULT && this.hasValidData(raw.examResult)) {
            notice.examResult = {
                examTitle: raw.examResult.examTitle ?? undefined,
                examType: raw.examResult.examType ?? undefined,
                resultDeclarationDate: this.commonService.formatDateForApi(raw.examResult.resultDeclarationDate) ?? undefined
            };
        }

        // Add holiday if category is HOLIDAY and has valid data
        if (raw.categoryType === CategoryType.HOLIDAY && this.hasValidData(raw.holiday)) {
            notice.holiday = {
                holidayType: raw.holiday.holidayType as 'Emergency' | 'Government' | 'Weather',
                holidayStartDate: this.commonService.formatDateForApi(raw.holiday.holidayStartDate) ?? undefined,
                holidayEndDate: this.commonService.formatDateForApi(raw.holiday.holidayEndDate) ?? undefined,
                weekOffDay: raw.holiday.weekOffDay ?? undefined
            };
        }

        // Add meeting if category is MEETING and has valid data
        if (raw.categoryType === CategoryType.MEETING && this.hasValidData(raw.meeting)) {
            notice.meeting = {
                meetingType: raw.meeting.meetingType as 'PTM' | 'Individual' | 'Emergency' | 'Progress' | 'Staff',
                meetingDate: this.commonService.formatDateForApi(raw.meeting.meetingDate) ?? undefined,
                meetingTime: raw.meeting.meetingTime ?? undefined,
                venue: raw.meeting.venue ?? undefined
            };
        }

        // Add fest if category is FEST and has valid data
        if (raw.categoryType === CategoryType.FEST && this.hasValidData(raw.fest)) {
            notice.fest = {
                festName: raw.fest.festName ?? undefined,
                festType: raw.fest.festType as 'Cultural' | 'Sports' | 'Science' | 'Literary',
                eventStartDate: this.commonService.formatDateForApi(raw.fest.eventStartDate) ?? undefined,
                eventEndDate: this.commonService.formatDateForApi(raw.fest.eventEndDate) ?? undefined,
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
                achievementDate: this.commonService.formatDateForApi(raw.schoolAchievement.achievementDate) ?? undefined
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
                targetAudience: {
                    type: TargetType.ALL,
                    includeAll: true,
                    targetIds: '',
                    selectedStudents: [],
                    selectedStaff: [],
                    selectedRoles: []
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
        this.selectedAcademicUnits = [];
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
