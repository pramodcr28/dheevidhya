
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TreeSelectModule } from 'primeng/treeselect';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { Holiday, HOLIDAY_TYPE_ICONS, HOLIDAY_TYPE_LABELS, HolidayDTO, HolidayType } from '../../models/holiday.model';
import { HolidayService } from '../../service/holiday.service';
import { UserService } from '../../service/user.service';

export type WeekOccurrence = 'ALL' | 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH';

export enum TargetType {
    ALL = 'ALL',
    ACADEMIC_UNIT = 'ACADEMIC_UNIT',
    ROLE = 'ROLE'
}

@Component({
    selector: 'app-holiday-dialog',
    standalone: true,
    imports: [FormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule, MultiSelectModule, DatePickerModule, TextareaModule, ToastModule, ChipModule, TreeSelectModule],
    providers: [MessageService],
    templateUrl: './holiday-dialog.component.html'
})
export class HolidayDialogComponent implements OnInit, OnChanges {
    @Input() visible = false;
    @Input() holiday: Holiday | null = null;
    @Output() save = new EventEmitter<Holiday>();
    @Output() cancel = new EventEmitter<void>();

    private holidayService = inject(HolidayService);
    private userService = inject(UserService);
    private commonService = inject(CommonService);
    private deptService = inject(DepartmentConfigService);
    private msgService = inject(MessageService);

    isEditMode = false;
    saving = false;
    formData: any = this.getInitialFormData();
    targetType: TargetType = TargetType.ALL;
    targetIds: any[] = [];
    academicUnitTree: TreeNode[] = [];
    roleOptions: any[] = [];

    targetTypeOptions = [
        { value: TargetType.ALL, label: 'Everyone', icon: 'pi pi-globe' },
        { value: TargetType.ACADEMIC_UNIT, label: 'Academic Unit', icon: 'pi pi-sitemap' },
        { value: TargetType.ROLE, label: 'Role', icon: 'pi pi-id-card' }
    ];

    weekDays = [
        { label: 'Sunday', value: 'SUNDAY' },
        { label: 'Monday', value: 'MONDAY' },
        { label: 'Tuesday', value: 'TUESDAY' },
        { label: 'Wednesday', value: 'WEDNESDAY' },
        { label: 'Thursday', value: 'THURSDAY' },
        { label: 'Friday', value: 'FRIDAY' },
        { label: 'Saturday', value: 'SATURDAY' }
    ];

    typeOptions = Object.entries(HOLIDAY_TYPE_LABELS).map(([value, label]) => ({
        label,
        value,
        icon: HOLIDAY_TYPE_ICONS[value as HolidayType]
    }));

    ngOnInit() {
        this.loadRoles();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['holiday'] || (changes['visible'] && this.visible)) {
            this.initForm();
        }
    }

    private getInitialFormData() {
        return {
            title: '',
            description: '',
            holidayType: null,
            startDate: null,
            endDate: null,
            weekOffDay: null,
            appliestoWeek: ['ALL']
        };
    }

    private initForm() {
        this.isEditMode = !!this.holiday?.id;
        if (this.holiday) {
            this.formData = {
                title: this.holiday.title ?? '',
                description: this.holiday.description ?? '',
                holidayType: this.holiday.holidayType ?? null,
                weekOffDay: this.holiday.weekOffDay ?? null,
                startDate: this.holiday.startDate ? new Date(this.holiday.startDate) : null,
                endDate: this.holiday.endDate ? new Date(this.holiday.endDate) : null,
                appliestoWeek: (this.holiday as any).appliestoWeek?.length ? (this.holiday as any).appliestoWeek : ['ALL']
            };

            const t = this.holiday.targetAudience;
            this.targetType = (t?.type as TargetType) ?? TargetType.ALL;
            this.targetIds = t?.targetIds || [];
            this.onTargetTypeChange(true);
        } else {
            this.formData = this.getInitialFormData();
            this.targetType = TargetType.ALL;
            this.targetIds = [];
        }
    }

    onTargetTypeChange(isInitial = false) {
        if (!isInitial) this.targetIds = [];

        if (this.targetType === TargetType.ACADEMIC_UNIT) {
            this.loadDepartments();
        } else if (this.targetType === TargetType.ROLE) {
            this.loadRoles();
        }
    }

    loadRoles() {
        this.userService.getAuthorities().subscribe((res) => {
            this.roleOptions = (res.body || []).map((r: any) => ({
                label: typeof r === 'string' ? r : r.name,
                value: typeof r === 'string' ? r : r.name
            }));
        });
    }

    loadDepartments(): void {
        if (this.commonService.getUserAuthorities.includes('IT_ADMIN')) {
            const filterParams = { branch: this.commonService.branch?.id };
            this.deptService.search(0, 100, 'id', 'ASC', filterParams).subscribe({
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
        this.targetIds = [];
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

        if (this.isEditMode && this.targetType === TargetType.ACADEMIC_UNIT) {
            const savedKeys = this.holiday?.targetAudience?.targetIds || [];
            const matched: TreeNode[] = [];
            this.collectMatchingNodes(this.academicUnitTree, savedKeys, matched);
            this.targetIds = matched;
        }
    }

    private collectMatchingNodes(nodes: any[], targetIds: string[], result: any[]): void {
        for (const node of nodes) {
            if (targetIds.includes(node.key)) result.push(node);
            if (node.children?.length > 0) this.collectMatchingNodes(node.children, targetIds, result);
        }
    }

    onSave() {
        if (!this.formData.title.trim() || !this.formData.holidayType) {
            this.msgService.add({ severity: 'warn', summary: 'Missing Info', detail: 'Title and Type are required.' });
            return;
        }

        this.saving = true;

        let finalIds: string[] = [];
        if (this.targetType === TargetType.ACADEMIC_UNIT) {
            finalIds = this.targetIds.map((n) => n.key);
        } else if (this.targetType === TargetType.ALL) {
            finalIds = ['ALL'];
        } else {
            finalIds = this.targetIds;
        }

        const dto: HolidayDTO = {
            title: this.formData.title.trim(),
            description: this.formData.description,
            holidayType: this.formData.holidayType,
            startDate: this.formData.holidayType === 'WEEK_OFF' ? undefined : this.commonService.formatDateForApi(this.formData.startDate),
            endDate: this.formData.holidayType === 'WEEK_OFF' ? undefined : this.commonService.formatDateForApi(this.formData.endDate || this.formData.startDate),
            weekOffDay: this.formData.holidayType === 'WEEK_OFF' ? this.formData.weekOffDay! : undefined,
            appliestoWeek: this.formData.holidayType === 'WEEK_OFF' ? this.formData.appliestoWeek : undefined,
            targetAudience: { type: this.targetType, targetIds: finalIds }
        };
        const request = this.isEditMode ? this.holidayService.update(this.holiday!.id!, dto) : this.holidayService.create(dto);
        request.subscribe({
            next: (res) => {
                this.saving = false;
                this.save.emit(res);
            },
            error: () => (this.saving = false)
        });
    }

    onCancel() {
        this.cancel.emit();
    }

    toggleOccurrence(v: WeekOccurrence) {
        if (v === 'ALL') {
            this.formData.appliestoWeek = ['ALL'];
            return;
        }
        this.formData.appliestoWeek = this.formData.appliestoWeek.filter((x: string) => x !== 'ALL');
        const i = this.formData.appliestoWeek.indexOf(v);
        i === -1 ? this.formData.appliestoWeek.push(v) : this.formData.appliestoWeek.splice(i, 1);
        if (!this.formData.appliestoWeek.length) this.formData.appliestoWeek = ['ALL'];
    }
}
