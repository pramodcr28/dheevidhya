import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiLoaderComponent } from './app/core/layout/loaderComponent';
import { ToastModule } from 'primeng/toast';
import { WebSocketService } from './app/core/services/websocket.service';
import { AccountService } from './app/core/services/account.service';

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

  private wsService = inject(WebSocketService);
  private accountService = inject(AccountService);
  
  ngOnInit() {
    this.wsService.getMessages().subscribe(
      (message) => {
        console.log("Web socket trigger ID" + message);
        this.accountService.identity().subscribe(result=>{
        });
      }
    );
  }
}
