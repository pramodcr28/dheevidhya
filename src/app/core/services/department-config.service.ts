import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import dayjs from 'dayjs/esm';
import { environment } from '../../../environments/environment';
import { IDepartmentConfig, NewDepartmentConfig } from '../../pages/models/org.model';
import { ApplicationConfigService } from './application-config.service';
import { isPresent } from './operators';
import { createRequestOption } from './request-util';


export type PartialUpdateDepartmentConfig = Partial<IDepartmentConfig> & Pick<IDepartmentConfig, 'id'>;

type RestOf<T extends IDepartmentConfig | NewDepartmentConfig> = Omit<T, 'academicStart' | 'academicEnd'> & {
  academicStart?: string | null;
  academicEnd?: string | null;
};

export type RestDepartmentConfig = RestOf<IDepartmentConfig>;

export type NewRestDepartmentConfig = RestOf<NewDepartmentConfig>;

export type PartialUpdateRestDepartmentConfig = RestOf<PartialUpdateDepartmentConfig>;

export type EntityResponseType = HttpResponse<IDepartmentConfig>;
export type EntityArrayResponseType = HttpResponse<IDepartmentConfig[]>;

@Injectable({ providedIn: 'root' })
export class DepartmentConfigService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor( environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/department-configs');

  create(departmentConfig: NewDepartmentConfig): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(departmentConfig);
    return this.http
      .post<RestDepartmentConfig>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(departmentConfig: IDepartmentConfig): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(departmentConfig);
    return this.http
      .put<RestDepartmentConfig>(`${this.resourceUrl}/${this.getDepartmentConfigIdentifier(departmentConfig)}`, copy, {
        observe: 'response',
      })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(departmentConfig: PartialUpdateDepartmentConfig): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(departmentConfig);
    return this.http
      .patch<RestDepartmentConfig>(`${this.resourceUrl}/${this.getDepartmentConfigIdentifier(departmentConfig)}`, copy, {
        observe: 'response',
      })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestDepartmentConfig>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
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

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestDepartmentConfig[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getDepartmentConfigIdentifier(departmentConfig: Pick<IDepartmentConfig, 'id'>): string {
    return departmentConfig.id;
  }

  compareDepartmentConfig(o1: Pick<IDepartmentConfig, 'id'> | null, o2: Pick<IDepartmentConfig, 'id'> | null): boolean {
    return o1 && o2 ? this.getDepartmentConfigIdentifier(o1) === this.getDepartmentConfigIdentifier(o2) : o1 === o2;
  }

  addDepartmentConfigToCollectionIfMissing<Type extends Pick<IDepartmentConfig, 'id'>>(
    departmentConfigCollection: Type[],
    ...departmentConfigsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const departmentConfigs: Type[] = departmentConfigsToCheck.filter(isPresent);
    if (departmentConfigs.length > 0) {
      const departmentConfigCollectionIdentifiers = departmentConfigCollection.map(departmentConfigItem =>
        this.getDepartmentConfigIdentifier(departmentConfigItem),
      );
      const departmentConfigsToAdd = departmentConfigs.filter(departmentConfigItem => {
        const departmentConfigIdentifier = this.getDepartmentConfigIdentifier(departmentConfigItem);
        if (departmentConfigCollectionIdentifiers.includes(departmentConfigIdentifier)) {
          return false;
        }
        departmentConfigCollectionIdentifiers.push(departmentConfigIdentifier);
        return true;
      });
      return [...departmentConfigsToAdd, ...departmentConfigCollection];
    }
    return departmentConfigCollection;
  }

  protected convertDateFromClient<T extends IDepartmentConfig | NewDepartmentConfig | PartialUpdateDepartmentConfig>(
    departmentConfig: T,
  ): RestOf<T> {
    return {
      ...departmentConfig,
      academicStart: departmentConfig.academicStart?.toJSON() ?? null,
      academicEnd: departmentConfig.academicEnd?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restDepartmentConfig: RestDepartmentConfig): IDepartmentConfig {
    return {
      ...restDepartmentConfig,
      academicStart: restDepartmentConfig.academicStart ? dayjs(restDepartmentConfig.academicStart) : undefined,
      academicEnd: restDepartmentConfig.academicEnd ? dayjs(restDepartmentConfig.academicEnd) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestDepartmentConfig>): HttpResponse<IDepartmentConfig> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestDepartmentConfig[]>): HttpResponse<IDepartmentConfig[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
