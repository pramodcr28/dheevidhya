import { TimetableViewComponent } from './../../../shared/timetable-view/timetable-view.component';
import { TimeTableService } from './../../service/time-table.service';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DepartmentTimetable } from '../../models/time-table';
import { RouterLink } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-timetable-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    FormsModule,
    RouterLink,
    DialogModule,
    TimetableViewComponent,
    ToastModule
  ],
  providers:[MessageService],
  templateUrl: './timetable-list.component.html'
})
export class TimetableListComponent implements OnInit {
 
  filteredTimetables: DepartmentTimetable[] = [];
  searchText: string = '';
  departmentFilter: string = '';
  statusFilter: string = '';
  timeTableService = inject(TimeTableService);
  timetables: DepartmentTimetable[] = [];
  seletedTimeTable: DepartmentTimetable;
   departments = [
    { label: 'All Departments', value: '' },
    { label: 'PUC Science', value: 'PUC_SCIENCE' },
    { label: 'PUC Commerce', value: 'PUC_COMMERCE' },
    { label: 'PUC Arts', value: 'PUC_ARTS' }
  ];

  statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' }
  ];

  ngOnInit() {
    this.timeTableService.fetchTimeTables().subscribe((result:any)=>{
      this.timetables = result;
      this.filteredTimetables = [...this.timetables];
    })

  }

  filterTimetables() {
    this.filteredTimetables = this.timetables.filter(timetable => {
      const matchesSearch = timetable.academicYear.toLowerCase().includes(this.searchText.toLowerCase()) ||
                           timetable.semester.toLowerCase().includes(this.searchText.toLowerCase());
      
      const matchesDepartment = !this.departmentFilter || 
                              timetable.departmentId === this.departmentFilter;
      
      const matchesStatus = !this.statusFilter || 
                          (this.statusFilter === 'active' && timetable.isActive) ||
                          (this.statusFilter === 'archived' && !timetable.isActive);
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }

  getDepartmentName(departmentId: string): string {
    switch(departmentId) {
      case 'PUC_SCIENCE': return 'PUC Science';
      case 'PUC_COMMERCE': return 'PUC Commerce';
      case 'PUC_ARTS': return 'PUC Arts';
      default: return departmentId;
    }
  }

  getUniqueSubjectsCount(timetable: DepartmentTimetable): number {
    // In a real app, you would calculate this from the actual data
    switch(timetable.departmentId) {
      case 'PUC_SCIENCE': return 15;
      case 'PUC_COMMERCE': return 12;
      case 'PUC_ARTS': return 10;
      default: return 0;
    }
  }

  getUniqueTeachersCount(timetable: DepartmentTimetable): number {
    // In a real app, you would calculate this from the actual data
    switch(timetable.departmentId) {
      case 'PUC_SCIENCE': return 8;
      case 'PUC_COMMERCE': return 6;
      case 'PUC_ARTS': return 5;
      default: return 0;
    }
  }

  getClassSectionsCount(timetable: DepartmentTimetable): number {
    // In a real app, you would calculate this from the actual data
    switch(timetable.departmentId) {
      case 'PUC_SCIENCE': return 5;
      case 'PUC_COMMERCE': return 3;
      case 'PUC_ARTS': return 2;
      default: return 0;
    }
  }

  viewTimeTable(timetable){
    this.seletedTimeTable = timetable;
  }

  cancel(){
     this.seletedTimeTable = null;
  }

  saveTimetable(){

  }
}
