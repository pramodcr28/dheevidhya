import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { StudentAttendenceServiceService } from '../../service/student-attendence-service.service';
import { AttendanceException, AttendanceRequest } from '../../models/attendence.model';
import { CommonService } from '../../../core/services/common.service';
import { IMasterSubject, Section } from '../../models/org.model';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { IProfileConfig } from '../../models/user.model';
import { Store } from '@ngrx/store';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getSubjectsByFilters } from '../../../core/store/user-profile/user-profile.selectors';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserService } from '../../service/user.service';

@Component({
  selector: 'app-take-attendence',
  imports: [ 
      CommonModule,
      FormsModule,
      ButtonModule,
      SelectModule,
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
   currentAttendence: AttendanceException[] = [];
   subjects:any[]=[];
   private store = inject(Store<{ userProfile: UserProfileState }>);
   studentService = inject(UserService);
   loader = inject(ApiLoaderService); 
    students = signal<any[] | null>([]);
  //   get filteredStudents(): AttendanceException[] {
  //   if (!this.attendenceService.searchTerm) {
  //     return this.currentAttendence;
  //   }
  //   return this.currentAttendence.filter(student =>
  //     student.studentName.toLowerCase().includes(this.attendenceService.searchTerm.toLowerCase()) ||
  //     student.studentId.includes(this.attendenceService.searchTerm)
  //   );
  // }



  onSectionChange(){
     this.store.select(
      getSubjectsByFilters(
        [this.selectedSection.departmentId],
        [this.selectedSection.classId],
        [this.selectedSection.sectionId])).subscribe(subjects=> {
           this.subjects = subjects;
     })
     this.load();
  }
      load(): void {
         this.currentAttendence = [];
        this.loader.show("Fetching Student Data");
        this.studentService.search(0, 100, 'id', 'ASC', { 'profileType.equals': "STUDENT" }).subscribe({
          next: (res: any) => {
          res.content?.forEach((student:IProfileConfig)=>{
                    this.currentAttendence.push({ studentName: student.fullName, studentId: student.userId, status: 'PRESENT' })
                  }) ;
            this.loader.hide();
          },
        });
      }

       updateAttendance(student: AttendanceException, status: "PRESENT" | "ABSENT" | "LATE") {
          student.status = status;
        }
      
        markAllPresent() {
          this.currentAttendence.forEach(student => {
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
           "exceptions": this.currentAttendence.filter(attendence => attendence.status != "PRESENT")
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
