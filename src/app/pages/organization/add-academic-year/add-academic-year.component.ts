import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
            :host ::ng-deep .p-steps .p-steps-item .p-menuitem-link {
                background: transparent;
            }
            .staff-scroll::-webkit-scrollbar {
                width: 6px;
            }
            .staff-scroll::-webkit-scrollbar-track {
                background: transparent;
            }
            .staff-scroll::-webkit-scrollbar-thumb {
                background-color: #cbd5e1;
                border-radius: 20px;
            }
            .dark .staff-scroll::-webkit-scrollbar-thumb {
                background-color: #475569;
            }
            .date-range-badge {
                animation: slideIn 0.3s ease-out;
            }
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
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
    steps = [{ label: 'Configuration & Curriculum' }, { label: 'Staff Assignment' }];

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
                        this.setupDateRangeListener();

                        // Set date range from existing data
                        if (res.body.academicStart && res.body.academicEnd) {
                            this.dateRange = [dayjs(res.body.academicStart).toDate(), dayjs(res.body.academicEnd).toDate()];
                            this.calculateAcademicYear();
                        }

                        this.loadStaffData();
                    }
                });
            } else if (id) {
                this.masterDepartmentService.find(id).subscribe((res) => {
                    this.masterDepartment = res.body;
                    this.editForm.patchValue({
                        department: this.masterDepartment,
                        branch: this.commonService.branch
                    });
                    this.setupDateRangeListener();
                    this.loadStaffData();
                });
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupDateRangeListener(): void {
        this.destroy$.next();

        const dateRangeControl = this.editForm.get('dateRange');
        if (dateRangeControl) {
            dateRangeControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
                if (value && Array.isArray(value) && value.length === 2) {
                    this.dateRange = value;
                    this.calculateAcademicYear();
                }
            });
        }
    }

    protected loadMasterData(): void {
        this.masterSectionService
            .query()
            .pipe(map((res) => res.body ?? []))
            .subscribe((sections) => (this.masterSectionCollection = sections));

        this.masterSubjectsService
            .query()
            .pipe(map((res) => res.body ?? []))
            .subscribe((subjects) => (this.masterSubjectsCollection = subjects));
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
        this.sourceStaff = [];
        this.targetStaff = [];

        const assignedIds = this.selectedDepartmentConfig?.associatedStaffs || [];
        this.allStaff.forEach((staff) => {
            if (assignedIds.includes(staff.id?.toString()) || assignedIds.includes(staff.id?.toString())) {
                this.targetStaff.push(staff);
            } else {
                this.sourceStaff.push(staff);
            }
        });
    }

    calculateAcademicYear(): void {
        this.rangeInfo = '';
        this.calculatedAcademicYear = '';
        this.isValidRange = false;

        if (!this.dateRange || this.dateRange.length !== 2) {
            this.rangeInfo = 'Select both start and end dates';
            return;
        }

        try {
            const [startDate, endDate] = this.dateRange;
            const start = dayjs(startDate);
            const end = dayjs(endDate);

            if (!start.isValid() || !end.isValid()) {
                this.rangeInfo = 'Invalid date format';
                return;
            }

            if (end.isBefore(start)) {
                this.rangeInfo = 'End date must be after start date';
                return;
            }

            const monthDiff = end.diff(start, 'months', true);

            if (monthDiff > 12) {
                this.rangeInfo = 'Maximum 12 months allowed';
                return;
            }

            const startYear = start.year();
            const endYear = end.year();
            this.calculatedAcademicYear = `${startYear}-${endYear}`;
            this.rangeInfo = `${start.format('MMM YYYY')} → ${end.format('MMM YYYY')}`;
            this.isValidRange = true;
        } catch (error) {
            this.rangeInfo = 'Error calculating year';
        }
    }

    get filteredSourceStaff(): any[] {
        return this.sourceStaff.filter((user) => user.fullName?.toLowerCase().includes(this.searchSource.toLowerCase()) || user.email?.toLowerCase().includes(this.searchSource.toLowerCase()));
    }

    get filteredTargetStaff(): any[] {
        return this.targetStaff.filter((user) => user.fullName?.toLowerCase().includes(this.searchTarget.toLowerCase()) || user.email?.toLowerCase().includes(this.searchTarget.toLowerCase()));
    }

    moveToTarget(user: any): void {
        this.targetStaff.push(user);
        this.sourceStaff = this.sourceStaff.filter((u) => u.id !== user.id);
    }

    moveToSource(user: any): void {
        this.sourceStaff.push(user);
        this.targetStaff = this.targetStaff.filter((u) => u.id !== user.id);
    }

    moveAllToTarget(): void {
        this.targetStaff = [...this.targetStaff, ...this.filteredSourceStaff];
        this.sourceStaff = this.sourceStaff.filter((u) => !this.filteredSourceStaff.includes(u));
        this.searchSource = '';
    }

    moveAllToSource(): void {
        this.sourceStaff = [...this.sourceStaff, ...this.filteredTargetStaff];
        this.targetStaff = this.targetStaff.filter((u) => !this.filteredTargetStaff.includes(u));
        this.searchTarget = '';
    }

    onDragStart(event: DragEvent, user: any, origin: 'source' | 'target'): void {
        event.dataTransfer?.setData('text/plain', JSON.stringify({ user, origin }));
        event.dataTransfer!.effectAllowed = 'move';
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    onDrop(event: DragEvent, destination: 'source' | 'target'): void {
        event.preventDefault();
        const data = event.dataTransfer?.getData('text/plain');
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.origin !== destination) {
                if (destination === 'target') this.moveToTarget(parsed.user);
                else this.moveToSource(parsed.user);
            }
        }
    }

    saveAndNext(): void {
        if (!this.editForm.valid) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill all required fields' });
            return;
        }

        if (!this.isValidRange) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please select a valid date range (max 12 months)' });
            return;
        }

        this.isSaving = true;
        const config = this.departmentConfigFormService.getFormValue(this.editForm);
        config.department = this.masterDepartment;
        config.academicYear = this.calculatedAcademicYear;
        config.academicStart = dayjs(this.dateRange[0]);
        config.academicEnd = dayjs(this.dateRange[1]);

        if (config.id) {
            this.departmentConfigService
                .update(config)
                .pipe(finalize(() => (this.isSaving = false)))
                .subscribe({
                    next: (res) => {
                        this.selectedDepartmentConfig = res.body || null;
                        this.activeIndex = 1;
                        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Configuration saved' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save' })
                });
        } else {
            this.departmentConfigService
                .create(config)
                .pipe(finalize(() => (this.isSaving = false)))
                .subscribe({
                    next: (res) => {
                        this.selectedDepartmentConfig = res.body || null;
                        this.editForm.patchValue({ id: res.body?.id });
                        this.activeIndex = 1;
                        this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Configuration created' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create' })
                });
        }
    }

    saveStaffAssignment(): void {
        if (!this.selectedDepartmentConfig) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No configuration selected' });
            return;
        }

        this.isSaving = true;
        this.selectedDepartmentConfig.associatedStaffs = this.targetStaff.map((u) => u.id);

        this.departmentConfigService
            .update(this.selectedDepartmentConfig)
            .pipe(finalize(() => (this.isSaving = false)))
            .subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Staff assignments saved' });
                    setTimeout(() => this.goBack(), 1000);
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save assignments' })
            });
    }

    goBack(): void {
        window.history.back();
    }
}
