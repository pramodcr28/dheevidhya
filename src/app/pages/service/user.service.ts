import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApplicationConfigService } from '../../core/services/application-config.service';
// import { EntityResponseType } from '../../core/services/common.service';
import dayjs from 'dayjs/esm';
import { environment } from '../../../environments/environment';
import { isPresent } from '../../core/services/operators';
import { createRequestOption } from '../../core/services/request-util';
import { ITenantUser, NewTenantUser } from '../models/user.model';

export type PartialUpdateTenantUser = Partial<ITenantUser> & Pick<ITenantUser, 'id'>;

type RestOf<T extends ITenantUser | NewTenantUser> = Omit<T, 'resetDate'> & {
    resetDate?: string | null;
};

export type RestTenantUser = RestOf<ITenantUser>;

export type NewRestTenantUser = RestOf<NewTenantUser>;

export type PartialUpdateRestTenantUser = RestOf<PartialUpdateTenantUser>;

export type EntityResponseType = HttpResponse<ITenantUser>;
export type EntityArrayResponseType = HttpResponse<ITenantUser[]>;

@Injectable({
    providedIn: 'root'
})
export class UserService {
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected userResourceUrl: any = environment.ServerUrl + environment.UAA_BASE_URL + this.applicationConfigService.getEndpointFor('users');
    protected authorityResourceUrl = environment.ServerUrl + environment.UAA_BASE_URL + this.applicationConfigService.getEndpointFor('authorities');
    private bulkUploadUrl = environment.ServerUrl + environment.UAA_BASE_URL + 'bulk-upload';
    create(user: any): Observable<EntityResponseType> {
        // const copy = this.convertDateFromClient(tenantUser);
        return this.http.post<RestTenantUser>(this.userResourceUrl, user, { observe: 'response' }).pipe(map((res) => this.convertResponseFromServer(res)));
    }

    update(tenantUser: ITenantUser): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(tenantUser);
        return this.http.put<RestTenantUser>(`${this.userResourceUrl}/${this.getTenantUserIdentifier(tenantUser)}`, copy, { observe: 'response' }).pipe(map((res) => this.convertResponseFromServer(res)));
    }

    partialUpdate(tenantUser: PartialUpdateTenantUser): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(tenantUser);
        return this.http.patch<RestTenantUser>(`${this.userResourceUrl}/${this.getTenantUserIdentifier(tenantUser)}`, copy, { observe: 'response' }).pipe(map((res) => this.convertResponseFromServer(res)));
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http.get<RestTenantUser>(`${this.userResourceUrl}/${id}`, { observe: 'response' }).pipe(map((res) => this.convertResponseFromServer(res)));
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);
        return this.http.get<RestTenantUser[]>(this.userResourceUrl, { params: options, observe: 'response' }).pipe(map((res) => this.convertResponseArrayFromServer(res)));
    }

    getAuthorities(): Observable<HttpResponse<[]>> {
        const options = createRequestOption(null);
        return this.http.get<[]>(this.authorityResourceUrl, { params: options, observe: 'response' });
    }

    delete(id: number, gardianId: number): Observable<HttpResponse<{}>> {
        if (gardianId) return this.http.delete(`${this.userResourceUrl}/${id}/guardian/${gardianId}`, { observe: 'response' });
        else return this.http.delete(`${this.userResourceUrl}/${id}`, { observe: 'response' });
    }

    getTenantUserIdentifier(tenantUser: Pick<ITenantUser, 'id'>): number {
        return tenantUser.id;
    }

    compareTenantUser(o1: Pick<ITenantUser, 'id'> | null, o2: Pick<ITenantUser, 'id'> | null): boolean {
        return o1 && o2 ? this.getTenantUserIdentifier(o1) === this.getTenantUserIdentifier(o2) : o1 === o2;
    }

    addTenantUserToCollectionIfMissing<Type extends Pick<ITenantUser, 'id'>>(tenantUserCollection: Type[], ...tenantUsersToCheck: (Type | null | undefined)[]): Type[] {
        const tenantUsers: Type[] = tenantUsersToCheck.filter(isPresent);
        if (tenantUsers.length > 0) {
            const tenantUserCollectionIdentifiers = tenantUserCollection.map((tenantUserItem) => this.getTenantUserIdentifier(tenantUserItem));
            const tenantUsersToAdd = tenantUsers.filter((tenantUserItem) => {
                const tenantUserIdentifier = this.getTenantUserIdentifier(tenantUserItem);
                if (tenantUserCollectionIdentifiers.includes(tenantUserIdentifier)) {
                    return false;
                }
                tenantUserCollectionIdentifiers.push(tenantUserIdentifier);
                return true;
            });
            return [...tenantUsersToAdd, ...tenantUserCollection];
        }
        return tenantUserCollection;
    }

    protected convertDateFromClient<T extends ITenantUser | NewTenantUser | PartialUpdateTenantUser>(tenantUser: T): RestOf<T> {
        return {
            ...tenantUser,
            resetDate: tenantUser.resetDate?.toJSON() ?? null
        };
    }

    protected convertDateFromServer(restTenantUser: RestTenantUser): ITenantUser {
        return {
            ...restTenantUser,
            resetDate: restTenantUser.resetDate ? dayjs(restTenantUser.resetDate) : undefined
        };
    }

    protected convertResponseFromServer(res: HttpResponse<RestTenantUser>): HttpResponse<ITenantUser> {
        return res.clone({
            body: res.body ? this.convertDateFromServer(res.body) : null
        });
    }

    protected convertResponseArrayFromServer(res: HttpResponse<RestTenantUser[]>): HttpResponse<ITenantUser[]> {
        return res.clone({
            body: res.body ? res.body.map((item) => this.convertDateFromServer(item)) : null
        });
    }

    search<T>(page: number = 0, size: number = 10, sortBy: string = 'id', sortDirection: string = 'ASC', filters: any = {}): Observable<any> {
        const searchRequest = {
            page: page,
            size: size,
            sortBy: sortBy,
            sortDirection: sortDirection,
            filters: filters
        };

        return this.http.post<any>(`${environment.ServerUrl + environment.UAA_BASE_URL}api/profile-configs/search`, searchRequest);
    }

    bulkCreateStudents(payload: any): Observable<any> {
        console.log('payload', payload);
        return this.http.post(`${this.bulkUploadUrl}/students`, payload);
    }
}
