import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { UserService } from './user.service';
import { InventoryCategory, InventoryItem, InventoryTransaction } from '../models/inventory.model';
@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceCategoryUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL +'api/inventory-categories');
  protected resourceInventoryItemUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL +'api/inventory-items');
  protected resourceInventoryTransactionUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL +'api/inventory-transactions');
  protected studentService = inject(UserService);

  searchCategory<T>(page: number = 0, size: number = 10, sortBy: string = 'id', 
    sortDirection: string = 'ASC', filters: any = {}): Observable<any> {

      const searchRequest = {
      page: page,
      size: size,
      sortBy: sortBy,
      sortDirection: sortDirection,
      filters: filters
      };

    return this.http.post<any>(`${this.resourceCategoryUrl}/search`, searchRequest);
  }

   searchInventoryItem<T>(page: number = 0, size: number = 10, sortBy: string = 'id', 
    sortDirection: string = 'ASC', filters: any = {}): Observable<any> {

      const searchRequest = {
      page: page,
      size: size,
      sortBy: sortBy,
      sortDirection: sortDirection,
      filters: filters
      };

    return this.http.post<any>(`${this.resourceInventoryItemUrl}/search`, searchRequest);
  }

   searchInventoryTransaction<T>(page: number = 0, size: number = 10, sortBy: string = 'id', 
    sortDirection: string = 'ASC', filters: any = {}): Observable<any> {

      const searchRequest = {
      page: page,
      size: size,
      sortBy: sortBy,
      sortDirection: sortDirection,
      filters: filters
      };

    return this.http.post<any>(`${this.resourceInventoryTransactionUrl}/search`, searchRequest);
  }

 createCategory(category: InventoryCategory) {
    return this.http.post<InventoryCategory>(this.resourceCategoryUrl, category, { observe: 'response' });
  }

  createInventoryItem(item: InventoryItem) {
    return this.http.post<InventoryItem>(this.resourceInventoryItemUrl, item, { observe: 'response' });
  }

  addTransaction(transaction: InventoryTransaction) {
    return this.http.post<InventoryItem>(this.resourceInventoryTransactionUrl, transaction, { observe: 'response' });
  }

}
