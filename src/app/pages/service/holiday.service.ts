import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { Holiday, HolidayDTO } from '../models/holiday.model';
import { PageResponse } from './staff-attendance.service';

@Injectable({ providedIn: 'root' })
export class HolidayService {
    private http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/holidays');
    create(dto: HolidayDTO): Observable<Holiday> {
        return this.http.post<Holiday>(this.resourceUrl, dto);
    }

    getById(id: string): Observable<Holiday> {
        return this.http.get<Holiday>(`${this.resourceUrl}/${id}`);
    }

    update(id: string, dto: HolidayDTO): Observable<Holiday> {
        return this.http.put<Holiday>(`${this.resourceUrl}/${id}`, dto);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.resourceUrl}/${id}`);
    }

    search(request: any): Observable<PageResponse<Holiday>> {
        return this.http.post<PageResponse<Holiday>>(`${this.resourceUrl}/search`, request);
    }

    getForCalendar(monthStart: string, monthEnd: string): Observable<Holiday[]> {
        const params = new HttpParams().set('monthStart', monthStart).set('monthEnd', monthEnd);
        return this.http.get<Holiday[]>(`${this.resourceUrl}/calendar`, { params });
    }

    submit(id: string): Observable<Holiday> {
        return this.http.post<Holiday>(`${this.resourceUrl}/${id}/submit`, {});
    }

    approve(id: string): Observable<Holiday> {
        return this.http.post<Holiday>(`${this.resourceUrl}/${id}/approve`, {});
    }

    reject(id: string, reason: string): Observable<Holiday> {
        return this.http.post<Holiday>(`${this.resourceUrl}/${id}/reject`, { reason });
    }

    retract(id: string): Observable<Holiday> {
        return this.http.post<Holiday>(`${this.resourceUrl}/${id}/retract`, {});
    }
}
