import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from './application-config.service';
import { IProfileConfig } from '../../pages/models/user.model';
import { UserProfileState } from '../store/user-profile/user-profile.reducer';
import { Store } from '@ngrx/store';
import { IBranch } from '../../pages/models/tenant.model';
import { getAllSectionEntities, getAssociatedDepartments, getBranch, getSubjectsByFilters, selectUserConfig } from '../store/user-profile/user-profile.selectors';
import { IDepartmentConfig, Section } from '../../pages/models/org.model';
export type EntityResponseType = HttpResponse<IProfileConfig>;
@Injectable({
  providedIn: 'root'
})
export class CommonService {

  dateTimeFormate = "yyyy-MM-dd'T'HH:mm:ss.SSS";
  dateFormate = "yyyy-MM-dd";
  TimeFormate = "HH:mm:ss.SSS";
  displayDateTimeFormate = "dd MMMM yyyy, hh:mm a";

  themeGradients: string[] = [
  'linear-gradient(180deg, #2196F3, #64B5F6)',  // Blue
  'linear-gradient(135deg, #4CAF50, #81C784)',  // Green
  'linear-gradient(135deg, #FF9800, #FFB74D)',  // Orange
  'linear-gradient(135deg, #F44336, #EF9A9A)',  // Red
  'linear-gradient(135deg, #9C27B0, #BA68C8)',  // Purple
  'linear-gradient(135deg, #00BCD4, #4DD0E1)',  // Teal/Cyan
  'linear-gradient(135deg, #FFC107, #FFD54F)',  // Amber
  'linear-gradient(135deg, #E91E63, #F06292)',  // Pink
  'linear-gradient(135deg, #8BC34A, #AED581)',  // Lime
  'linear-gradient(135deg, #3F51B5, #7986CB)',  // Indigo
  'linear-gradient(135deg, #607D8B, #90A4AE)'   // Blue Grey
];


  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ADMIN_BASE_URL +'api/profile-configs');

  private store = inject(Store<{ userProfile: UserProfileState }>);

  branch:Observable<IBranch>;
  associatedDepartments: Observable<IDepartmentConfig[]>;
  associatedSections:Observable<Section[]>;
  associatedSubjects:Observable<any[]>;
  currentUser:Observable<any>;
  
  findProfileConfig(id: number): Observable<EntityResponseType> {
    return this.http.get<IProfileConfig>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  constructor(){
    this.branch = this.store.select(getBranch);
    this.associatedDepartments = this.store.select(getAssociatedDepartments);
    this.associatedSections =  this.store.select(getAllSectionEntities);
    this.associatedSubjects = this.store.select(getSubjectsByFilters([]));
    this.currentUser = this.store.select(selectUserConfig)
  }

  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(url, body);
  }
  

  formatDate(date: Date): string {
  return date.toISOString().slice(0, -1); 
  // produces yyyy-MM-ddTHH:mm:ss.SSS (without trailing Z)
}
}
