import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import dayjs from 'dayjs/esm';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';
import { finalize, Subject, takeUntil } from 'rxjs';
import { CommonService } from '../../../../core/services/common.service';
import { DepartmentConfigService } from '../../../../core/services/department-config.service';
import { MasterDepartmentService } from '../../../../core/services/master-department.service';
import { IDepartmentConfig, IMasterDepartment } from '../../../models/org.model';
import { UserService } from '../../../service/user.service';

interface CloneOption {
    value: string;
    label: string;
    description: string;
    icon: string;
}

@Component({
    selector: 'app-clone-academic-year',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, DatePickerModule, ToastModule, RadioButtonModule, StepsModule],
    templateUrl: './clone-academic-year.component.html',
    providers: [MessageService],
    styles: [
        `
            .animate-fade-in {
                animation: fadeIn 0.3s ease-in-out;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `
    ]
})
export class CloneAcademicYearComponent implements OnInit, OnDestroy {
    protected departmentConfigService = inject(DepartmentConfigService);
    protected masterDepartmentService = inject(MasterDepartmentService);
    protected commonService = inject(CommonService);
    protected activatedRoute = inject(ActivatedRoute);
    protected router = inject(Router);
    protected messageService = inject(MessageService);
    protected userService = inject(UserService);

    private destroy$ = new Subject<void>();

    cloneForm!: FormGroup;
    masterDepartment: IMasterDepartment | null = null;
    sourceConfig: IDepartmentConfig | null = null;
    existingConfigs: IDepartmentConfig[] = [];

    dateRange: Date[] = [];
    calculatedAcademicYear: string = '';
    rangeInfo: string = '';
    isValidRange: boolean = false;
    hasOverlap: boolean = false;
    overlappingYears: string[] = [];

    isSaving = false;
    activeIndex = 0;
    steps = [{ label: 'Configuration' }, { label: 'Staff Assignment' }];

    savedConfigId: string | null = null;

    // Staff assignment properties
    allStaff: any[] = [];
    sourceStaff: any[] = [];
    targetStaff: any[] = [];
    searchSource: string = '';
    searchTarget: string = '';

    cloneOptions: CloneOption[] = [
        {
            value: 'full',
            label: 'Full Clone',
            description: 'Copy all classes, sections, subjects, and staff assignments',
            icon: 'pi-copy'
        },
        {
            value: 'structure',
            label: 'Structure Only',
            description: 'Copy classes, sections, and subjects (without staff assignments)',
            icon: 'pi-sitemap'
        },
        {
            value: 'minimal',
            label: 'Minimal',
            description: 'Copy only class and section structure (no subjects or staff)',
            icon: 'pi-table'
        }
    ];

    ngOnInit(): void {
        this.initializeForm();
        this.setupDateRangeListener();
        this.loadSourceConfig();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initializeForm(): void {
        this.cloneForm = new FormGroup({
            cloneType: new FormControl('full', [Validators.required]),
            dateRange: new FormControl(null, [Validators.required]),
            copyStaff: new FormControl(true),
            copySubjects: new FormControl(true),
            copySections: new FormControl(true)
        });
    }

    private setupDateRangeListener(): void {
        this.cloneForm
            .get('dateRange')
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((val) => {
                if (val?.length === 2) {
                    this.dateRange = val;
                    this.calculateAcademicYear();
                    this.validateDateRange();
                }
            });

        this.cloneForm
            .get('cloneType')
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((type) => {
                this.updateFormBasedOnCloneType(type);
            });
    }

    private updateFormBasedOnCloneType(type: string): void {
        switch (type) {
            case 'full':
                this.cloneForm.patchValue(
                    {
                        copyStaff: true,
                        copySubjects: true,
                        copySections: true
                    },
                    { emitEvent: false }
                );
                break;
            case 'structure':
                this.cloneForm.patchValue(
                    {
                        copyStaff: false,
                        copySubjects: true,
                        copySections: true
                    },
                    { emitEvent: false }
                );
                break;
            case 'minimal':
                this.cloneForm.patchValue(
                    {
                        copyStaff: false,
                        copySubjects: false,
                        copySections: true
                    },
                    { emitEvent: false }
                );
                break;
        }
    }

    private loadSourceConfig(): void {
        const sourceId = this.activatedRoute.snapshot.params['id'];

        if (!sourceId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Source configuration ID not found'
            });
            this.goBack();
            return;
        }

