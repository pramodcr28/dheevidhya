import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { StudentAttendenceServiceService } from '../../service/student-attendence-service.service';
import { AttendanceException, AttendanceRequest, AttendanceStatus } from '../../models/attendence.model';
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
import { ToastModule } from 'primeng/toast';

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
      DatePicker,
      ToastModule
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
   associatedDepartments = [];
   today: Date = new Date();
   takeAttandence = false;
    ngOnInit(){
       this.commonService.associatedDepartments.subscribe(depts=>{
             this.associatedDepartments = depts.map(dpt=>dpt.id);
          })
    }
  onSectionChange(){
     this.store.select(
      getSubjectsByFilters(
        [this.selectedSection.departmentId],
        [this.selectedSection.classId],
        [this.selectedSection.sectionId])).subscribe(subjects=> {
           this.subjects = subjects;
           this.selectedSubject = null;
     })
    //  this.load();
  }

  selectionChange(){
    if(this.selectedSubject && this.selectedSection && this.slotDate){
      // if(this.slotDate?.getTime() == this.today?.getTime()){
      //   this.takeAttandence = true
      // }
      this.load();
    }
  }
   
  isSelectedDateToday(){
   return  formatDate(this.slotDate, this.commonService.dateFormate, 'en-US') == formatDate(this.today, this.commonService.dateFormate, 'en-US')
  }

      load(): void {
      this.currentAttendence = [];
      this.loader.show("Fetching Student Attendence");

      this.studentService
        .search(0, 100, 'id', 'ASC', { 
          'profileType.equals': "STUDENT", 
          "roles.student.section_id.equals": this.selectedSection.sectionId, 
          "roles.student.class_id.equals": this.selectedSection.classId, 
          'departments.in': this.associatedDepartments 
        })
        .subscribe({
          next: (res: any) => {
            this.attendenceService
              .search(0, 100, 'id', 'ASC', { 
                'departmentId.in': this.associatedDepartments, 
                'classId.equals': this.selectedSection.classId,
                'sectionId.equals': this.selectedSection.sectionId,
                'subjectCode.equals': this.selectedSubject.code,
                'sessionDate.equals': formatDate(this.slotDate, this.commonService.dateFormate, 'en-US')
              })
              .subscribe((result: any) => {
                this.takeAttandence = result?.content?.length > 0;
                let exceptions: any[] = result?.content[0]?.exceptions ?? [];
    
                res.content?.forEach((student: IProfileConfig) => {
                  let status:AttendanceStatus = 'PRESENT';

                  let exception = exceptions.find(e => e.studentId === student.userId);

                  if (exception) {
                    status = exception.status;
                  }

                  this.currentAttendence.push({ 
                    studentName: student.fullName, 
                    studentId: student.userId, 
                    status: status 
                  });
                });

                this.loader.hide();
                console.log(this.currentAttendence);
              });
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

          if(this.selectedSubject){
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
          }else{
               this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Please select the subject'
                });
          }
       

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
