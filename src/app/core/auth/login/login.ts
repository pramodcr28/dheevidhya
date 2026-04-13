import { Component, ElementRef, HostBinding, inject, signal, viewChild } from '@angular/core';
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
import { PublicNavComponent } from '../../../welcome-page/public-nav/public-nav.component';
import { AppConfigurator } from '../../layout/app.configurator';
import { AccountService } from '../../services/account.service';
import { AuthServerProvider } from '../../services/auth-jwt.service';
import { CommonService } from '../../services/common.service';
import { LayoutService } from '../../services/layout.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { clearUserProfile } from '../../store/user-profile/user-profile.actions';
import { UserProfileState } from '../../store/user-profile/user-profile.reducer';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, DialogModule, AppConfigurator, ReactiveFormsModule, PublicNavComponent, AppConfigurator],
    templateUrl: './login.html',
    styles: `
        // @use '../_public-shared' as *;

        :host {
            display: block;
            font-family: 'DM Sans', sans-serif;
        }

        /* Dark background override for the main container */
        .dark-bg {
            background: linear-gradient(135deg, var(--surface-800) 0%, var(--surface-900) 100%) !important;
        }
        :host {
            display: block;
            font-family: 'DM Sans', sans-serif;
            overflow-x: hidden;
            scroll-behavior: smooth;
        }

        *,
        *::before,
        *::after {
            box-sizing: border-box;
        }

        h1,
        h2,
        h3,
        h4,
        .font-display {
            font-family: 'Syne', sans-serif;
        }

        nav#navbar.scrolled {
            background: rgba(253, 246, 239, 0.96);
            backdrop-filter: blur(16px);
            box-shadow: 0 2px 24px rgba(26, 23, 20, 0.08);
        }

        :host-context(.dark) nav#navbar.scrolled {
            background: rgba(26, 23, 20, 0.96);
            backdrop-filter: blur(26px);
            box-shadow: 0 2px 24px rgba(0, 0, 0, 0.3);
        }

        .hero-gradient {
            background: linear-gradient(135deg, #fdf6ef 0%, #fde8d4 60%, #f9c8a3 100%);
        }
        :host-context(.dark) .hero-gradient {
            background: #111010;
        }

        .hero-blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.35;
            animation: blobFloat 8s ease-in-out infinite;
        }
        .blob-orange {
            background: #ff8139;
        }
        .blob-peach {
            background: #f9a875;
        }

        @keyframes blobFloat {
            0%,
            100% {
                transform: translateY(0) scale(1);
            }
            50% {
                transform: translateY(-20px) scale(1.04);
            }
        }

        .float-card {
            animation: floatCard 6s ease-in-out infinite;
            border-radius: 1rem;
            box-shadow: 0 8px 32px rgba(26, 23, 20, 0.12);
            padding: 0.75rem 1.25rem;

            &:nth-child(2) {
                animation-delay: 2s;
            }
            &:nth-child(3) {
                animation-delay: 4s;
            }
        }
        .float-card-accent {
            border-left: 3px solid #e8651a;
        }

        @keyframes floatCard {
            0%,
            100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-10px);
            }
        }

        .ticker {
            display: flex;
            gap: 3rem;
            width: max-content;
            animation: ticker 20s linear infinite;
        }
        @keyframes ticker {
            from {
                transform: translateX(0);
            }
            to {
                transform: translateX(-50%);
            }
        }

        .solution-glow {
            background: radial-gradient(circle at 30% 50%, #e8651a, transparent 60%);
        }

        .stat-card {
            border-radius: 1.25rem;
            transition:
                transform 0.25s,
                box-shadow 0.25s;
            &:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 36px rgba(232, 101, 26, 0.15);
            }
        }

        .module-card {
            border-radius: 1.25rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;

            &::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #e8651a, #f47b30);
                transform: scaleX(0);
                transform-origin: left;
                transition: transform 0.3s ease;
            }

            &:hover::before {
                transform: scaleX(1);
            }
            &:hover {
                transform: translateY(-6px);
                box-shadow: 0 16px 48px rgba(232, 101, 26, 0.12);
            }
        }

        .module-icon {
            width: 3rem;
            height: 3rem;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .boarding-item {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.25rem;
            border-radius: 1rem;
            transition: background 0.2s;
        }

        .boarding-icon {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .plan-card {
            border-radius: 1.5rem;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;

            &:hover:not(.featured) {
                transform: translateY(-4px);
                box-shadow: 0 16px 48px rgba(232, 101, 26, 0.12);
            }
        }

        .ai-card {
            background: linear-gradient(135deg, #1a1714 0%, #2c2825 100%);
            border-radius: 1.25rem;
            border: 1px solid rgba(232, 101, 26, 0.25);
            transition: all 0.3s;

            &:hover {
                transform: translateY(-4px);
                border-color: #e8651a;
                box-shadow: 0 12px 36px rgba(232, 101, 26, 0.2);
            }
        }

        .ai-icon {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(232, 101, 26, 0.15);
        }

        .ai-phase-badge {
            background: rgba(232, 101, 26, 0.15);
        }
        .ai-phase-badge-blue {
            background: rgba(96, 165, 250, 0.12);
        }

        .tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(232, 101, 26, 0.1);
            color: #e8651a;
            font-weight: 600;
            font-size: 0.7rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 999px;
        }
        .tag-dark {
            background: rgba(232, 101, 26, 0.2);
        }

        .btn-orange {
            background: #e8651a;
            color: #fff;
            border-radius: 0.875rem;
            font-family: 'Syne', sans-serif;
            font-weight: 700;
            padding: 0.4rem 1rem;
            transition:
                background 0.2s,
                transform 0.2s,
                box-shadow 0.2s;
            display: inline-block;
            cursor: pointer;

            &:hover {
                background: #f47b30;
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(232, 101, 26, 0.4);
            }
        }

        .btn-outline {
            border: 2px solid #e8651a;
            color: #e8651a;
            border-radius: 0.875rem;
            font-family: 'Syne', sans-serif;
            font-weight: 700;
            padding: 0.4rem 1rem;
            transition: all 0.2s;
            display: inline-block;
            background: transparent;
            cursor: pointer;

            &:hover {
                background: #e8651a;
                color: #fff;
                transform: translateY(-2px);
            }
        }

        .form-input {
            background: #1a1714;
            color: #fff;
            border: 1.5px solid rgba(232, 101, 26, 0.2);
            transition: border-color 0.2s;

            &:focus {
                outline: none;
                border-color: #e8651a;
                box-shadow: 0 0 0 2px rgba(232, 101, 26, 0.2);
            }

            &::placeholder {
                color: #6b7280;
            }
        }

        .form-select {
            color: #6b7280;
            option {
                color: #6b7280;
                background: #1a1714;
            }
        }

        .phase-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
            flex-shrink: 0;
        }
        .phase-dot-orange {
            background: #e8651a;
        }
        .phase-dot-blue {
            background: #60a5fa;
        }
        .phase-dot-muted {
            background: #8a7b72;
        }
        .phase-dot-pulse {
            animation: blobFloat 2s ease-in-out infinite;
        }

        /* ── SCROLL ANIMATIONS ── */
        .fade-up {
            opacity: 0;
            transform: translateY(32px);
            transition:
                opacity 0.7s ease,
                transform 0.7s ease;
            &.visible {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .slide-left {
            opacity: 0;
            transform: translateX(-40px);
            transition:
                opacity 0.7s ease,
                transform 0.7s ease;
            &.visible {
                opacity: 1;
                transform: translateX(0);
            }
        }
        .slide-right {
            opacity: 0;
            transform: translateX(40px);
            transition:
                opacity 0.7s ease,
                transform 0.7s ease;
            &.visible {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .stagger > *:nth-child(1) {
            transition-delay: 0s;
        }
        .stagger > *:nth-child(2) {
            transition-delay: 0.08s;
        }
        .stagger > *:nth-child(3) {
            transition-delay: 0.16s;
        }
        .stagger > *:nth-child(4) {
            transition-delay: 0.24s;
        }
        .stagger > *:nth-child(5) {
            transition-delay: 0.32s;
        }
        .stagger > *:nth-child(6) {
            transition-delay: 0.4s;
        }
        .stagger > *:nth-child(7) {
            transition-delay: 0.48s;
        }
        .stagger > *:nth-child(8) {
            transition-delay: 0.56s;
        }
        .stagger > *:nth-child(9) {
            transition-delay: 0.64s;
        }
        .stagger > *:nth-child(10) {
            transition-delay: 0.72s;
        }
        .stagger > *:nth-child(11) {
            transition-delay: 0.8s;
        }
        .stagger > *:nth-child(12) {
            transition-delay: 0.88s;
        }

        ::-webkit-scrollbar {
            width: 5px;
        }
        ::-webkit-scrollbar-thumb {
            background: #e8651a;
            border-radius: 8px;
        }

        @media (max-width: 640px) {
            .hero-blob {
                filter: blur(60px);
                opacity: 0.25;
            }
            .btn-orange,
            .btn-outline {
                padding: 0.6rem 1.25rem;
                font-size: 0.875rem;
            }
            .plan-card {
                padding: 1.5rem;
            }
            .phase-card ul li {
                font-size: 0.75rem;
            }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
            h1 {
                font-size: 3rem;
            }
        }
    `
})
export class Login {
    username = viewChild.required<ElementRef>('username');

