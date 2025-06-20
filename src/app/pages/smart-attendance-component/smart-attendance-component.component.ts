import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { AttendanceException } from '../models/attendence.model';
import { StudentAttendenceServiceService } from '../service/student-attendence-service.service';
import { TakeAttendenceComponent } from './take-attendence/take-attendence.component';
import { DetailedReportsComponent } from './detailed-reports/detailed-reports.component';

@Component({
  selector: 'app-smart-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    CardModule,
    BadgeModule,
    TagModule,
    TableModule,
    TakeAttendenceComponent,
    DetailedReportsComponent
  ],
  templateUrl: './smart-attendance-component.component.html',
})
export class SmartAttendanceComponent implements OnInit {


  activeTab: 'attendance' | 'reports' | 'detailed' = 'attendance';
  selectedTimePeriod: any = null;
  attendenceService = inject(StudentAttendenceServiceService);
  ngOnInit() {
    this.attendenceService.currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.attendenceService.getStudents();
  }



 
  updateAttendance(student: AttendanceException, status: 'PRESENT' | 'ABSENT' | 'LATE') {
    student.status = status;
  }

  markAllPresent() {
    this.attendenceService.currentAttendence.forEach(student => {
      student.status = 'PRESENT';
    });
  }

  saveAttendance() {
    // Implement save logic here
    console.log('Saving attendance:', this.attendenceService.currentAttendence);
    alert('Attendance saved successfully!');
  }

  getTagSeverity(status: any): 'success' | 'danger' | 'warn' {
    switch (status) {
      case 'PRASENT':
        return 'success';
      case 'ABSENT':
        return 'danger';
      case 'LATE':
        return 'warn';
      default:
        return 'success';
    }
  }





}