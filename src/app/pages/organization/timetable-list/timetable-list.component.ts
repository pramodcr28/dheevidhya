import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
    // filteredTimetables: DepartmentTimetable[] = [];
    searchText: string = '';
    departmentFilter: string = '';
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
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' }
    ];
    loader = inject(ApiLoaderService);

    ngOnInit() {
        this.getTimeTableList();
    }

    getTimeTableList() {
        this.loader.show('Fetching Timetables');

        this.timeTableService.search(0, 100, 'id', 'ASC', { 'department_id.in': [...this.commonService.associatedDepartments?.map((dept) => dept.id)] }).subscribe((res) => {
            this.timetables = res.content;
            this.loader.hide();
        });

        // this.timeTableService.fetchTimeTables().subscribe((result: any) => {
        //     this.timetables = result;
        //     this.loader.hide();
        //     this.filteredTimetables = [...this.timetables];
        // });
    }

    // filterTimetables() {
    //     this.filteredTimetables = this.timetables.filter((timetable) => {
    //         const matchesSearch = timetable.settings.academicYear.toLowerCase().includes(this.searchText.toLowerCase()) || timetable.settings.semester.toLowerCase().includes(this.searchText.toLowerCase());

    //         const matchesDepartment = !this.departmentFilter || timetable.departmentId === this.departmentFilter;

    //         const matchesStatus = !this.statusFilter || (this.statusFilter === 'active' && timetable.isActive) || (this.statusFilter === 'archived' && !timetable.isActive);

    //         return matchesSearch && matchesDepartment && matchesStatus;
    //     });
    // }

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
            this.getTimeTableList();
        });
    }

    cancel() {
        this.showTimetableDialog = false;
        this.seletedTimeTable = null;
    }

    saveTimetable() {}
}
