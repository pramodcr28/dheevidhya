import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IMasterSection, NewMasterSection } from '../../pages/models/org.model';
import { ApplicationConfigService } from './application-config.service';
import { isPresent } from './operators';
import { createRequestOption } from './request-util';

export type PartialUpdateMasterSection = Partial<IMasterSection> & Pick<IMasterSection, 'id'>;

export type EntityResponseType = HttpResponse<IMasterSection>;
export type EntityArrayResponseType = HttpResponse<IMasterSection[]>;

@Injectable({ providedIn: 'root' })
export class MasterSectionService {
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/master-sections');

    create(masterSection: NewMasterSection): Observable<EntityResponseType> {
        return this.http.post<IMasterSection>(this.resourceUrl, masterSection, { observe: 'response' });
    }

    update(masterSection: IMasterSection): Observable<EntityResponseType> {
        return this.http.put<IMasterSection>(`${this.resourceUrl}/${this.getMasterSectionIdentifier(masterSection)}`, masterSection, {
            observe: 'response'
        });
    }

    partialUpdate(masterSection: PartialUpdateMasterSection): Observable<EntityResponseType> {
        return this.http.patch<IMasterSection>(`${this.resourceUrl}/${this.getMasterSectionIdentifier(masterSection)}`, masterSection, {
            observe: 'response'
        });
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http.get<IMasterSection>(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);
        return this.http.get<IMasterSection[]>(this.resourceUrl, { params: options, observe: 'response' });
    }

    delete(id: number): Observable<HttpResponse<{}>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    getMasterSectionIdentifier(masterSection: Pick<IMasterSection, 'id'>): number {
        return masterSection.id;
    }

    compareMasterSection(o1: Pick<IMasterSection, 'id'> | null, o2: Pick<IMasterSection, 'id'> | null): boolean {
        return o1 && o2 ? this.getMasterSectionIdentifier(o1) === this.getMasterSectionIdentifier(o2) : o1 === o2;
    }

    addMasterSectionToCollectionIfMissing<Type extends Pick<IMasterSection, 'id'>>(masterSectionCollection: Type[], ...masterSectionsToCheck: (Type | null | undefined)[]): Type[] {
        const masterSections: Type[] = masterSectionsToCheck.filter(isPresent);
        if (masterSections.length > 0) {
            const masterSectionCollectionIdentifiers = masterSectionCollection.map((masterSectionItem) => this.getMasterSectionIdentifier(masterSectionItem));
            const masterSectionsToAdd = masterSections.filter((masterSectionItem) => {
                const masterSectionIdentifier = this.getMasterSectionIdentifier(masterSectionItem);
                if (masterSectionCollectionIdentifiers.includes(masterSectionIdentifier)) {
                    return false;
                }
                masterSectionCollectionIdentifiers.push(masterSectionIdentifier);
                return true;
            });
            return [...masterSectionsToAdd, ...masterSectionCollection];
        }
        return masterSectionCollection;
    }
}
