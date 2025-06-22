import { IProfileConfig, ITenantUser } from './../models/user.model';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { Observable } from 'rxjs';
import { AttendanceReport, AttendanceStats, LowAttendanceStudent, AttendanceException } from '../models/attendence.model';
import { UserService } from './user.service';


@Injectable({
  providedIn: 'root'
})
export class StudentAttendenceServiceService {

    searchTerm: string = '';
    currentDate: string = '';
    students = signal<any[]>([]);
  

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


  currentAttendence: AttendanceException[] = [
    
  ];

 protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL +'api/attendance');
  protected studentService = inject(UserService);

  search<T>(page: number = 0, size: number = 10, sortBy: string = 'id', 
    sortDirection: string = 'ASC', filters: any = {}): Observable<any> {

      const searchRequest = {
      page: page,
      size: size,
      sortBy: sortBy,
      sortDirection: sortDirection,
      filters: filters
      };

    return this.http.post<any>(`${this.resourceUrl}/search`, searchRequest);
}

getStudents(){
 this.studentService.search(0, 100, 'id', 'ASC', { 'profileType.equals': "STUDENT" }).subscribe({
          next: (res: any) => {
            this.students.set(res.content);
            this.students().forEach((student:IProfileConfig)=>{
              this.currentAttendence.push({ studentName: student.fullName, studentId: student.userId, status: 'PRESENT' })
            })
          },
  });
}

getReports<T>(page: number = 0, size: number = 10, sortBy: string = 'id', 
    sortDirection: string = 'ASC', filters: any = {}): Observable<any> {

      const searchRequest = {
      page: page,
      size: size,
      sortBy: sortBy,
      sortDirection: sortDirection,
      filters: filters
      };

    return this.http.post<any>(`${this.resourceUrl}/report`, searchRequest);
}
  //  query(req?: any): Observable<HttpResponse<AttendanceStatus[]>> {
  //     const options = createRequestOption(req);
  //     return this.http.get<AttendanceStatus[]>(this.resourceUrl, { params: options, observe: 'response' });
  //   }

}


