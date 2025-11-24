import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CommonService } from '../../../core/services/common.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { DepartmentTimetable } from '../../models/time-table';
import { TimetableViewComponent } from './../../../shared/timetable-view/timetable-view.component';
import { TimeTableService } from './../../service/time-table.service';

@Component({
    selector: 'app-timetable-list',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, SelectModule, TagModule, FormsModule, RouterLink, DialogModule, TimetableViewComponent, ToastModule],
    providers: [MessageService],
    templateUrl: './timetable-list.component.html'
})
export class TimetableListComponent implements OnInit {
    statusFilter: string = '';
    timeTableService = inject(TimeTableService);
    commonService = inject(CommonService);
    selectedDepartment: any;
    timetables: DepartmentTimetable[] = [];
    seletedTimeTable: DepartmentTimetable;
    dailogeType: 'Edit' | 'View';
    showTimetableDialog = false;
    statusOptions = [
        { label: 'All Status', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Published', value: 'PUBLISHED' },
        { label: 'Inactive', value: 'INACTIVE' }
    ];

    editMode = signal(true);

    loader = inject(ApiLoaderService);

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
    deleteTimeTable(timetable) {
        this.timeTableService.deleteTimeTable(timetable.id).subscribe((result) => {
            this.apiCall();
        });
    }

    cancel() {
        this.showTimetableDialog = false;
        this.seletedTimeTable = null;
    }

    saveTimetable() {}

    handleTimetableChange(updatedTimetable: DepartmentTimetable): void {
        console.log('Timetable changed:', updatedTimetable);
        // this.currentTimetable.set(updatedTimetable);
        // Optionally save to backend or mark as modified
    }
}
