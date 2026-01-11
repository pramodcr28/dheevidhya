import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import dayjs from 'dayjs/esm';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { finalize, map, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonService } from '../../../../core/services/common.service';
import { DepartmentConfigService } from '../../../../core/services/department-config.service';
import { MasterDepartmentService } from '../../../../core/services/master-department.service';
import { MasterSectionService } from '../../../../core/services/master-section.service';
import { MasterSubjectService } from '../../../../core/services/master-subject.service';
import { IDepartmentConfig, IMasterDepartment, IMasterSection, IMasterSubject } from '../../../models/org.model';
import { UserService } from '../../../service/user.service';
import { DepartmentConfigFormService } from './department-config-form.service';

@Component({
    selector: 'app-add-academic-year',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, DatePickerModule, ToastModule, MultiSelectModule],
    templateUrl: './add-academic-year.component.html',
    providers: [MessageService]
})
export class AddAcademicYearComponent implements OnInit, OnDestroy {
    protected departmentConfigService = inject(DepartmentConfigService);
    protected departmentConfigFormService = inject(DepartmentConfigFormService);
    protected activatedRoute = inject(ActivatedRoute);
    protected messageService = inject(MessageService);
    protected masterDepartmentService = inject(MasterDepartmentService);
    protected masterSectionService = inject(MasterSectionService);
    protected masterSubjectsService = inject(MasterSubjectService);
    protected commonService = inject(CommonService);
    protected userService = inject(UserService);

    isSaving = false;
    editForm = this.departmentConfigFormService.createForm();
    masterDepartment: IMasterDepartment | null = null;
    masterSectionCollection: IMasterSection[] = [];
    masterSubjectsCollection: IMasterSubject[] = [];
    selectedDepartmentConfig: IDepartmentConfig | null = null;

    // Staff state
    allStaff: any[] = [];
    targetStaff: any[] = [];
    searchSource: string = '';

