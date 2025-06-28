import { Component, inject } from '@angular/core';
import { CommonService } from '../../../core/services/common.service';
import { StudentAttendenceServiceService } from '../../service/student-attendence-service.service';
import { AttendanceStats, LowAttendanceStudent } from '../../models/attendence.model';

@Component({
  selector: 'app-attendence-report',
  imports: [],
  templateUrl: './attendence-report.component.html',
  styles: ``
})
export class AttendenceReportComponent {
 attendenceService = inject(StudentAttendenceServiceService);
 commonService = inject(CommonService);

 attendanceStats: AttendanceStats = {
     averageRate: 92.7,
     rateChange: 2.3,
     totalClasses: 42,
     studentsAtRisk: 3
   };
 
   lowAttendanceStudents: LowAttendanceStudent[] = [
     { id: '2023001', name: 'John Doe', studentId: 'JD', attendanceRate: 68 },
     { id: '2023015', name: 'Alice Smith', studentId: 'AS', attendanceRate: 72 },
     { id: '2023022', name: 'Robert Johnson', studentId: 'RJ', attendanceRate: 74 }
   ];
}
