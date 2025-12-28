import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import dayjs from 'dayjs/esm';
import { environment } from '../../../environments/environment';
import { DATE_FORMAT } from '../../core/model/constants';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { isPresent } from '../../core/services/operators';
import { createRequestOption } from '../../core/services/request-util';
import { ITenant, NewTenant } from '../models/tenant.model';

export type PartialUpdateTenant = Partial<ITenant> & Pick<ITenant, 'id'>;

type RestOf<T extends ITenant | NewTenant> = Omit<T, 'estDate' | 'createdAt' | 'updatedAt'> & {
    estDate?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
};

export type RestTenant = RestOf<ITenant>;

export type NewRestTenant = RestOf<NewTenant>;

export type PartialUpdateRestTenant = RestOf<PartialUpdateTenant>;

export type EntityResponseType = HttpResponse<ITenant>;
export type EntityArrayResponseType = HttpResponse<ITenant[]>;

@Injectable({ providedIn: 'root' })
export class TenantService {
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/tenants');

    create(tenant: ITenant): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(tenant);
        return this.http.post<RestTenant>(this.resourceUrl, copy, { observe: 'response' }).pipe(map((res) => this.convertResponseFromServer(res)));
    }

    update(tenant: ITenant): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(tenant);
        return this.http.put<RestTenant>(`${this.resourceUrl}/${this.getTenantIdentifier(tenant)}`, copy, { observe: 'response' }).pipe(map((res) => this.convertResponseFromServer(res)));
    }

    partialUpdate(tenant: PartialUpdateTenant): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(tenant);
        return this.http.patch<RestTenant>(`${this.resourceUrl}/${this.getTenantIdentifier(tenant)}`, copy, { observe: 'response' }).pipe(map((res) => this.convertResponseFromServer(res)));
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http.get<RestTenant>(`${this.resourceUrl}/${id}`, { observe: 'response' }).pipe(map((res) => this.convertResponseFromServer(res)));
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);
        return this.http.get<RestTenant[]>(this.resourceUrl, { params: options, observe: 'response' }).pipe(map((res) => this.convertResponseArrayFromServer(res)));
    }

    delete(id: number): Observable<HttpResponse<{}>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    getTenantIdentifier(tenant: Pick<ITenant, 'id'>): number {
        return tenant.id;
    }

    compareTenant(o1: Pick<ITenant, 'id'> | null, o2: Pick<ITenant, 'id'> | null): boolean {
        return o1 && o2 ? this.getTenantIdentifier(o1) === this.getTenantIdentifier(o2) : o1 === o2;
    }

    addTenantToCollectionIfMissing<Type extends Pick<ITenant, 'id'>>(tenantCollection: Type[], ...tenantsToCheck: (Type | null | undefined)[]): Type[] {
        const tenants: Type[] = tenantsToCheck.filter(isPresent);
        if (tenants.length > 0) {
            const tenantCollectionIdentifiers = tenantCollection.map((tenantItem) => this.getTenantIdentifier(tenantItem));
            const tenantsToAdd = tenants.filter((tenantItem) => {
                const tenantIdentifier = this.getTenantIdentifier(tenantItem);
                if (tenantCollectionIdentifiers.includes(tenantIdentifier)) {
                    return false;
                }
                tenantCollectionIdentifiers.push(tenantIdentifier);
                return true;
            });
            return [...tenantsToAdd, ...tenantCollection];
        }
        return tenantCollection;
    }

    protected convertDateFromClient<T extends ITenant | NewTenant | PartialUpdateTenant>(tenant: T): RestOf<T> {
        return {
            ...tenant,
            estDate: tenant.estDate?.format(DATE_FORMAT) ?? null,
            createdAt: tenant.createdAt?.toJSON() ?? null,
            updatedAt: tenant.updatedAt?.toJSON() ?? null
        };
    }

    protected convertDateFromServer(restTenant: RestTenant): ITenant {
        return {
            ...restTenant,
            estDate: restTenant.estDate ? dayjs(restTenant.estDate) : undefined,
            createdAt: restTenant.createdAt ? dayjs(restTenant.createdAt) : undefined,
            updatedAt: restTenant.updatedAt ? dayjs(restTenant.updatedAt) : undefined
        };
    }

    protected convertResponseFromServer(res: HttpResponse<RestTenant>): HttpResponse<ITenant> {
        return res.clone({
            body: res.body ? this.convertDateFromServer(res.body) : null
        });
    }

    protected convertResponseArrayFromServer(res: HttpResponse<RestTenant[]>): HttpResponse<ITenant[]> {
        return res.clone({
            body: res.body ? res.body.map((item) => this.convertDateFromServer(item)) : null
        });
    }
}
