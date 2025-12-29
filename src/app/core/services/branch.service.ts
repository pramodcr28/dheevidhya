import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import dayjs from 'dayjs/esm';
import { environment } from '../../../environments/environment';
import { IBranch, NewBranch } from '../../pages/models/tenant.model';
import { ApplicationConfigService } from './application-config.service';
import { isPresent } from './operators';
import { createRequestOption } from './request-util';

export type PartialUpdateBranch = Partial<IBranch> & Pick<IBranch, 'id'>;

type RestOf<T extends IBranch | NewBranch> = Omit<T, 'createdAt' | 'updatedAt'> & {
    createdAt?: string | null;
    updatedAt?: string | null;
};

export type RestBranch = RestOf<IBranch>;

export type NewRestBranch = RestOf<NewBranch>;

export type PartialUpdateRestBranch = RestOf<PartialUpdateBranch>;

export type EntityResponseType = HttpResponse<IBranch>;
export type EntityArrayResponseType = HttpResponse<IBranch[]>;

@Injectable({ providedIn: 'root' })
export class BranchService {
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/branches');

    create(branch: IBranch): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(branch);
        return this.http.post<RestBranch>(this.resourceUrl, copy, { observe: 'response' }).pipe(map((res) => this.convertResponseFromServer(res)));
    }

    update(branch: IBranch): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(branch);
        return this.http.put<RestBranch>(`${this.resourceUrl}/${this.getBranchIdentifier(branch)}`, copy, { observe: 'response' }).pipe(map((res) => this.convertResponseFromServer(res)));
    }

    partialUpdate(branch: PartialUpdateBranch): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(branch);
        return this.http.patch<RestBranch>(`${this.resourceUrl}/${this.getBranchIdentifier(branch)}`, copy, { observe: 'response' }).pipe(map((res) => this.convertResponseFromServer(res)));
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http.get<RestBranch>(`${this.resourceUrl}/${id}`, { observe: 'response' }).pipe(map((res) => this.convertResponseFromServer(res)));
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);
        return this.http.get<RestBranch[]>(this.resourceUrl, { params: options, observe: 'response' }).pipe(map((res) => this.convertResponseArrayFromServer(res)));
    }

    search<T>(page: number = 0, size: number = 10, sortBy: string = 'id', sortDirection: string = 'ASC', filters: any = {}): Observable<any> {
        const searchRequest = {
            page: page,
            size: size,
            sortBy: sortBy,
            sortDirection: sortDirection,
            filters: filters
        };

        return this.http.post<any>(`${this.resourceUrl}/search`, searchRequest);
    }

    delete(id: number): Observable<HttpResponse<{}>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    getBranchIdentifier(branch: Pick<IBranch, 'id'>): number {
        return branch.id;
    }

    compareBranch(o1: Pick<IBranch, 'id'> | null, o2: Pick<IBranch, 'id'> | null): boolean {
        return o1 && o2 ? this.getBranchIdentifier(o1) === this.getBranchIdentifier(o2) : o1 === o2;
    }

    addBranchToCollectionIfMissing<Type extends Pick<IBranch, 'id'>>(branchCollection: Type[], ...branchesToCheck: (Type | null | undefined)[]): Type[] {
        const branches: Type[] = branchesToCheck.filter(isPresent);
        if (branches.length > 0) {
            const branchCollectionIdentifiers = branchCollection.map((branchItem) => this.getBranchIdentifier(branchItem));
            const branchesToAdd = branches.filter((branchItem) => {
                const branchIdentifier = this.getBranchIdentifier(branchItem);
                if (branchCollectionIdentifiers.includes(branchIdentifier)) {
                    return false;
                }
                branchCollectionIdentifiers.push(branchIdentifier);
                return true;
            });
            return [...branchesToAdd, ...branchCollection];
        }
        return branchCollection;
    }

    protected convertDateFromClient<T extends IBranch | NewBranch | PartialUpdateBranch>(branch: T): RestOf<T> {
        return {
            ...branch,
            createdAt: branch.createdAt?.toJSON() ?? null,
            updatedAt: branch.updatedAt?.toJSON() ?? null
        };
    }

    protected convertDateFromServer(restBranch: RestBranch): IBranch {
        return {
            ...restBranch,
            createdAt: restBranch.createdAt ? dayjs(restBranch.createdAt) : undefined,
            updatedAt: restBranch.updatedAt ? dayjs(restBranch.updatedAt) : undefined
        };
    }

    protected convertResponseFromServer(res: HttpResponse<RestBranch>): HttpResponse<IBranch> {
        return res.clone({
            body: res.body ? this.convertDateFromServer(res.body) : null
        });
    }

    protected convertResponseArrayFromServer(res: HttpResponse<RestBranch[]>): HttpResponse<IBranch[]> {
        return res.clone({
            body: res.body ? res.body.map((item) => this.convertDateFromServer(item)) : null
        });
    }
}
