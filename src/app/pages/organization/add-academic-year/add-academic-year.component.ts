import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import dayjs from 'dayjs/esm';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';
import { finalize, map, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { MasterDepartmentService } from '../../../core/services/master-department.service';
import { MasterSectionService } from '../../../core/services/master-section.service';
import { MasterSubjectService } from '../../../core/services/master-subject.service';
import { IMasterDepartment, IMasterSection, IMasterSubject } from '../../models/org.model';
import { UserService } from '../../service/user.service';
import { IDepartmentConfig } from './../../models/org.model';
import { DepartmentConfigFormService } from './department-config-form.service';

@Component({
    selector: 'app-add-academic-year',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, DatePickerModule, InputSwitchModule, ToastModule, MultiSelectModule, StepsModule, IconFieldModule, InputIconModule],
    templateUrl: './add-academic-year.component.html',
    styles: [
        `
            .fade-in {
                animation: fadeIn 0.4s ease-in-out;
            }
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        `
    ],
    providers: [MessageService]
})
export class AddAcademicYearComponent implements OnInit, OnDestroy {
    protected departmentConfigService = inject(DepartmentConfigService);
    protected departmentConfigFormService = inject(DepartmentConfigFormService);
    protected activatedRoute = inject(ActivatedRoute);
    protected router = inject(Router);
    protected messageService = inject(MessageService);
    protected masterDepartmentService = inject(MasterDepartmentService);
    protected masterSectionService = inject(MasterSectionService);
    protected masterSubjectsService = inject(MasterSubjectService);
    protected commonService = inject(CommonService);
    protected userService = inject(UserService);

    activeIndex: number = 0;
    steps = [{ label: 'Configuration' }, { label: 'Staff Assignment' }];
    isSaving = false;
    editForm = this.departmentConfigFormService.createForm();
    masterDepartment: IMasterDepartment | null = null;
    masterSectionCollection: IMasterSection[] = [];
    masterSubjectsCollection: IMasterSubject[] = [];
    selectedDepartmentConfig: IDepartmentConfig | null = null;

    allStaff: any[] = [];
    sourceStaff: any[] = [];
    targetStaff: any[] = [];
    searchSource: string = '';
    searchTarget: string = '';

    calculatedAcademicYear: string = '';
    dateRange: Date[] = [];
    rangeInfo: string = '';
    isValidRange: boolean = false;
    private destroy$ = new Subject<void>();

    get classesArray() {
        return this.editForm.get('classes') as FormArray;
    }

    ngOnInit(): void {
        this.loadMasterData();
        this.setupDateRangeListener();

        this.activatedRoute.params.subscribe((params) => {
            const id = params['id'];
            const isEditMode = this.activatedRoute.snapshot.url.some((seg) => seg.path.includes('edit'));

            if (isEditMode && id) {
                this.departmentConfigService.find(id).subscribe((res) => {
                    if (res.body) {
                        this.selectedDepartmentConfig = res.body;
                        this.editForm = this.departmentConfigFormService.createForm(this.selectedDepartmentConfig);
                        this.masterDepartment = res.body.department;
                        this.initializeClasses(this.masterDepartment?.classes);
                        if (res.body.academicStart && res.body.academicEnd) {
                            this.dateRange = [dayjs(res.body.academicStart).toDate(), dayjs(res.body.academicEnd).toDate()];
                            this.calculateAcademicYear();
                            // Patch value back to form to keep UI in sync
                            this.editForm.patchValue({ dateRange: this.dateRange }, { emitEvent: false });
                        }
                        this.loadStaffData();
                    }
                });
            } else if (id) {
                this.masterDepartmentService.find(id).subscribe((res) => {
                    this.masterDepartment = res.body;
                    this.editForm.patchValue({ department: this.masterDepartment, branch: this.commonService.branch });
                    this.initializeClasses(this.masterDepartment?.classes);
                    this.loadStaffData();
                });
            }
        });
    }

    initializeClasses(classes: any[] | undefined): void {
        this.classesArray.clear();
        classes?.forEach((c) => {
            const classGroup = this.departmentConfigFormService.createClassFormGroup(c);
            this.classesArray.push(classGroup);

            // Sync nested configurations if they exist (for Edit mode)
            if (c.sections) {
                const configs = classGroup.get('sectionConfigs') as FormArray;
                c.sections.forEach((s: any) => configs.push(this.departmentConfigFormService.createSectionFormGroup(s)));
            }
        });
    }

    onSectionsChange(classIndex: number): void {
        const classGroup = this.classesArray.at(classIndex) as FormGroup;
        const selected = classGroup.get('selectedSections')?.value as any[];
        const configs = classGroup.get('sectionConfigs') as FormArray;

        // 1. Remove configs that were unselected
        for (let i = configs.length - 1; i >= 0; i--) {
            const currentId = configs.at(i).value.id;
            if (!selected.find((s) => s.id === currentId)) {
                configs.removeAt(i);
            }
        }

        // 2. Add new unique instances for newly selected sections
        selected.forEach((s) => {
            const exists = configs.controls.some((ctrl) => ctrl.value.id === s.id);
            if (!exists) {
                // IMPORTANT: createSectionFormGroup creates a unique instance
                configs.push(this.departmentConfigFormService.createSectionFormGroup(s));
            }
        });
    }

