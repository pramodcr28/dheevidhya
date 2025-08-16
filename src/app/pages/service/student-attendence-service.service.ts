import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { Observable } from 'rxjs';
import { AttendanceRequest } from '../models/attendence.model';
import { UserService } from './user.service';


@Injectable({
  providedIn: 'root'
})
export class StudentAttendenceServiceService {

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

 create(attendence: AttendanceRequest) {
    return this.http.post<AttendanceRequest>(this.resourceUrl, attendence, { observe: 'response' });
  }

getStudents(){
    return  this.studentService.search(0, 100, 'id', 'ASC', { 'profileType.equals': "STUDENT" });
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

}