        this.departmentConfigService.find(sourceId).subscribe({
            next: (res) => {
                this.sourceConfig = res.body;
                this.masterDepartment = this.sourceConfig?.department || null;
                this.loadExistingConfigs();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load source configuration'
                });
                this.goBack();
            }
        });
    }

    private loadExistingConfigs(): void {
        if (!this.masterDepartment?.id) return;

        this.departmentConfigService.fetchAcademicYears(this.masterDepartment.id).subscribe({
            next: (configs) => {
                this.existingConfigs = configs || [];
            }
        });
    }

    private calculateAcademicYear(): void {
        if (!this.dateRange || this.dateRange.length !== 2) {
            this.isValidRange = false;
            return;
        }

        const start = dayjs(this.dateRange[0]);
        const end = dayjs(this.dateRange[1]);
        const monthsDiff = end.diff(start, 'months', true);

        if (monthsDiff > 0 && monthsDiff <= 12) {
            this.calculatedAcademicYear = `${start.year()}-${end.year()}`;
            this.rangeInfo = `${start.format('MMM YYYY')} → ${end.format('MMM YYYY')} (${Math.round(monthsDiff)} months)`;
            this.isValidRange = true;
        } else {
            this.isValidRange = false;
            this.rangeInfo = monthsDiff <= 0 ? 'Invalid: End date must be after start date' : 'Invalid: Period cannot exceed 12 months';
        }
    }

    private validateDateRange(): void {
        if (!this.isValidRange || !this.dateRange.length) {
            this.hasOverlap = false;
            this.overlappingYears = [];
            return;
        }

        const newStart = dayjs(this.dateRange[0]);
        const newEnd = dayjs(this.dateRange[1]);

        this.overlappingYears = [];

        for (const config of this.existingConfigs) {
            if (!config.academicStart || !config.academicEnd) continue;

            const existingStart = dayjs(config.academicStart);
            const existingEnd = dayjs(config.academicEnd);

            const hasOverlap = this.checkDateOverlap(newStart, newEnd, existingStart, existingEnd);

            if (hasOverlap && config.academicYear) {
                this.overlappingYears.push(config.academicYear);
            }
        }

        this.hasOverlap = this.overlappingYears.length > 0;
    }

    private checkDateOverlap(start1: dayjs.Dayjs, end1: dayjs.Dayjs, start2: dayjs.Dayjs, end2: dayjs.Dayjs): boolean {
        if (end1.isBefore(start2, 'day') || end2.isBefore(start1, 'day')) {
            return false;
        }
        return true;
    }

    saveAndNext(): void {
        if (this.cloneForm.invalid || !this.isValidRange || this.hasOverlap || !this.sourceConfig) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fix all validation errors before proceeding'
            });
            return;
        }

        this.isSaving = true;
        const cloneType = this.cloneForm.value.cloneType;
        const clonedDepartment = this.cloneDepartmentStructure(cloneType);
        const newConfig = this.buildNewConfig(clonedDepartment);

        this.departmentConfigService
            .create(newConfig)
            .pipe(finalize(() => (this.isSaving = false)))
            .subscribe({
                next: (res) => {
                    this.savedConfigId = res.body?.id || null;
                    this.activeIndex = 1;
                    this.loadStaffData();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Configuration saved. Now assign staff members.'
                    });
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to create academic year'
                    });
                }
            });
    }

    private buildNewConfig(clonedDepartment: IMasterDepartment): IDepartmentConfig {
        const formValue = this.cloneForm.value;

        const newConfig: IDepartmentConfig | any = {
            academicYear: this.calculatedAcademicYear,
            academicStart: dayjs(this.dateRange[0]),
            academicEnd: dayjs(this.dateRange[1]),
            status: true,
            branch: this.commonService.branch?.id,
            department: clonedDepartment,
            associatedStaffs: formValue.copyStaff ? [...(this.sourceConfig?.associatedStaffs || [])] : []
        };

        return newConfig;
    }

    private cloneDepartmentStructure(cloneType: string): IMasterDepartment {
        const source = this.sourceConfig?.department;
        if (!source) return {} as IMasterDepartment;

        const cloned: IMasterDepartment = {
            id: source.id,
            name: source.name,
            code: source.code,
            description: source.description,
            hod: this.cloneForm.value.copyStaff ? source.hod : null,
            classes: []
        };

        if (this.cloneForm.value.copySections && source.classes) {
            cloned.classes = source.classes.map((cls) => ({
                id: cls.id,
                name: cls.name,
                code: cls.code,
                sections: cls.sections?.map((sec) => ({
                    id: sec.id,
                    name: sec.name,
                    capacity: sec.capacity,
                    room: sec.room,
                    sectionTeacher: this.cloneForm.value.copyStaff ? sec.sectionTeacher : null,
                    subjects: this.cloneForm.value.copySubjects
                        ? sec.subjects?.map((sub) => ({
                              ...sub,
                              teacher: this.cloneForm.value.copyStaff ? sub.teacher : null
                          }))
                        : []
                }))
            }));
        }

        return cloned;
    }

    // Staff Assignment Methods
    private loadStaffData(): void {
        let filterParams = {
            'branch_id.eq': this.commonService.branch?.id,
            'authorities.name.ne': 'STUDENT'
        };

        this.userService.userSearch(0, 100, 'id', 'ASC', filterParams).subscribe((res) => {
            this.allStaff = res.content ?? [];
            const assignedIds = this.sourceConfig?.associatedStaffs || [];

            if (this.cloneForm.value.copyStaff) {
                // If copying staff, pre-populate target with source staff
                this.targetStaff = this.allStaff.filter((s) => assignedIds.includes(s.id?.toString()));
                this.sourceStaff = this.allStaff.filter((s) => !assignedIds.includes(s.id?.toString()));
            } else {
                // Otherwise, all staff available to assign
                this.sourceStaff = [...this.allStaff];
                this.targetStaff = [];
            }
        });
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
        if (data.origin !== dest) {
            dest === 'target' ? this.moveToTarget(data.user) : this.moveToSource(data.user);
        }
    }

    moveToTarget(user: any): void {
        if (!user?.id) return;
        this.targetStaff.push(user);
        this.sourceStaff = this.sourceStaff.filter((u) => u.id !== user.id);
    }

    moveToSource(user: any): void {
        if (!user?.id) return;
        this.sourceStaff.push(user);
        this.targetStaff = this.targetStaff.filter((u) => u.id !== user.id);
    }

    moveAllToTarget(): void {
        const toMove = [...this.filteredSourceStaff];
        toMove.forEach((u) => this.moveToTarget(u));
    }

    moveAllToSource(): void {
        const toMove = [...this.filteredTargetStaff];
        toMove.forEach((u) => this.moveToSource(u));
    }

    get filteredSourceStaff() {
        if (!this.searchSource) return this.sourceStaff;
        const search = this.searchSource.toLowerCase();
        return this.sourceStaff.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(search));
    }

    get filteredTargetStaff() {
        if (!this.searchTarget) return this.targetStaff;
        const search = this.searchTarget.toLowerCase();
        return this.targetStaff.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(search));
    }

    saveStaffAssignment(): void {
        if (!this.savedConfigId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Configuration not found'
            });
            return;
        }

        this.isSaving = true;

        this.departmentConfigService.find(this.savedConfigId).subscribe({
            next: (res) => {
                const config = res.body;
                if (config) {
                    config.associatedStaffs = this.targetStaff.map((u) => u.id);

                    this.departmentConfigService
                        .update(config)
                        .pipe(finalize(() => (this.isSaving = false)))
                        .subscribe({
                            next: () => {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Success',
                                    detail: `Academic year ${this.calculatedAcademicYear} created successfully`
                                });
                                setTimeout(() => {
                                    this.router.navigate(['/department-setup', this.masterDepartment?.id]);
                                }, 1500);
                            },
                            error: () => {
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Error',
                                    detail: 'Failed to update staff assignments'
                                });
                            }
                        });
                }
            },
            error: () => {
                this.isSaving = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load configuration'
                });
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/department-setup', this.masterDepartment?.id]);
    }

    get canProceed(): boolean {
        return this.cloneForm.valid && this.isValidRange && !this.hasOverlap;
    }
}
