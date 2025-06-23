import { CommonModule, formatDate } from '@angular/common';
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
import { AttendanceException, AttendanceRequest } from '../../models/attendence.model';
import { CommonService } from '../../../core/services/common.service';
import { IMasterSubject, Section } from '../../models/org.model';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';

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
      DatePicker
    ],
  templateUrl: './take-attendence.component.html',
  styles: ``,
  providers:[MessageService]
})
export class TakeAttendenceComponent {


   selectedTimePeriod: any = null;
   attendenceService = inject(StudentAttendenceServiceService);
   commonService = inject(CommonService);
   selectedSection: Section | null;
   selectedSubject:IMasterSubject;
   slotDate: Date | undefined = new Date();
   messageService = inject(MessageService);
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

          if(this.selectedSubject)
          this.commonService.currentUser.subscribe(user=>{
         let todayAttendence:AttendanceRequest = {
           id: null,
           academicYear: "2024-25",
           "semester": "Fall",
           "departmentId": this.selectedSection.departmentId,
           "classId": this.selectedSection.classId,
           "sectionId": this.selectedSection.sectionId,
           "subjectCode": this.selectedSubject.code,
           "subjectName": this.selectedSubject.name,
           "instructorName": user.username,
           "instructorId": user.userId,
           "sessionDate": formatDate(this.slotDate, this.commonService.dateFormate, 'en-US'),
           "scheduleDay": "monday",
           "startTime": "10:00:00",
           "endTime": "11:00:00",
           "period": 0,
           "exceptions": this.attendenceService.currentAttendence.filter(attendence => attendence.status != "PRESENT")
         }

        this.attendenceService.create(todayAttendence).subscribe(res=>{
            this.messageService.add({text: "Congrats! Record created!",closeIcon: "close"});
        })
          })

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
