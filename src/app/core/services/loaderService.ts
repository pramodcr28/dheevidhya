import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiLoaderService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<string>('Loading...');
  
  public loading$ = this.loadingSubject.asObservable();
  public message$ = this.messageSubject.asObservable();

  show(message: string = 'Loading...'): void {
    this.messageSubject.next(message);
    this.loadingSubject.next(true);
  }

  hide(): void {
    this.loadingSubject.next(false);
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  // Utility method for API calls
  async withLoader<T>(
    apiCall: () => Promise<T>,
    message: string = 'Loading...'
  ): Promise<T> {
    this.show(message);
    try {
      return await apiCall();
    } finally {
      this.hide();
    }
  }
}