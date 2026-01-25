import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IMasterDepartment, NewMasterDepartment } from '../../pages/models/org.model';
import { ApplicationConfigService } from './application-config.service';
import { isPresent } from './operators';
import { createRequestOption } from './request-util';

export type PartialUpdateMasterDepartment = Partial<IMasterDepartment> & Pick<IMasterDepartment, 'id'>;

export type EntityResponseType = HttpResponse<IMasterDepartment>;
export type EntityArrayResponseType = HttpResponse<IMasterDepartment[]>;

@Injectable({ providedIn: 'root' })
export class MasterDepartmentService {
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/master-departments');

    create(masterDepartment: NewMasterDepartment): Observable<EntityResponseType> {
        return this.http.post<IMasterDepartment>(this.resourceUrl, masterDepartment, { observe: 'response' });
    }

    update(masterDepartment: IMasterDepartment): Observable<EntityResponseType> {
        return this.http.put<IMasterDepartment>(`${this.resourceUrl}/${this.getMasterDepartmentIdentifier(masterDepartment)}`, masterDepartment, { observe: 'response' });
    }

    partialUpdate(masterDepartment: PartialUpdateMasterDepartment): Observable<EntityResponseType> {
        return this.http.patch<IMasterDepartment>(`${this.resourceUrl}/${this.getMasterDepartmentIdentifier(masterDepartment)}`, masterDepartment, { observe: 'response' });
    }

    find(id: any): Observable<EntityResponseType> {
        return this.http.get<IMasterDepartment>(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);
        return this.http.get<IMasterDepartment[]>(this.resourceUrl, { params: options, observe: 'response' });
    }

    delete(id: number): Observable<HttpResponse<{}>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    getMasterDepartmentIdentifier(masterDepartment: Pick<IMasterDepartment, 'id'>): number {
        return masterDepartment.id;
    }

    compareMasterDepartment(o1: Pick<IMasterDepartment, 'id'> | null, o2: Pick<IMasterDepartment, 'id'> | null): boolean {
        return o1 && o2 ? this.getMasterDepartmentIdentifier(o1) === this.getMasterDepartmentIdentifier(o2) : o1 === o2;
    }

    addMasterDepartmentToCollectionIfMissing<Type extends Pick<IMasterDepartment, 'id'>>(masterDepartmentCollection: Type[], ...masterDepartmentsToCheck: (Type | null | undefined)[]): Type[] {
        const masterDepartments: Type[] = masterDepartmentsToCheck.filter(isPresent);
        if (masterDepartments.length > 0) {
            const masterDepartmentCollectionIdentifiers = masterDepartmentCollection.map((masterDepartmentItem) => this.getMasterDepartmentIdentifier(masterDepartmentItem));
            const masterDepartmentsToAdd = masterDepartments.filter((masterDepartmentItem) => {
                const masterDepartmentIdentifier = this.getMasterDepartmentIdentifier(masterDepartmentItem);
                if (masterDepartmentCollectionIdentifiers.includes(masterDepartmentIdentifier)) {
                    return false;
                }
                masterDepartmentCollectionIdentifiers.push(masterDepartmentIdentifier);
                return true;
            });
            return [...masterDepartmentsToAdd, ...masterDepartmentCollection];
        }
        return masterDepartmentCollection;
    }
}
