import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { IconFieldModule } from 'primeng/iconfield'; // Added
import { InputIconModule } from 'primeng/inputicon'; // Added
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';
import { finalize, forkJoin, map, Observable } from 'rxjs';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { MasterDepartmentService } from '../../../core/services/master-department.service';
import { MasterSectionService } from '../../../core/services/master-section.service';
import { MasterSubjectService } from '../../../core/services/master-subject.service';
import { IDepartmentConfig, IMasterClass, IMasterDepartment, IMasterSection, IMasterSubject } from '../../models/org.model';
import { UserService } from '../../service/user.service';
import { DepartmentConfigFormGroup, DepartmentConfigFormService } from './department-config-form.service';

@Component({
    selector: 'app-add-academic-year',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        CalendarModule,
        InputSwitchModule,
        ToastModule,
        MultiSelectModule,
        StepsModule,
        IconFieldModule, // Added
        InputIconModule // Added
    ],
    templateUrl: './add-academic-year.component.html',
    styles: [
        `
            :host ::ng-deep .p-steps .p-steps-item .p-menuitem-link {
                background: transparent;
            }
            /* Custom Scrollbar for staff lists */
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
        `
    ],
    providers: [MessageService]
})
export class AddAcademicYearComponent implements OnInit {
    // ... [Previous Injections remain same]
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

    // Stepper State
    activeIndex: number = 0;
    steps = [
        { label: 'Configuration & Curriculum', routerLink: null },
        { label: 'Staff Assignment', routerLink: null }
    ];

    // Data Collections
    isSaving = false;
    editForm: DepartmentConfigFormGroup = this.departmentConfigFormService.createDepartmentConfigFormGroup();
    masterDepartment: IMasterDepartment | null = null;
    masterSectionCollection: IMasterSection[] = [];
    masterSubjectsCollection: IMasterSubject[] = [];

    // Staff Management Data
    allBranchStaff: any[] = [];
    sourceStaff: any[] = [];
    targetStaff: any[] = [];

    // UI Helpers for Staff Filtering
    searchSource: string = '';
    searchTarget: string = '';

