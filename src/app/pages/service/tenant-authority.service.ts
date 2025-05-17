import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { isPresent } from '../../core/services/operators';
import { createRequestOption } from '../../core/services/request-util';
import { ITenantAuthority, NewTenantAuthority } from '../models/user.model';
import { environment } from '../../../environments/environment';

export type EntityResponseType = HttpResponse<ITenantAuthority>;
export type EntityArrayResponseType = HttpResponse<ITenantAuthority[]>;

@Injectable({ providedIn: 'root' })
export class TenantAuthorityService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = environment.ServerUrl + this.applicationConfigService.getEndpointFor('api/tenant-authorities');

  create(tenantAuthority: NewTenantAuthority): Observable<EntityResponseType> {
    return this.http.post<ITenantAuthority>(this.resourceUrl, tenantAuthority, { observe: 'response' });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<ITenantAuthority>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<ITenantAuthority[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getTenantAuthorityIdentifier(tenantAuthority: Pick<ITenantAuthority, 'name'>): string {
    return tenantAuthority.name;
  }

  compareTenantAuthority(o1: Pick<ITenantAuthority, 'name'> | null, o2: Pick<ITenantAuthority, 'name'> | null): boolean {
    return o1 && o2 ? this.getTenantAuthorityIdentifier(o1) === this.getTenantAuthorityIdentifier(o2) : o1 === o2;
  }

  addTenantAuthorityToCollectionIfMissing<Type extends Pick<ITenantAuthority, 'name'>>(
    tenantAuthorityCollection: Type[],
    ...tenantAuthoritiesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const tenantAuthorities: Type[] = tenantAuthoritiesToCheck.filter(isPresent);
    if (tenantAuthorities.length > 0) {
      const tenantAuthorityCollectionIdentifiers = tenantAuthorityCollection.map(tenantAuthorityItem =>
        this.getTenantAuthorityIdentifier(tenantAuthorityItem),
      );
      const tenantAuthoritiesToAdd = tenantAuthorities.filter(tenantAuthorityItem => {
        const tenantAuthorityIdentifier = this.getTenantAuthorityIdentifier(tenantAuthorityItem);
        if (tenantAuthorityCollectionIdentifiers.includes(tenantAuthorityIdentifier)) {
          return false;
        }
        tenantAuthorityCollectionIdentifiers.push(tenantAuthorityIdentifier);
        return true;
      });
      return [...tenantAuthoritiesToAdd, ...tenantAuthorityCollection];
    }
    return tenantAuthorityCollection;
  }
}
