import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IProfileConfig } from '../model/auth';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from './application-config.service';
export type EntityResponseType = HttpResponse<IProfileConfig>;
@Injectable({
  providedIn: 'root'
})
export class CommonService {

  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ADMIN_BASE_URL +'api/profile-configs');


  findProfileConfig(id: number): Observable<EntityResponseType> {
    return this.http.get<IProfileConfig>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }
}
