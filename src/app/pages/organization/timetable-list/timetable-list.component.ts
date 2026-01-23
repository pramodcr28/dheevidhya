import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CommonService } from '../../../core/services/common.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { DheeSelectComponent } from '../../../shared/dhee-select/dhee-select.component';
import { StaffTimetableComponent } from '../../../shared/staff-timetable/staff-timetable.component';
import { DepartmentTimetable } from '../../models/time-table';
import { TimetableViewComponent } from './../../../shared/timetable-view/timetable-view.component';
import { TimeTableService } from './../../service/time-table.service';

interface StatusTransitionOption {
    status: string;
    label: string;
    description: string;
    icon: string;
}

@Component({
    selector: 'app-timetable-list',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        TagModule,
        FormsModule,
        RouterLink,
        DialogModule,
        TimetableViewComponent,
        ToastModule,
        ConfirmDialogModule,
        RadioButtonModule,
        DheeSelectComponent,
        SelectButtonModule,
        StaffTimetableComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './timetable-list.component.html'
})
export class TimetableListComponent implements OnInit {
    commonService = inject(CommonService);
    viewMode = signal<'personal' | 'list'>(this.commonService.getUserAuthorities.includes('IT_ADMINISTRATOR') ? 'list' : 'personal');
    viewOptions = [
        { label: 'My Timetable', value: 'personal', icon: 'pi pi-user' },
        { label: 'All Timetables', value: 'list', icon: 'pi pi-list' }
    ];
    statusFilter: string = '';
    timeTableService = inject(TimeTableService);
    confirmationService = inject(ConfirmationService);
    selectedDepartment: any;
    timetables: DepartmentTimetable[] = [];
    seletedTimeTable: DepartmentTimetable;
    studentTimetable: DepartmentTimetable;
    dailogeType: 'Edit' | 'View';
    showTimetableDialog = false;
    loader = inject(ApiLoaderService);
    messageService = inject(MessageService);
    showStatusChangeDialog = false;
    selectedNewStatus: string = '';
    currentTimetableForStatusChange: DepartmentTimetable | null = null;
    availableStatusOptions: StatusTransitionOption[] = [];

    statusOptions = [
        { label: 'All Status', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Published', value: 'PUBLISHED' },
        { label: 'Inactive', value: 'INACTIVE' }
    ];

    statusTransitionMap = {
        draft: [
            { status: 'PUBLISHED', label: 'Publish', description: 'Make this timetable active for use', icon: 'pi-check-circle' },
            { status: 'INACTIVE', label: 'Inactive', description: 'Archive or disable this timetable', icon: 'pi-times-circle' }
        ],
        published: [
            { status: 'DRAFT', label: 'Revert to Draft', description: 'Move back to draft for editing', icon: 'pi-pencil' },
            { status: 'INACTIVE', label: 'Inactive', description: 'Archive or disable this timetable', icon: 'pi-times-circle' }
        ],
        inactive: [
            { status: 'DRAFT', label: 'Draft', description: 'Restore to draft for editing', icon: 'pi-pencil' },
            { status: 'PUBLISHED', label: 'Publish', description: 'Make this timetable active for use', icon: 'pi-check-circle' }
        ]
    };

    editMode = signal(true);

    ngOnInit() {
        this.selectedDepartment = this.commonService.associatedDepartments[0]?.id;
        if (this.commonService.getUserAuthorities.includes('STUDENT')) {
            this.getTimeTableForStuqdent();
        } else {
            this.apiCall();
        }
    }

    getTimeTableForStuqdent() {
        const req = {
            deptId: this.commonService.getStudentInfo.departmentId,
            classId: this.commonService.getStudentInfo.classId,
            sectionId: this.commonService.getStudentInfo.sectionId
        };
        this.timeTableService.getStudentTimeTable(req).subscribe((res) => {
            this.studentTimetable = res;
            console.log('Student Timetable:', this.studentTimetable);
        });
    }

    apiCall() {
        this.loader.show('Fetching Timetables');

        const filters: any = {};

        if (this.selectedDepartment && this.selectedDepartment.length) {
            filters['department_id.in'] = this.selectedDepartment;
        } else if (this.commonService.getUserAuthorities.includes('IT_ADMINISTRATOR')) {
            filters['branch.eq'] = this.commonService?.branch?.id;
        } else {
            filters['department_id.in'] = this.commonService.associatedDepartments.map((dept) => dept.id);
        }

        if (this.statusFilter && this.statusFilter != '') {
            filters['status.equals'] = this.statusFilter;
        }

        this.timeTableService.search(0, 100, 'id', 'ASC', filters).subscribe((res) => {
            this.timetables = res.content;
            this.loader.hide();
        });
    }

    viewTimeTable(timetable) {
        this.dailogeType = 'View';
        this.seletedTimeTable = timetable;
        this.showTimetableDialog = true;
    }

    editTimeTable(timetable) {
        this.dailogeType = 'Edit';
        this.seletedTimeTable = timetable;
        this.showTimetableDialog = true;
    }

    changeStatus(timetable: DepartmentTimetable) {
        const currentStatus = timetable.status.toLowerCase();
        const availableTransitions = this.statusTransitionMap[currentStatus] || [];

        if (availableTransitions.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Transitions Available',
                detail: `Cannot change status from ${timetable.status.toUpperCase()}`,
                life: 3000
            });
            return;
        }

