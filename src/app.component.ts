import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiLoaderComponent } from './app/core/layout/loaderComponent';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule,ApiLoaderComponent,CommonModule],
    template: `

    <!-- API Loader Component -->
    <app-api-loader></app-api-loader>
    <router-outlet></router-outlet>`
})
export class AppComponent {

  
}
