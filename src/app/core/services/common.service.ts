import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from './application-config.service';
import { IProfileConfig } from '../../pages/models/user.model';
import { UserProfileState } from '../store/user-profile/user-profile.reducer';
import { Store } from '@ngrx/store';
import { IBranch } from '../../pages/models/tenant.model';
import { getAllSectionEntities, getAssociatedDepartments, getBranch, getSubByDeptIds } from '../store/user-profile/user-profile.selectors';
import { IDepartmentConfig, Section } from '../../pages/models/org.model';
export type EntityResponseType = HttpResponse<IProfileConfig>;
@Injectable({
  providedIn: 'root'
})
export class CommonService {

  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ADMIN_BASE_URL +'api/profile-configs');

  private store = inject(Store<{ userProfile: UserProfileState }>);

  branch:Observable<IBranch>;
  associatedDepartments: Observable<IDepartmentConfig[]>;
  associatedSections:Observable<Section[]>;
  associatedSubjects:Observable<any[]>;

  findProfileConfig(id: number): Observable<EntityResponseType> {
    return this.http.get<IProfileConfig>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  constructor(){
    this.branch = this.store.select(getBranch);
    this.associatedDepartments = this.store.select(getAssociatedDepartments);
    this.associatedSections =  this.store.select(getAllSectionEntities);
    this.associatedSubjects = this.store.select(getSubByDeptIds([]));
  }
}
