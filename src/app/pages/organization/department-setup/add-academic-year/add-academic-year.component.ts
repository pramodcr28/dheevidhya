import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import dayjs from 'dayjs/esm';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { Subject } from 'rxjs';
import { CommonService } from '../../../../core/services/common.service';
import { DepartmentConfigService } from '../../../../core/services/department-config.service';
import { MasterDepartmentService } from '../../../../core/services/master-department.service';
import { MasterSectionService } from '../../../../core/services/master-section.service';
import { MasterSubjectService } from '../../../../core/services/master-subject.service';
import { IDepartmentConfig, IMasterClass, IMasterDepartment, IMasterSection, IMasterSubject } from '../../../models/org.model';
import { UserService } from '../../../service/user.service';

@Component({
    selector: 'app-add-academic-year',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule, ToastModule],
    templateUrl: './add-academic-year.component.html',
    providers: [MessageService]
})
export class AddAcademicYearComponent implements OnInit, OnDestroy {
    protected departmentConfigService = inject(DepartmentConfigService);
    protected activatedRoute = inject(ActivatedRoute);
    protected messageService = inject(MessageService);
    protected masterDepartmentService = inject(MasterDepartmentService);
    protected masterSectionService = inject(MasterSectionService);
    protected masterSubjectsService = inject(MasterSubjectService);
    protected commonService = inject(CommonService);
    protected userService = inject(UserService);

    isSaving = false;
    masterDepartment: IMasterDepartment | null = null;
    masterSectionCollection: IMasterSection[] = [];
    masterSubjectsCollection: IMasterSubject[] = [];

    // Simplified state - using your actual model structure
    configId: string | null = null;
    branchId: number | null = null;
    classConfigs: IMasterClass[] = [];

    // Staff state
    allStaff: any[] = [];
    targetStaffIds: string[] = [];
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

    ngOnInit(): void {
        this.loadMasterData();
        this.handleRouteParams();
    }

    private handleRouteParams(): void {
        this.activatedRoute.params.subscribe((params) => {
            const id = params['id'];
            const isEditMode = this.activatedRoute.snapshot.url.some((seg) => seg.path.includes('edit'));

            if (isEditMode && id) {
                this.loadConfigForEdit(id);
            } else if (id) {
                this.loadDepartmentForNew(id);
            }
        });
    }

    private loadConfigForEdit(configId: string): void {
        this.departmentConfigService.find(configId).subscribe((res) => {
            if (res.body) {
                this.configId = res.body.id;
                this.masterDepartment = res.body.department;
                this.branchId = this.commonService.branch?.id || null;

                this.loadExistingYears(this.masterDepartment?.id);

                // Deep clone to avoid reference issues
                this.classConfigs = JSON.parse(JSON.stringify(res.body.department?.classes || []));

                if (res.body.academicStart && res.body.academicEnd) {
                    this.dateRange = [dayjs(res.body.academicStart).toDate(), dayjs(res.body.academicEnd).toDate()];
                    this.validateAndCalculateDates();
                }

                this.targetStaffIds = (res.body.associatedStaffs || []).map((id) => String(id));
                this.loadStaffData();
            }
        });
    }

    private loadDepartmentForNew(deptId: string): void {
        this.masterDepartmentService.find(deptId).subscribe((res) => {
            this.masterDepartment = res.body;
            this.branchId = this.commonService.branch?.id || null;
            this.loadExistingYears(this.masterDepartment?.id);

            // Deep clone and initialize with empty subjects
            this.classConfigs = (this.masterDepartment?.classes || []).map((cls) => ({
                ...cls,
                sections: (cls.sections || []).map((sec) => ({
                    ...sec,
                    subjects: [] // Start with no subjects selected
                }))
            }));

            this.loadStaffData();
        });
    }

    loadExistingYears(deptId: any): void {
        if (!deptId) return;
        this.departmentConfigService.fetchAcademicYears(deptId).subscribe((data) => {
            this.existingYearsStrings = (data || []).filter((y) => y.deptConfigId !== this.configId).map((y) => y.academicYear);
        });
    }

    validateAndCalculateDates(): void {
        this.isNotTwelveMonths = false;
        this.isOverlapping = false;
        this.isValidRange = false;

        if (!this.dateRange || this.dateRange.length !== 2 || !this.dateRange[0] || !this.dateRange[1]) return;

        const start = dayjs(this.dateRange[0]).startOf('month');
        const end = dayjs(this.dateRange[1]).endOf('month');

        const monthDiff = end.diff(start, 'month') + 1;
        if (monthDiff !== 12) {
            this.isNotTwelveMonths = true;
        }

        const yearString = `${start.year()}-${end.year()}`;
        this.calculatedAcademicYear = yearString;

        if (this.existingYearsStrings.includes(yearString)) {
            this.isOverlapping = true;
        }

        if (!this.isNotTwelveMonths && !this.isOverlapping) {
            this.rangeInfo = `${start.format('MMM YYYY')} to ${end.format('MMM YYYY')}`;
            this.isValidRange = true;
        }
    }

