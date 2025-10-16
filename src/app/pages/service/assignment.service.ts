import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { Assignment, AssignmentSubmission } from '../models/assignment.model';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class AssignmentService {
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/assignments');
    protected studentService = inject(UserService);

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

    create(attendence: Assignment | any) {
        return this.http.post<Assignment>(this.resourceUrl, attendence, { observe: 'response' });
    }

    getGroupedAssignments<T>(page: number = 0, size: number = 10, sortBy: string = 'id', sortDirection: string = 'ASC', filters: any = {}): Observable<any> {
        const searchRequest = {
            page: page,
            size: size,
            sortBy: sortBy,
            sortDirection: sortDirection,
            filters: filters
        };

        return this.http.post<any>(`${this.resourceUrl}/grouped-assignments`, searchRequest);
    }

    createSubmission(submission: AssignmentSubmission): Observable<AssignmentSubmission> {
        let url = `${this.resourceUrl}/submissions` + (submission.id ? `/${submission.id}` : '');
        return this.http.post<AssignmentSubmission>(url, submission);
    }

    searchSubmission<T>(searchRequest): Observable<any> {
        return this.http.post<any>(`${this.resourceUrl}/submissions/search`, searchRequest);
    }

    delete(id: string): Observable<HttpResponse<{}>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }
}
