import { HttpEvent, HttpHandlerFn, HttpRequest, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Router, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { catchError, Observable, throwError } from 'rxjs';
import { appRoutes } from './app.routes';
import { authInterceptor } from './app/core/interceptor/auth-cookie-interceptor.interceptor';
import { DheeConfirmationService } from './app/core/services/dhee-confirmation.service';
import { ApiLoaderService } from './app/core/services/loaderService';
import { provideAppStore } from './app/core/store/user-profile/store.providers';
export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch()),
        provideHttpClient(withInterceptors([authInterceptor, errorHandlerInterceptor])),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
        ...provideAppStore,
        FormsModule,
        MessageService,
        ConfirmationService,
        DheeConfirmationService
    ]
};
function errorHandlerInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const router = inject(Router);
    const loader = inject(ApiLoaderService);
    return next(req).pipe(
        catchError((err) => {
            if (err.status === 401 || err.status === 403) {
                const currentUrl = router.url;

                if (!currentUrl.includes('/auth/login') && !currentUrl.includes('/auth/reset')) {
                    router.navigate(['/auth/login']);
                    loader.hide();
                }
            }
            return throwError(() => err);
        })
    );
}
