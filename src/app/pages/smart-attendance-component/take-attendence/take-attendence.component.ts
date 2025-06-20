import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { StudentAttendenceServiceService } from '../../service/student-attendence-service.service';
import { AttendanceException } from '../../models/attendence.model';

@Component({
  selector: 'app-take-attendence',
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
      CardModule
    ],
  templateUrl: './take-attendence.component.html',
  styles: ``
})
export class TakeAttendenceComponent {


   selectedTimePeriod: any = null;
   attendenceService = inject(StudentAttendenceServiceService);
  


    get filteredStudents(): AttendanceException[] {
    if (!this.attendenceService.searchTerm) {
      return this.attendenceService.currentAttendence;
    }
    return this.attendenceService.currentAttendence.filter(student =>
      student.studentName.toLowerCase().includes(this.attendenceService.searchTerm.toLowerCase()) ||
      student.studentId.includes(this.attendenceService.searchTerm)
    );
  }

    ngOninit(){
      this.attendenceService.selectedSection = this.attendenceService.sections[0];
      this.selectedTimePeriod = this.attendenceService.timePeriods[0];
    }
       updateAttendance(student: AttendanceException, status: "PRESENT" | "ABSENT" | "LATE") {
          student.status = status;
        }
      
        markAllPresent() {
          this.attendenceService.currentAttendence.forEach(student => {
            student.status = "PRESENT";
          });
        }
      
        saveAttendance() {
          // Implement save logic here
          console.log('Saving attendance:', this.attendenceService.currentAttendence);
          alert('Attendance saved successfully!');
        }
      
        getTagSeverity(status: any): 'success' | 'danger' | 'warn' {
          switch (status) {
            case 'Present':
              return 'success';
            case 'Absent':
              return 'danger';
            case 'Late':
              return 'warn';
            default:
              return 'success';
          }
        }
}