    onDateRangeChange(): void {
        if (this.dateRange?.length === 2 && this.dateRange[0] && this.dateRange[1]) {
            this.validateAndCalculateDates();
        }
    }

    // Subject management using the actual model structure
    isSubjectSelected(section: IMasterSection, subjectId: string): boolean {
        return (section.subjects || []).some((s) => s.id === subjectId);
    }

    toggleSubject(section: IMasterSection, subjectId: string): void {
        if (!section.subjects) {
            section.subjects = [] as IMasterSubject[];
        }

        const index = section.subjects.findIndex((s) => s.id === subjectId);

        if (index > -1) {
            // Remove subject
            section.subjects.splice(index, 1);
        } else {
            // Add subject - find from master collection
            const subject = this.masterSubjectsCollection.find((s) => s.id === subjectId);
            if (subject) {
                section.subjects.push({ ...subject }); // Clone to avoid reference issues
            }
        }
    }

    // Section visibility toggle
    toggleSection(classConfig: IMasterClass, masterSection: IMasterSection): void {
        if (!classConfig.sections) {
            classConfig.sections = [] as IMasterSection[];
        }

        const existingIndex = classConfig.sections.findIndex((s: any) => s.id === masterSection.id);

        if (existingIndex > -1) {
            // Remove section
            classConfig.sections.splice(existingIndex, 1);
        } else {
            // Add section with empty subjects
            const newSection: IMasterSection = {
                ...masterSection,
                subjects: [] // Start with no subjects
            };
            classConfig.sections.push(newSection);
        }
    }

    isSectionEnabled(classConfig: IMasterClass, sectionId: number): boolean {
        return (classConfig.sections || []).some((s) => s.id === sectionId);
    }

    // Get count of selected subjects for a section
    getSelectedSubjectCount(section: IMasterSection): number {
        return (section.subjects || []).length;
    }

    saveAll(): void {
        if (!this.isValidRange || this.isOverlapping || this.isNotTwelveMonths) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Range',
                detail: 'Check 12-month period and overlaps.'
            });
            return;
        }

        this.isSaving = true;

        // Build the config payload
        const config: IDepartmentConfig = {
            id: this.configId,
            academicYear: this.calculatedAcademicYear,
            academicStart: dayjs(this.dateRange[0]).startOf('month'),
            academicEnd: dayjs(this.dateRange[1]).endOf('month'),
            status: true,
            branch: this.branchId,
            department: {
                ...this.masterDepartment!,
                classes: this.classConfigs
            },
            associatedStaffs: this.targetStaffIds
        } as any;

        const req = config.id ? this.departmentConfigService.update(config) : this.departmentConfigService.create(config);

        req.subscribe({
            next: (res) => {
                this.isSaving = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Configuration Saved'
                });
                setTimeout(() => this.goBack(), 1000);
            },
            error: () => {
                this.isSaving = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save configuration'
                });
            }
        });
    }

    toggleStaff(user: any): void {
        const userId = String(user.id);
        const index = this.targetStaffIds.indexOf(userId);

        if (index > -1) {
            this.targetStaffIds.splice(index, 1);
        } else {
            this.targetStaffIds.push(userId);
        }
    }

    isStaffSelected(user: any): boolean {
        return this.targetStaffIds.includes(String(user.id));
    }

    get filteredStaffList() {
        if (!this.searchSource) return this.allStaff;
        return this.allStaff.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(this.searchSource.toLowerCase()));
    }

    get selectedStaffCount(): number {
        return this.targetStaffIds.length;
    }

    protected loadMasterData(): void {
        this.masterSectionService.query().subscribe((r) => {
            this.masterSectionCollection = r.body ?? [];
        });

        this.masterSubjectsService.query().subscribe((r) => {
            this.masterSubjectsCollection = r.body ?? [];
        });
    }

    protected loadStaffData(): void {
        const params = {
            'branch_id.eq': this.commonService.branch?.id,
            'authorities.name.ne': 'STUDENT'
        };
        this.userService.userSearch(0, 100, 'id', 'ASC', params).subscribe((r) => {
            this.allStaff = r.content ?? [];
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
