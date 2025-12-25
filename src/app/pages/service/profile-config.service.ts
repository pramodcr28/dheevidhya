import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { isPresent } from '../../core/services/operators';
import { createRequestOption } from '../../core/services/request-util';
import { IProfileConfig, NewProfileConfig } from '../models/user.model';

export type PartialUpdateProfileConfig = Partial<IProfileConfig> & Pick<IProfileConfig, 'id'>;

export type EntityResponseType = HttpResponse<IProfileConfig>;
export type EntityArrayResponseType = HttpResponse<IProfileConfig[]>;

@Injectable({ providedIn: 'root' })
export class ProfileConfigService {
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.UAA_BASE_URL + 'profile-configs');

    create(profileConfig: NewProfileConfig): Observable<EntityResponseType> {
        return this.http.post<IProfileConfig>(this.resourceUrl, profileConfig, { observe: 'response' });
    }

    update(profileConfig: IProfileConfig): Observable<EntityResponseType> {
        return this.http.put<IProfileConfig>(`${this.resourceUrl}/${this.getProfileConfigIdentifier(profileConfig)}`, profileConfig, {
            observe: 'response'
        });
    }

    partialUpdate(profileConfig: PartialUpdateProfileConfig): Observable<EntityResponseType> {
        return this.http.patch<IProfileConfig>(`${this.resourceUrl}/${this.getProfileConfigIdentifier(profileConfig)}`, profileConfig, {
            observe: 'response'
        });
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http.get<IProfileConfig>(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);
        return this.http.get<IProfileConfig[]>(this.resourceUrl, { params: options, observe: 'response' });
    }

    delete(id: number): Observable<HttpResponse<{}>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    getProfileConfigIdentifier(profileConfig: Pick<IProfileConfig, 'id'>): number {
        return profileConfig.id;
    }

    compareProfileConfig(o1: Pick<IProfileConfig, 'id'> | null, o2: Pick<IProfileConfig, 'id'> | null): boolean {
        return o1 && o2 ? this.getProfileConfigIdentifier(o1) === this.getProfileConfigIdentifier(o2) : o1 === o2;
    }

    addProfileConfigToCollectionIfMissing<Type extends Pick<IProfileConfig, 'id'>>(profileConfigCollection: Type[], ...profileConfigsToCheck: (Type | null | undefined)[]): Type[] {
        const profileConfigs: Type[] = profileConfigsToCheck.filter(isPresent);
        if (profileConfigs.length > 0) {
            const profileConfigCollectionIdentifiers = profileConfigCollection.map((profileConfigItem) => this.getProfileConfigIdentifier(profileConfigItem));
            const profileConfigsToAdd = profileConfigs.filter((profileConfigItem) => {
                const profileConfigIdentifier = this.getProfileConfigIdentifier(profileConfigItem);
                if (profileConfigCollectionIdentifiers.includes(profileConfigIdentifier)) {
                    return false;
                }
                profileConfigCollectionIdentifiers.push(profileConfigIdentifier);
                return true;
            });
            return [...profileConfigsToAdd, ...profileConfigCollection];
        }
        return profileConfigCollection;
    }
}
