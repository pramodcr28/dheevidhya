import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { Notice } from './../models/notification.model';
import { UserService } from './user.service';
@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/notices');
    protected studentService = inject(UserService);

    search<T>(page: number = 0, size: number = 100, sortBy: string = 'id', sortDirection: string = 'ASC', filters: any = {}): Observable<any> {
        const searchRequest = {
            page: page,
            size: size,
            sortBy: sortBy,
            sortDirection: sortDirection,
            filters: filters
        };

        return this.http.post<any>(`${this.resourceUrl}/search`, searchRequest);
    }

    create(attendence: Notice) {
        return this.http.post<Notice>(this.resourceUrl, attendence, { observe: 'response' });
    }
}
