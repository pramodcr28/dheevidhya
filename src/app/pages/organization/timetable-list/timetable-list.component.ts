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
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CommonService } from '../../../core/services/common.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { DheeSelectComponent } from '../../../shared/dhee-select/dhee-select.component';
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
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, SelectModule, TagModule, FormsModule, RouterLink, DialogModule, TimetableViewComponent, ToastModule, ConfirmDialogModule, RadioButtonModule, DheeSelectComponent],
    providers: [MessageService, ConfirmationService],
    templateUrl: './timetable-list.component.html'
})
export class TimetableListComponent implements OnInit {
    statusFilter: string = '';
    timeTableService = inject(TimeTableService);
    commonService = inject(CommonService);
    confirmationService = inject(ConfirmationService);
    selectedDepartment: any;
    timetables: DepartmentTimetable[] = [];
    seletedTimeTable: DepartmentTimetable;
    dailogeType: 'Edit' | 'View';
    showTimetableDialog = false;
    loader = inject(ApiLoaderService);
    messageService = inject(MessageService);

    // Status Change Dialog Properties
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
        this.apiCall();
    }

    apiCall() {
        this.loader.show('Fetching Timetables');

        const filters: any = {
            'department_id.in': [this.selectedDepartment]
        };

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

        this.timeTableService.updateStatus(this.currentTimetableForStatusChange.id, this.selectedNewStatus).subscribe(
            (response) => {
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
            },
            (error) => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Failed to Update Status',
                    detail: error.error?.message || 'An error occurred while updating status',
                    life: 3000
                });
                console.error('Status update error:', error);
            }
        );
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
