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
import { ToastModule } from 'primeng/toast';
import { finalize, map, Subject, takeUntil } from 'rxjs';
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
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, DatePickerModule, ToastModule, RadioButtonModule],
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

    // Date & Validation state (matching add-academic-year component)
    dateRange: Date[] = [];
    calculatedAcademicYear: string = '';
    rangeInfo: string = '';
    isValidRange: boolean = false;
    isNotTwelveMonths: boolean = false;
    isOverlapping: boolean = false;
    existingYearsStrings: string[] = [];

    isSaving = false;

    // Staff assignment properties
    allStaff: any[] = [];
    targetStaff: any[] = [];
    searchSource: string = '';

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
            dateRange: new FormControl(null, [Validators.required])
        });
    }

    private setupDateRangeListener(): void {
        this.cloneForm
            .get('dateRange')
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((val) => {
                if (val?.length === 2 && val[0] && val[1]) {
                    this.dateRange = val;
                    this.validateAndCalculateDates();
                }
            });
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
                if (res.body) {
                    this.sourceConfig = res.body;
                    this.masterDepartment = this.sourceConfig?.department || null;
                    this.loadExistingYears();

                    // Initialize staff
                    this.loadStaffData();

                    // Set up initial target staff based on clone type
                    this.updateStaffBasedOnCloneType('full');
                }
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

    private loadExistingYears(): void {
        if (!this.masterDepartment?.id) return;

        this.departmentConfigService
            .fetchAcademicYears(this.masterDepartment.id)
            .pipe(map((data) => data || []))
            .subscribe((data) => {
                // Store only the strings like "2028-2029"
                this.existingYearsStrings = (data || []).map((y) => y.academicYear);
            });
    }

    getAuthorities(staff) {
        return staff?.authorities?.map((a) => a.name)?.join(', ') || '';
    }

    validateAndCalculateDates(): void {
        this.isNotTwelveMonths = false;
        this.isOverlapping = false;
        this.isValidRange = false;

        if (!this.dateRange || this.dateRange.length !== 2 || !this.dateRange[0] || !this.dateRange[1]) return;

        const start = dayjs(this.dateRange[0]).startOf('month');
        const end = dayjs(this.dateRange[1]).endOf('month');

        // 1. Check for exactly 12 months (matching add-academic-year)
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

    private updateStaffBasedOnCloneType(type: string): void {
        const assignedIds = this.sourceConfig?.associatedStaffs || [];

        if (type === 'full') {
            // Copy all staff from source
            this.targetStaff = this.allStaff.filter((s) => assignedIds.includes(s.id?.toString()));
        } else {
            // Clear staff for structure/minimal
            this.targetStaff = [];
        }
    }

    private loadStaffData(): void {
        const params = { 'branch_id.eq': this.commonService.branch?.id, 'authorities.name.ne': 'STUDENT', 'status.equals': 'ACTIVE' };
        this.userService.userSearch(0, 100, 'id', 'ASC', params).subscribe((r) => {
            this.allStaff = r.content ?? [];
            this.updateStaffBasedOnCloneType(this.cloneForm.get('cloneType')?.value || 'full');
        });
    }

    saveClone(): void {
        if (this.cloneForm.invalid || !this.isValidRange || this.isOverlapping || this.isNotTwelveMonths) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Configuration',
                detail: 'Please fix all validation errors before saving.'
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
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: `Academic year ${this.calculatedAcademicYear} cloned successfully`
                    });
                    setTimeout(() => {
                        this.router.navigate(['/home/department-setup', this.masterDepartment?.id]);
                    }, 1500);
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
            academicStart: dayjs(this.dateRange[0]).startOf('month'),
            academicEnd: dayjs(this.dateRange[1]).endOf('month'),
            status: true,
            branch: this.commonService.branch?.id,
            department: clonedDepartment,
            associatedStaffs: formValue.cloneType === 'full' ? this.targetStaff.map((u) => u.id) : []
        };

        return newConfig;
    }

    private cloneDepartmentStructure(cloneType: string): IMasterDepartment {
        const source = this.sourceConfig?.department;
        if (!source) return {} as IMasterDepartment;
        const selectedStaffIds = this.targetStaff.map((s) => s.id?.toString());

        const cloned: IMasterDepartment = {
            id: source.id,
            name: source.name,
            code: source.code,
            description: source.description,
            hod: cloneType === 'full' && source.hod && selectedStaffIds.includes(source.hod.toString()) ? source.hod : null,
            classes: []
        };

        if (source.classes) {
            cloned.classes = source.classes.map((cls) => ({
                id: cls.id,
                name: cls.name,
                code: cls.code,
                sections: cls.sections?.map((sec) => ({
                    id: sec.id,
                    name: sec.name,
                    capacity: sec.capacity,
                    room: sec.room,
                    sectionTeacher: cloneType === 'full' && sec.sectionTeacher && selectedStaffIds.includes(sec.sectionTeacher.toString()) ? sec.sectionTeacher : null,
                    subjects:
                        cloneType === 'full' || cloneType === 'structure'
                            ? sec.subjects?.map((sub) => ({
                                  ...sub,
                                  teacher: cloneType === 'full' && sub.teacher && selectedStaffIds.includes(sub.teacher.toString()) ? sub.teacher : null,
                                  exams: []
                              }))
                            : []
                }))
            }));
        }

        return cloned;
    }

    // Staff Toggle Logic (matching add-academic-year)
    toggleStaff(user: any): void {
        const cloneType = this.cloneForm.get('cloneType')?.value;

        // Only allow toggling if cloneType is 'full'
        if (cloneType !== 'full') {
            this.messageService.add({
                severity: 'warn',
                summary: 'Not Allowed',
                detail: 'Staff assignment is only available for Full Clone option'
            });
            return;
        }

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

    onCloneTypeChange(type: string): void {
        if (this.cloneForm.get('cloneType')?.value !== type) {
            this.cloneForm.get('cloneType')?.setValue(type);
        }

        this.updateStaffBasedOnCloneType(type);
    }

    goBack(): void {
        this.router.navigate(['/home/department-setup', this.masterDepartment?.id]);
    }
}
