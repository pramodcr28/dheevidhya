import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { ApiLoaderService } from '../services/loaderService';

@Component({
  selector: 'app-api-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isVisible"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      role="status"
      [attr.aria-label]="message"
    >
      <div class="bg-white dark:bg-surface-800 rounded-lg p-6 shadow-xl border border-surface-200 dark:border-surface-700 min-w-[280px] max-w-sm mx-4">
        <div class="flex flex-col items-center space-y-4">
          <div class="relative">
            <div class="w-8 h-8 border-4 border-primary-200 dark:border-primary-800 rounded-full animate-spin border-t-primary-500"></div>
          </div>
          <p class="text-surface-700 dark:text-surface-200 text-center font-medium">
            {{ message }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    .backdrop-blur-sm{
        z-index: 1102;
    }
  `]
})
export class ApiLoaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isVisible = false;
  message = 'Loading...';
  apiLoaderService = inject(ApiLoaderService);
  constructor() {}

  ngOnInit(): void {
    combineLatest([
      this.apiLoaderService.loading$,
      this.apiLoaderService.message$
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([loading, message]) => {
      this.isVisible = loading;
      this.message = message;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}