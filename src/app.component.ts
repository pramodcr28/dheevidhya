import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiLoaderComponent } from './app/core/layout/loaderComponent';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule,ApiLoaderComponent,CommonModule,ToastModule],
    template: `
    <p-toast></p-toast>
    <!-- API Loader Component -->
    <app-api-loader></app-api-loader>
    <router-outlet></router-outlet>`
})
export class AppComponent {

  
}
