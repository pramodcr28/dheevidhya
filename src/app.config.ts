import { HttpEvent, HttpHandlerFn, HttpRequest, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Router, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { provideAppStore } from './app/core/store/user-profile/store.providers';
import { authInterceptor } from './app/core/interceptor/auth-cookie-interceptor.interceptor';
import { tap, catchError, throwError, Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';


export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch()),
        provideHttpClient(
            withInterceptors([authInterceptor,errorHandlerInterceptor])
          ),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
        ...provideAppStore,
         FormsModule,
         MessageService 
    ]
};
function errorHandlerInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
      const router = inject(Router);
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401 || err.status === 403) {
        router.navigate(['/auth/login']);
      }
      return throwError(() => err);
    })
  );
}

