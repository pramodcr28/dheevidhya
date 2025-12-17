import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IMasterSubject, NewMasterSubject } from '../../pages/models/org.model';
import { ApplicationConfigService } from './application-config.service';
import { isPresent } from './operators';
import { createRequestOption } from './request-util';

export type PartialUpdateMasterSubject = Partial<IMasterSubject> & Pick<IMasterSubject, 'id'>;

export type EntityResponseType = HttpResponse<IMasterSubject>;
export type EntityArrayResponseType = HttpResponse<IMasterSubject[]>;

@Injectable({ providedIn: 'root' })
export class MasterSubjectService {
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/master-subjects');

    create(masterSubject: NewMasterSubject): Observable<EntityResponseType> {
        return this.http.post<IMasterSubject>(this.resourceUrl, masterSubject, { observe: 'response' });
    }

    update(masterSubject: IMasterSubject): Observable<EntityResponseType> {
        return this.http.put<IMasterSubject>(`${this.resourceUrl}/${this.getMasterSubjectIdentifier(masterSubject)}`, masterSubject, {
            observe: 'response'
        });
    }

    partialUpdate(masterSubject: PartialUpdateMasterSubject): Observable<EntityResponseType> {
        return this.http.patch<IMasterSubject>(`${this.resourceUrl}/${this.getMasterSubjectIdentifier(masterSubject)}`, masterSubject, {
            observe: 'response'
        });
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http.get<IMasterSubject>(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);
        return this.http.get<IMasterSubject[]>(this.resourceUrl, { params: options, observe: 'response' });
    }

    delete(id: number): Observable<HttpResponse<{}>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    getMasterSubjectIdentifier(masterSubject: Pick<IMasterSubject, 'id'>): any {
        return masterSubject.id;
    }

    compareMasterSubject(o1: Pick<IMasterSubject, 'id'> | null, o2: Pick<IMasterSubject, 'id'> | null): boolean {
        return o1 && o2 ? this.getMasterSubjectIdentifier(o1) === this.getMasterSubjectIdentifier(o2) : o1 === o2;
    }

    addMasterSubjectToCollectionIfMissing<Type extends Pick<IMasterSubject, 'id'>>(masterSubjectCollection: Type[], ...masterSubjectsToCheck: (Type | null | undefined)[]): Type[] {
        const masterSubjects: Type[] = masterSubjectsToCheck.filter(isPresent);
        if (masterSubjects.length > 0) {
            const masterSubjectCollectionIdentifiers = masterSubjectCollection.map((masterSubjectItem) => this.getMasterSubjectIdentifier(masterSubjectItem));
            const masterSubjectsToAdd = masterSubjects.filter((masterSubjectItem) => {
                const masterSubjectIdentifier = this.getMasterSubjectIdentifier(masterSubjectItem);
                if (masterSubjectCollectionIdentifiers.includes(masterSubjectIdentifier)) {
                    return false;
                }
                masterSubjectCollectionIdentifiers.push(masterSubjectIdentifier);
                return true;
            });
            return [...masterSubjectsToAdd, ...masterSubjectCollection];
        }
        return masterSubjectCollection;
    }
}