        this.currentTimetableForStatusChange = timetable;
        this.availableStatusOptions = availableTransitions;
        this.selectedNewStatus = '';
        this.showStatusChangeDialog = true;
    }

    confirmStatusChange() {
        if (!this.selectedNewStatus) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Selection Required',
                detail: 'Please select a status to change to',
                life: 2000
            });
            return;
        }

        this.proceedWithStatusChange();
    }

    proceedWithStatusChange() {
        if (!this.currentTimetableForStatusChange || !this.selectedNewStatus) {
            return;
        }

        this.loader.show('Updating status...');

        this.timeTableService.updateStatus(this.currentTimetableForStatusChange.id, this.selectedNewStatus).subscribe((response: any) => {
            // {
            //   "timestamp" : "2026-01-19T21:36:23.0227117",
            //   "status" : 409,
            //   "message" : "A published timetable already exists for department 'HIGH_SCHOOL' in academic year '2026-2027'",
            //   "error" : "Conflict"
            // }
            if (response.status == 200) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Status Updated Successfully',
                    detail: `Timetable status changed to ${this.selectedNewStatus}`,
                    life: 3000
                });
                this.loader.hide();
                this.showStatusChangeDialog = false;
                this.selectedNewStatus = '';
                this.currentTimetableForStatusChange = null;
                this.apiCall();
            } else {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: response.error,
                    detail: response.message,
                    life: 6000
                });
            }
        });
    }

    cancelStatusChange() {
        this.showStatusChangeDialog = false;
        this.selectedNewStatus = '';
        this.currentTimetableForStatusChange = null;
    }

    deleteTimeTable(timetable) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete <strong>${timetable.departmentName}</strong>?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.timeTableService.deleteTimeTable(timetable.id).subscribe(() => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Deleted',
                        detail: 'Timetable deleted successfully',
                        life: 2000
                    });
                    this.apiCall();
                });
            }
        });
    }

    cancel() {
        this.showTimetableDialog = false;
        this.seletedTimeTable = null;
    }

    saveTimetable(updatedTimetable: DepartmentTimetable): void {
        this.loader.show('Updating Timetable...');
        this.timeTableService.update(updatedTimetable, updatedTimetable.id || '').subscribe(() => {
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Timetable Updated successfully',
                life: 2000
            });
            this.loader.hide();
            this.showTimetableDialog = false;
            this.seletedTimeTable = null;
            this.apiCall();
        });
    }

    handleTimetableChange(updatedTimetable: DepartmentTimetable): void {
        // this.timeTableService.update(updatedTimetable, updatedTimetable.id || '').subscribe(() => {
        //     this.messageService.add({
        //         severity: 'success',
        //         summary: 'Success',
        //         detail: 'Timetable Updated successfully',
        //         life: 2000
        //     });
        //     this.loader.hide();
        // });
    }

    getAvailableStatusTransitions(currentStatus: string): string[] {
        return this.statusTransitionMap[currentStatus.toLowerCase()]?.map((opt) => opt.status) || [];
    }
}
