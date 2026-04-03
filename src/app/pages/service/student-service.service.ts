import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IStudent, NewStudent } from '../models/student.model';

export type EntityResponseType = HttpResponse<IStudent>;
export type EntityArrayResponseType = HttpResponse<IStudent[]>;

export interface StudentSearchRequest {
    page: number;
    size: number;
    sortBy: string;
    sortDirection: 'ASC' | 'DESC';
    filters: Record<string, any>;
}

@Injectable({
    providedIn: 'root'
})
export class StudentServiceService {
    protected readonly http = inject(HttpClient);

    protected resourceUrl = `${environment.ServerUrl}${environment.UAA_BASE_URL}students`;

    create(student: NewStudent): Observable<EntityResponseType> {
        return this.http.post<IStudent>(this.resourceUrl, student, { observe: 'response' });
    }

    update(student: IStudent): Observable<EntityResponseType> {
        return this.http.put<IStudent>(`${this.resourceUrl}/${student.id}`, student, { observe: 'response' });
    }

    find(id: string): Observable<EntityResponseType> {
        return this.http.get<IStudent>(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    delete(id: string): Observable<HttpResponse<{}>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    search(request: StudentSearchRequest): Observable<any> {
        return this.http.post<any>(`${this.resourceUrl}/search`, request);
    }
}