    private readonly accountService = inject(AccountService);
    private layoutService = inject(LayoutService);
    isLoading = signal(false);
    pushService = inject(PushNotificationService);
    commonService = inject(CommonService);

    /** Forgot password state */
    forgotPasswordVisible = false;
    forgotPasswordSuccess = signal(false);
    forgotPasswordError = signal(false);
    isResetting = signal(false);

    loginForm = new FormGroup({
        username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        rememberMe: new FormControl(false, { nonNullable: true })
    });

    forgotPasswordForm = new FormGroup({
        usernameOrEmail: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required]
        })
    });

    today = new Date();
    authServerProvider = inject(AuthServerProvider);
    private router = inject(Router);
    private store = inject(Store<{ userProfile: UserProfileState }>);

    @HostBinding('class.dark')
    get isDark(): boolean {
        return this.layoutService.layoutConfig().darkTheme ?? false;
    }

    ngOnInit(): void {
        this.store.dispatch(clearUserProfile());
    }

    ngAfterViewInit(): void {
        this.username().nativeElement.focus();
    }

    login(): void {
        if (this.loginForm.invalid) return;

        this.isLoading.set(true);
        this.authServerProvider.authenticationError = null;

        this.authServerProvider
            .login(this.loginForm.getRawValue())
            .pipe(mergeMap(() => this.accountService.identity()))
            .subscribe({
                next: async () => {
                    this.isLoading.set(false);
                    this.authServerProvider.authenticationError = null;
                    if (!this.router.getCurrentNavigation()) {
                        this.router.navigate(['/home']);
                    }
                },
                error: () => {
                    this.isLoading.set(false);
                    this.authServerProvider.authenticationError = 'Invalid username or password';
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
        if (this.forgotPasswordForm.invalid) return;

        this.isResetting.set(true);
        this.forgotPasswordSuccess.set(false);
        this.forgotPasswordError.set(false);

        const usernameOrEmail = this.forgotPasswordForm.get('usernameOrEmail')?.value;
        if (!usernameOrEmail) return;

        this.authServerProvider.forgotPassword(usernameOrEmail).subscribe({
            next: () => {
                this.isResetting.set(false);
                this.forgotPasswordSuccess.set(true);
                setTimeout(() => this.closeForgotPassword(), 3000);
            },
            error: () => {
                this.isResetting.set(false);
                this.forgotPasswordError.set(true);
            }
        });
    }
}