    ngOnInit(): void {
        this.loadMasterData();
        this.activatedRoute.params.subscribe((params) => {
            const id = params['id'];
            const urlSegments = this.activatedRoute.snapshot.url.map((segment) => segment.path);
            const isEditMode = urlSegments.some((path) => path.includes('edit'));

            if (isEditMode && id) {
                this.departmentConfigService.find(id).subscribe((res) => {
                    if (res.body) {
                        this.updateForm(res.body);
                        this.masterDepartment = res.body.department;
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
                    this.loadStaffData();
                });
            }
        });
    }

    // ... [loadMasterData and onSectionsChange remain same]
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
    onSectionsChange(classItem: IMasterClass): void {}

    protected loadStaffData(): void {
        const query = {
            'branchId.equals': this.commonService.branch?.id,
            'profileType.equals': 'STAFF',
            size: 1000
        };

        this.userService.query(query).subscribe((res) => {
            this.allBranchStaff = res.body ?? [];
            this.distributeStaff();
        });
    }

    distributeStaff() {
        if (!this.masterDepartment?.id || this.allBranchStaff.length === 0) {
            this.sourceStaff = [...this.allBranchStaff];
            this.targetStaff = [];
            return;
        }

        this.targetStaff = this.allBranchStaff.filter((user) => user.departments && user.departments.some((d: any) => d.id === this.masterDepartment?.id || d === this.masterDepartment?.id));

        this.sourceStaff = this.allBranchStaff.filter((user) => !this.targetStaff.find((t) => t.id === user.id));
    }

    // --- NEW: Staff Movement Logic ---

    get filteredSourceStaff() {
        return this.sourceStaff.filter((user) => user.fullName?.toLowerCase().includes(this.searchSource.toLowerCase()) || user.email?.toLowerCase().includes(this.searchSource.toLowerCase()));
    }

    get filteredTargetStaff() {
        return this.targetStaff.filter((user) => user.fullName?.toLowerCase().includes(this.searchTarget.toLowerCase()) || user.email?.toLowerCase().includes(this.searchTarget.toLowerCase()));
    }

    moveToTarget(user: any) {
        this.targetStaff.push(user);
        this.sourceStaff = this.sourceStaff.filter((u) => u.id !== user.id);
    }

    moveToSource(user: any) {
        this.sourceStaff.push(user);
        this.targetStaff = this.targetStaff.filter((u) => u.id !== user.id);
    }

    moveAllToTarget() {
        // Move visible (filtered) items
        const visible = this.filteredSourceStaff;
        this.targetStaff = [...this.targetStaff, ...visible];
        this.sourceStaff = this.sourceStaff.filter((u) => !visible.includes(u));
        this.searchSource = ''; // Clear search after bulk action
    }

    moveAllToSource() {
        const visible = this.filteredTargetStaff;
        this.sourceStaff = [...this.sourceStaff, ...visible];
        this.targetStaff = this.targetStaff.filter((u) => !visible.includes(u));
        this.searchTarget = '';
    }

    // HTML5 Drag and Drop Logic
    onDragStart(event: DragEvent, user: any, origin: 'source' | 'target') {
        event.dataTransfer?.setData('text/plain', JSON.stringify({ user, origin }));
        event.dataTransfer!.effectAllowed = 'move';
    }

    onDragOver(event: DragEvent) {
        event.preventDefault(); // Necessary to allow dropping
    }

    onDrop(event: DragEvent, destination: 'source' | 'target') {
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

    // ... [Save Logic remains same]
    saveAndNext(): void {
        this.isSaving = true;
        const departmentConfig = this.departmentConfigFormService.getDepartmentConfig(this.editForm);
        departmentConfig.department = this.masterDepartment;

        if (departmentConfig.id !== null) {
            this.subscribeToSaveResponse(this.departmentConfigService.update(departmentConfig), true);
        } else {
            this.subscribeToSaveResponse(this.departmentConfigService.create(departmentConfig), true);
        }
    }

    protected subscribeToSaveResponse(result: Observable<HttpResponse<IDepartmentConfig>>, isStep1: boolean): void {
        result.pipe(finalize(() => (this.isSaving = false))).subscribe({
            next: (res) => {
                if (res.body) {
                    this.updateForm(res.body);
                    if (isStep1) {
                        this.activeIndex = 1;
                        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Configuration saved. Please assign staff.' });
                    }
                }
            },
            error: () => this.onSaveError()
        });
    }

    saveStaffAssignment(): void {
        if (!this.masterDepartment?.id) return;
        this.isSaving = true;

        const updates: Observable<any>[] = [];

        this.targetStaff.forEach((user) => {
            const currentDepts = user.departments || [];
            const alreadyHas = currentDepts.some((d: any) => d.id === this.masterDepartment?.id || d === this.masterDepartment?.id);

            if (!alreadyHas) {
                const updatedUser = { ...user, departments: [...currentDepts, this.masterDepartment] };
                updates.push(this.userService.update(updatedUser));
            }
        });

        this.sourceStaff.forEach((user) => {
            const currentDepts = user.departments || [];
            const hasDept = currentDepts.some((d: any) => d.id === this.masterDepartment?.id || d === this.masterDepartment?.id);

            if (hasDept) {
                const updatedUser = {
                    ...user,
                    departments: currentDepts.filter((d: any) => (d.id || d) !== this.masterDepartment?.id)
                };
                updates.push(this.userService.update(updatedUser));
            }
        });

        if (updates.length > 0) {
            forkJoin(updates)
                .pipe(finalize(() => (this.isSaving = false)))
                .subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Staff assignments updated!' });
                        setTimeout(() => this.goBack(), 1000);
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update some staff records' })
                });
        } else {
            this.isSaving = false;
            this.messageService.add({ severity: 'info', summary: 'No Changes', detail: 'No staff changes detected.' });
            setTimeout(() => this.goBack(), 1000);
        }
    }

    protected onSaveSuccess(): void {}
    protected onSaveError(): void {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Operation failed' });
    }
    protected updateForm(departmentConfig: IDepartmentConfig): void {
        this.departmentConfigFormService.resetForm(this.editForm, departmentConfig);
    }
    goBack(): void {
        window.history.back();
    }
    compareIds(item1: any, item2: any): boolean {
        return item1 && item2 ? item1.id === item2.id : item1 === item2;
    }
}
