import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IDepartmentConfig, Section } from '../../pages/models/org.model';
import { IBranch } from '../../pages/models/tenant.model';
import { IProfileConfig } from '../../pages/models/user.model';
import { UserProfileState } from '../store/user-profile/user-profile.reducer';
import { getAllSectionEntities, getAssociatedDepartments, getBranch, getSubjectsByFilters, selectUserConfig } from '../store/user-profile/user-profile.selectors';
import { getUserAssociatedSubjects } from './../store/user-profile/user-profile.selectors';
import { ApplicationConfigService } from './application-config.service';
export type EntityResponseType = HttpResponse<IProfileConfig>;
@Injectable({
    providedIn: 'root'
})
export class CommonService {
    dateTimeFormate = "yyyy-MM-dd'T'HH:mm:ss.SSS";
    dateFormate = 'yyyy-MM-dd';
    TimeFormate = 'HH:mm:ss.SSS';
    displayDateTimeFormate = 'dd MMMM yyyy, hh:mm a';

    themeGradients: string[] = [
        'linear-gradient(180deg, #2196F3, #64B5F6)',
        'linear-gradient(135deg, #4CAF50, #81C784)',
        'linear-gradient(135deg, #FF9800, #FFB74D)',
        'linear-gradient(135deg, #F44336, #EF9A9A)',
        'linear-gradient(135deg, #9C27B0, #BA68C8)',
        'linear-gradient(135deg, #00BCD4, #4DD0E1)',
        'linear-gradient(135deg, #FFC107, #FFD54F)',
        'linear-gradient(135deg, #E91E63, #F06292)',
        'linear-gradient(135deg, #8BC34A, #AED581)',
        'linear-gradient(135deg, #3F51B5, #7986CB)',
        'linear-gradient(135deg, #607D8B, #90A4AE)'
    ];

    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);
    private store = inject(Store<{ userProfile: UserProfileState }>);

    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ADMIN_BASE_URL + 'profile-configs');

    branch: IBranch | null = null;
    associatedDepartments: IDepartmentConfig[] = [];
    associatedSections: Section[] = [];
    associatedSubjects: any[] = [];
    currentUser: any = null;
    userAssociatedSubjects: any[] = [];

    getStudentInfo = null;
    getUserInfo = null;

    constructor() {
        // Initialize values by subscribing once
        this.store.select(getBranch).subscribe((res) => {
            this.branch = res;
        });

        this.store.select(getAssociatedDepartments).subscribe((res) => {
            this.associatedDepartments =
                res?.map((department: any) => {
                    return { ...department, name: department.department?.name };
                }) ?? [];
        });

        this.store.select(getAllSectionEntities).subscribe((res) => {
            this.associatedSections = res ?? [];
        });

        this.store.select(getSubjectsByFilters([])).subscribe((res) => {
            this.associatedSubjects = res ?? [];
        });

        this.store.select(selectUserConfig).subscribe((res) => {
            this.currentUser = res;
        });

        this.store.select(getUserAssociatedSubjects).subscribe((res) => {
            this.userAssociatedSubjects = res ?? [];
        });
    }

    findProfileConfig(id: number): Observable<EntityResponseType> {
        return this.http.get<IProfileConfig>(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    post<T>(url: string, body: any): Observable<T> {
        return this.http.post<T>(url, body);
    }

    formatDate(date: Date): string {
        return date.toISOString().slice(0, -1);
    }

    formatDateForApi(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