    getSectionConfigs(classIndex: number): FormArray {
        return this.classesArray.at(classIndex).get('sectionConfigs') as FormArray;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupDateRangeListener(): void {
        this.editForm
            .get('dateRange')
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((val) => {
                if (val?.length === 2) {
                    this.dateRange = val;
                    this.calculateAcademicYear();
                }
            });
    }

    protected loadMasterData(): void {
        this.masterSectionService
            .query()
            .pipe(map((res) => res.body ?? []))
            .subscribe((res) => (this.masterSectionCollection = res));
        this.masterSubjectsService
            .query()
            .pipe(map((res) => res.body ?? []))
            .subscribe((res) => (this.masterSubjectsCollection = res));
    }

    protected loadStaffData(): void {
        this.userService
            .userSearch(0, 100, 'id', 'ASC', {
                'branch_id.equals': this.commonService.branch?.id,
                'authorities.name.ne': 'STUDENT'
            })
            .subscribe((res) => {
                this.allStaff = res.content ?? [];
                this.distributeStaff();
            });
    }

    distributeStaff(): void {
        const assignedIds = this.selectedDepartmentConfig?.associatedStaffs || [];
        this.sourceStaff = this.allStaff.filter((s) => !assignedIds.includes(s.id));
        this.targetStaff = this.allStaff.filter((s) => assignedIds.includes(s.id));
    }

    calculateAcademicYear(): void {
        if (!this.dateRange || this.dateRange.length !== 2) return;
        const start = dayjs(this.dateRange[0]);
        const end = dayjs(this.dateRange[1]);
        if (end.diff(start, 'months', true) <= 12) {
            this.calculatedAcademicYear = `${start.year()}-${end.year()}`;
            this.rangeInfo = `${start.format('MMM YYYY')} → ${end.format('MMM YYYY')}`;
            this.isValidRange = true;
        }
    }

    saveAndNext(): void {
        if (this.editForm.invalid || !this.isValidRange) return;
        this.isSaving = true;
        const config = this.departmentConfigFormService.getFormValue(this.editForm);
        config.academicYear = this.calculatedAcademicYear;
        config.academicStart = dayjs(this.dateRange[0]);
        config.academicEnd = dayjs(this.dateRange[1]);

        const req = config.id ? this.departmentConfigService.update(config) : this.departmentConfigService.create(config);
        req.pipe(finalize(() => (this.isSaving = false))).subscribe({
            next: (res) => {
                this.selectedDepartmentConfig = res.body;
                this.activeIndex = 1;
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Step 1 Saved' });
            }
        });
    }

    // Staff logic ...
    moveToTarget(user: any): void {
        this.targetStaff.push(user);
        this.sourceStaff = this.sourceStaff.filter((u) => u.id !== user.id);
    }
    moveToSource(user: any): void {
        this.sourceStaff.push(user);
        this.targetStaff = this.targetStaff.filter((u) => u.id !== user.id);
    }
    onDragStart(event: DragEvent, user: any, origin: string): void {
        event.dataTransfer?.setData('text', JSON.stringify({ user, origin }));
    }
    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }
    onDrop(event: DragEvent, dest: string): void {
        event.preventDefault();
        const data = JSON.parse(event.dataTransfer?.getData('text') || '{}');
        if (data.origin !== dest) dest === 'target' ? this.moveToTarget(data.user) : this.moveToSource(data.user);
    }
    saveStaffAssignment(): void {
        if (!this.selectedDepartmentConfig) return;
        this.isSaving = true;
        this.selectedDepartmentConfig.associatedStaffs = this.targetStaff.map((u) => u.id);
        this.departmentConfigService
            .update(this.selectedDepartmentConfig)
            .pipe(finalize(() => (this.isSaving = false)))
            .subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Complete' });
                    setTimeout(() => this.goBack(), 1000);
                }
            });
    }
    goBack(): void {
        window.history.back();
    }
    get filteredSourceStaff() {
        return this.sourceStaff.filter((u) => u.fullName?.toLowerCase().includes(this.searchSource.toLowerCase()));
    }
    get filteredTargetStaff() {
        return this.targetStaff.filter((u) => u.fullName?.toLowerCase().includes(this.searchTarget.toLowerCase()));
    }
    moveAllToTarget() {
        this.filteredSourceStaff.forEach((u) => this.moveToTarget(u));
    }
    moveAllToSource() {
        this.filteredTargetStaff.forEach((u) => this.moveToSource(u));
    }
}
