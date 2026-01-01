import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { mergeMap } from 'rxjs';
import { AppFloatingConfigurator } from '../../layout/app.floatingconfigurator';
import { AccountService } from '../../services/account.service';
import { AuthServerProvider } from '../../services/auth-jwt.service';
import { CommonService } from '../../services/common.service';
import { clearUserProfile } from '../../store/user-profile/user-profile.actions';
import { UserProfileState } from '../../store/user-profile/user-profile.reducer';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, DialogModule, AppFloatingConfigurator, ReactiveFormsModule],
    templateUrl: 'login.html'
})
export class Login {
    username = viewChild.required<ElementRef>('username');
    private readonly accountService = inject(AccountService);
    authenticationError = signal(false);
    isLoading = signal(false);

    // Forgot password related
    forgotPasswordVisible = false;
    forgotPasswordSuccess = signal(false);
    forgotPasswordError = signal(false);
    isResetting = signal(false);
    commonService = inject(CommonService);
    loginForm = new FormGroup({
        username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        rememberMe: new FormControl(false, { nonNullable: true })
    });

    forgotPasswordForm = new FormGroup({
        usernameOrEmail: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.email]
        })
    });

    private authServerProvider = inject(AuthServerProvider);
    private router = inject(Router);
    private store = inject(Store<{ userProfile: UserProfileState }>);

    ngOnInit(): void {
        this.store.dispatch(clearUserProfile());
    }

    ngAfterViewInit(): void {
        this.username().nativeElement.focus();
    }

    login(): void {
        if (this.loginForm.invalid) {
            return;
        }

        this.isLoading.set(true);
        this.authenticationError.set(false);

        this.authServerProvider
            .login(this.loginForm.getRawValue())
            .pipe(mergeMap(() => this.accountService.identity()))
            .subscribe({
                next: () => {
                    this.commonService.showMenuItems.set(false);
                    this.isLoading.set(false);
                    this.authenticationError.set(false);
                    if (!this.router.getCurrentNavigation()) {
                        this.router.navigate(['']);
                        setTimeout(() => {
                            this.commonService.showMenuItems.set(true);
                        }, 500);
                    }
                },
                error: () => {
                    this.isLoading.set(false);
                    this.authenticationError.set(true);
                }
            });
    }

    showForgotPassword(): void {
        this.forgotPasswordVisible = true;
        this.forgotPasswordSuccess.set(false);
        this.forgotPasswordError.set(false);
        this.forgotPasswordForm.reset();
    }

    closeForgotPassword(): void {
        this.forgotPasswordVisible = false;
        this.forgotPasswordForm.reset();
        this.forgotPasswordSuccess.set(false);
        this.forgotPasswordError.set(false);
    }

    submitForgotPassword(): void {
        if (this.forgotPasswordForm.invalid) {
            return;
        }

        this.isResetting.set(true);
        this.forgotPasswordSuccess.set(false);
        this.forgotPasswordError.set(false);

        const usernameOrEmail = this.forgotPasswordForm.get('usernameOrEmail')?.value;

        if (!usernameOrEmail) {
            return;
        }

        this.authServerProvider.forgotPassword(usernameOrEmail).subscribe({
            next: () => {
                this.isResetting.set(false);
                this.forgotPasswordSuccess.set(true);
                this.forgotPasswordError.set(false);

                // Auto-close dialog after 3 seconds on success
                setTimeout(() => {
                    this.closeForgotPassword();
                }, 3000);
            },
            error: () => {
                this.isResetting.set(false);
                this.forgotPasswordSuccess.set(false);
                this.forgotPasswordError.set(true);
            }
        });
    }
}
