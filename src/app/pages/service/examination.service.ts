import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { ExaminationDTO } from '../models/examination.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExaminationService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ADMIN_BASE_URL +'api/exams');
  examResultUrl: any = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ADMIN_BASE_URL +'api/exam-results');

   create(attendence: ExaminationDTO) {
      return this.http.post<ExaminationDTO>(this.resourceUrl, attendence, { observe: 'response' });
    }

     find(id: any): Observable<any> {
        return this.http.get<ExaminationDTO>(`${this.resourceUrl}/${id}`, { observe: 'response' });
      }
 
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

getResults(searchRequest: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.examResultUrl}/get-result`, searchRequest);
  }

  saveResults(payload: any): Observable<any> {
    return this.http.post<any>(`${this.examResultUrl}/save-result`, payload);
  }

}
