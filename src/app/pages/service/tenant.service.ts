import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { isPresent } from '../../core/services/operators';
import { createRequestOption } from '../../core/services/request-util';
import { ITenant } from '../models/tenant.model';

// export type PartialUpdateTenant = Partial<ITenant> & Pick<ITenant, 'id'>;

// export type NewTenant = Omit<ITenant, 'id'> & { id: null };

@Injectable({ providedIn: 'root' })
export class TenantService {
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/tenants');

    create(tenant: ITenant): Observable<any> {
        // const copy = this.convertDateFromClient();
        return this.http.post<any>(this.resourceUrl, tenant, { observe: 'response' });
    }

    update(tenant: ITenant): Observable<any> {
        // const copy = this.convertDateFromClient(tenant);
        return this.http.put<any>(`${this.resourceUrl}/${this.getTenantIdentifier(tenant)}`, tenant, { observe: 'response' });
    }

    partialUpdate(tenant: any): Observable<any> {
        // const copy = this.convertDateFromClient(tenant);
        return this.http.patch<any>(`${this.resourceUrl}/${this.getTenantIdentifier(tenant)}`, tenant, { observe: 'response' });
    }

    find(id: number): Observable<any> {
        return this.http.get<any>(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    query(req?: any): Observable<any> {
        const options = createRequestOption(req);
        return this.http.get<any[]>(this.resourceUrl, { params: options, observe: 'response' });
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

    // protected convertResponseFromServer(res: HttpResponse<RestTenant>): HttpResponse<ITenant> {
    //     return res.clone({
    //         body: res.body ? res.body. : null
    //     });
    // }

    // protected convertResponseArrayFromServer(res: HttpResponse<RestTenant[]>): HttpResponse<ITenant[]> {
    //     return res.clone({
    //         body: res.body ? res.body.map((item) => this.convertDateFromServer(item)) : null
    //     });
    // }
}
