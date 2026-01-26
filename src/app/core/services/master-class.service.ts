import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IMasterClass, NewMasterClass } from '../../pages/models/org.model';
import { ApplicationConfigService } from './application-config.service';
import { isPresent } from './operators';
import { createRequestOption } from './request-util';

export type PartialUpdateMasterClass = Partial<IMasterClass> & Pick<IMasterClass, 'id'>;

export type EntityResponseType = HttpResponse<IMasterClass>;
export type EntityArrayResponseType = HttpResponse<IMasterClass[]>;

@Injectable({ providedIn: 'root' })
export class MasterClassService {
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/master-classes');

    create(masterClass: NewMasterClass): Observable<EntityResponseType> {
        return this.http.post<IMasterClass>(this.resourceUrl, masterClass, { observe: 'response' });
    }

    update(masterClass: IMasterClass): Observable<EntityResponseType> {
        return this.http.put<IMasterClass>(`${this.resourceUrl}/${this.getMasterClassIdentifier(masterClass)}`, masterClass, {
            observe: 'response'
        });
    }

    partialUpdate(masterClass: PartialUpdateMasterClass): Observable<EntityResponseType> {
        return this.http.patch<IMasterClass>(`${this.resourceUrl}/${this.getMasterClassIdentifier(masterClass)}`, masterClass, {
            observe: 'response'
        });
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http.get<IMasterClass>(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);
        return this.http.get<IMasterClass[]>(this.resourceUrl, { params: options, observe: 'response' });
    }

    delete(id: number): Observable<HttpResponse<{}>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    getMasterClassIdentifier(masterClass: Pick<IMasterClass, 'id'>): number {
        return masterClass.id;
    }

    compareMasterClass(o1: Pick<IMasterClass, 'id'> | null, o2: Pick<IMasterClass, 'id'> | null): boolean {
        return o1 && o2 ? this.getMasterClassIdentifier(o1) === this.getMasterClassIdentifier(o2) : o1 === o2;
    }

    addMasterClassToCollectionIfMissing<Type extends Pick<IMasterClass, 'id'>>(masterClassCollection: Type[], ...masterClassesToCheck: (Type | null | undefined)[]): Type[] {
        const masterClasses: Type[] = masterClassesToCheck.filter(isPresent);
        if (masterClasses.length > 0) {
            const masterClassCollectionIdentifiers = masterClassCollection.map((masterClassItem) => this.getMasterClassIdentifier(masterClassItem));
            const masterClassesToAdd = masterClasses.filter((masterClassItem) => {
                const masterClassIdentifier = this.getMasterClassIdentifier(masterClassItem);
                if (masterClassCollectionIdentifiers.includes(masterClassIdentifier)) {
                    return false;
                }
                masterClassCollectionIdentifiers.push(masterClassIdentifier);
                return true;
            });
            return [...masterClassesToAdd, ...masterClassCollection];
        }
        return masterClassCollection;
    }
}