    // Date & Validation state
    dateRange: Date[] = [];
    calculatedAcademicYear: string = '';
    rangeInfo: string = '';
    isValidRange: boolean = false;
    isNotTwelveMonths: boolean = false;
    isOverlapping: boolean = false;
    existingYearsStrings: string[] = [];

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
                        this.loadExistingYears(this.masterDepartment?.id);
                        this.initializeClasses(this.masterDepartment?.classes);
                        if (res.body.academicStart && res.body.academicEnd) {
                            this.dateRange = [dayjs(res.body.academicStart).toDate(), dayjs(res.body.academicEnd).toDate()];
                            this.validateAndCalculateDates();
                            this.editForm.patchValue({ dateRange: this.dateRange }, { emitEvent: false });
                        }
                        this.loadStaffData();
                    }
                });
            } else if (id) {
                this.masterDepartmentService.find(id).subscribe((res) => {
                    this.masterDepartment = res.body;
                    this.loadExistingYears(this.masterDepartment?.id);
                    this.editForm.patchValue({ department: this.masterDepartment, branch: this.commonService.branch });
                    this.initializeClasses(this.masterDepartment?.classes);
                    this.loadStaffData();
                });
            }
        });
    }

    loadExistingYears(deptId: any): void {
        if (!deptId) return;
        this.departmentConfigService.fetchAcademicYears(deptId).subscribe((data) => {
            // Store only the strings like "2028-2029", excluding current record being edited
            this.existingYearsStrings = (data || []).filter((y) => y.deptConfigId !== this.selectedDepartmentConfig?.id).map((y) => y.academicYear);
        });
    }

    validateAndCalculateDates(): void {
        this.isNotTwelveMonths = false;
        this.isOverlapping = false;
        this.isValidRange = false;

        if (!this.dateRange || this.dateRange.length !== 2 || !this.dateRange[0] || !this.dateRange[1]) return;

        const start = dayjs(this.dateRange[0]).startOf('month');
        const end = dayjs(this.dateRange[1]).endOf('month');

        // 1. Check for exactly 12 months
        const monthDiff = end.diff(start, 'month') + 1;
        if (monthDiff !== 12) {
            this.isNotTwelveMonths = true;
        }

        // 2. Format year string for overlap check
        const yearString = `${start.year()}-${end.year()}`;
        this.calculatedAcademicYear = yearString;

        // 3. Check Overlap against backend strings
        if (this.existingYearsStrings.includes(yearString)) {
            this.isOverlapping = true;
        }

        if (!this.isNotTwelveMonths && !this.isOverlapping) {
            this.rangeInfo = `${start.format('MMM YYYY')} to ${end.format('MMM YYYY')}`;
            this.isValidRange = true;
        }
    }

    private setupDateRangeListener(): void {
        this.editForm
            .get('dateRange')
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((val) => {
                if (val?.length === 2 && val[0] && val[1]) {
                    this.dateRange = val;
                    this.validateAndCalculateDates();
                }
            });
    }

    saveAll(): void {
        if (this.editForm.invalid || !this.isValidRange || this.isOverlapping || this.isNotTwelveMonths) {
            this.messageService.add({ severity: 'error', summary: 'Invalid Range', detail: 'Check 12-month period and overlaps.' });
            return;
        }

        this.isSaving = true;
        const config = this.departmentConfigFormService.getFormValue(this.editForm);
        config.academicYear = this.calculatedAcademicYear;
        config.academicStart = dayjs(this.dateRange[0]).startOf('month');
        config.academicEnd = dayjs(this.dateRange[1]).endOf('month');
        config.associatedStaffs = this.targetStaff.map((u) => u.id);

        const req = config.id ? this.departmentConfigService.update(config) : this.departmentConfigService.create(config);
        req.pipe(finalize(() => (this.isSaving = false))).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Configuration Saved' });
                setTimeout(() => this.goBack(), 1000);
            }
        });
    }

    // Staff Toggle Logic
    toggleStaff(user: any): void {
        const index = this.targetStaff.findIndex((u) => u.id === user.id);
        index > -1 ? this.targetStaff.splice(index, 1) : this.targetStaff.push(user);
    }

    isStaffSelected(user: any): boolean {
        return this.targetStaff.some((u) => u.id === user.id);
    }

    get filteredStaffList() {
        if (!this.searchSource) return this.allStaff;
        return this.allStaff.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(this.searchSource.toLowerCase()));
    }

    initializeClasses(classes: any[] | undefined): void {
        this.classesArray.clear();
        classes?.forEach((c) => {
            const classGroup = this.departmentConfigFormService.createClassFormGroup(c);
            this.classesArray.push(classGroup);
            if (c.sections) {
                const configs = classGroup.get('sectionConfigs') as FormArray;
                c.sections.forEach((s: any) => configs.push(this.departmentConfigFormService.createSectionFormGroup(s)));
            }
        });
    }

    onSectionsChange(idx: number): void {
        const group = this.classesArray.at(idx) as FormGroup;
        const selected = group.get('selectedSections')?.value as any[];
        const configs = group.get('sectionConfigs') as FormArray;
        selected.forEach((s) => {
            if (!configs.controls.some((c) => c.value.id === s.id)) configs.push(this.departmentConfigFormService.createSectionFormGroup(s));
        });
        for (let i = configs.length - 1; i >= 0; i--) {
            if (!selected.find((s) => s.id === configs.at(i).value.id)) configs.removeAt(i);
        }
    }

    getSectionConfigs(i: number): FormArray {
        return this.classesArray.at(i).get('sectionConfigs') as FormArray;
    }
    protected loadMasterData(): void {
        this.masterSectionService
            .query()
            .pipe(map((r) => r.body ?? []))
            .subscribe((r) => (this.masterSectionCollection = r));
        this.masterSubjectsService
            .query()
            .pipe(map((r) => r.body ?? []))
            .subscribe((r) => (this.masterSubjectsCollection = r));
    }
    protected loadStaffData(): void {
        const params = { 'branch_id.eq': this.commonService.branch?.id, 'authorities.name.ne': 'STUDENT' };
        this.userService.userSearch(0, 100, 'id', 'ASC', params).subscribe((r) => {
            this.allStaff = r.content ?? [];
            const ids = this.selectedDepartmentConfig?.associatedStaffs || [];
            this.targetStaff = this.allStaff.filter((s) => ids.includes(s.id?.toString()));
        });
    }
    goBack(): void {
        window.history.back();
    }
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
