import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/model/common.model';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { ExaminationDTO } from '../models/examination.model';

@Injectable({
    providedIn: 'root'
})
export class ExaminationService {
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/exams');
    examResultUrl: any = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/exam-results');

    create(exam: ExaminationDTO) {
        return this.http.post<ApiResponse>(this.resourceUrl, exam, { observe: 'response' });
    }

    update(exam: ExaminationDTO) {
        return this.http.put<ApiResponse>(this.resourceUrl + '/' + exam.examId, exam, { observe: 'response' });
    }

    find(id: any): Observable<any> {
        return this.http.get<ExaminationDTO>(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    search<T>(page: number = 0, size: number = 10, sortBy: string = 'id', sortDirection: string = 'ASC', filters: any = {}): Observable<any> {
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

    getReports(searchRequest: any): Observable<any[]> {
        return this.http.post<any[]>(`${this.examResultUrl}/get-report`, searchRequest);
    }

    saveResults(payload: any): Observable<any> {
        return this.http.post<any>(`${this.examResultUrl}/save-result`, payload);
    }
}
