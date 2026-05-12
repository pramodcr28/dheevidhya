import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostBinding, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Store } from '@ngrx/store';
import { MessageService } from 'primeng/api';
import { AppConfigurator } from '../core/layout/app.configurator';
import { AccountService } from '../core/services/account.service';
import { LayoutService } from '../core/services/layout.service';
import { UserProfileState } from '../core/store/user-profile/user-profile.reducer';
import { getToken } from '../core/store/user-profile/user-profile.selectors';
import { AiSectionComponent } from './ai-section/ai-section.component';
import { BillingSectionComponent } from './billing-section/billing-section.component';
import { BoardingSectionComponent } from './boarding-section/boarding-section.component';
import { ContactSectionComponent } from './contact-section/contact-section.component';
import { FeaturesSectionComponent } from './features-section/features-section.component';
import { FooterSectionComponent } from './footer-section/footer-section.component';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { ModulesSectionComponent } from './modules-section/modules-section.component';
import { PublicNavComponent } from './public-nav/public-nav.component';
import { RoadmapSectionComponent } from './roadmap-section/roadmap-section.component';

@Component({
    selector: 'app-welcome-page',
    standalone: true,
    imports: [
        CommonModule,
        AppConfigurator,
        FormsModule,
        PublicNavComponent,
        HeroSectionComponent,
        FeaturesSectionComponent,
        ModulesSectionComponent,
        BoardingSectionComponent,
        BillingSectionComponent,
        AiSectionComponent,
        RoadmapSectionComponent,
        ContactSectionComponent,
        FooterSectionComponent
    ],
    templateUrl: './welcome-page.component.html',
    styleUrls: ['./welcome-page.component.scss']
})
export class WelcomePageComponent implements OnInit, OnDestroy {
    today = new Date();

    private el = inject(ElementRef);
    private observer!: IntersectionObserver;
    private store = inject(Store<{ userProfile: UserProfileState }>);
    public router: Router = inject(Router);
    layoutService = inject(LayoutService);
    accountService = inject(AccountService);
    messageService = inject(MessageService);

    @HostBinding('class.dark')
    get isDark(): boolean {
        return this.layoutService.layoutConfig().darkTheme ?? false;
    }

    contactForm = {
        fullName: '',
        institutionName: '',
        email: '',
        phone: '',
        studentRange: '',
        city: '',
        message: ''
    };

    ngOnInit(): void {
        setTimeout(() => this.initScrollObserver(), 150);

        this.store.select(getToken).subscribe((token) => {
            if (token) {
                this.router.navigate(['/home']);
            } else {
                if (Capacitor.isNativePlatform()) {
                    this.router.navigate(['/auth/login']);
                }
            }
        });
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }

    submitForm(): void {
        this.accountService.saveContactLead(this.contactForm).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Request Saved',
                    detail: 'Your request has been saved successfully.'
                });
                this.contactForm = {
                    fullName: '',
                    institutionName: '',
                    email: '',
                    phone: '',
                    studentRange: '',
                    city: '',
                    message: ''
                };
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Unable to save your request. Please try again.'
                });
            }
        });
    }

    private initScrollObserver(): void {
        const host: HTMLElement = this.el.nativeElement;
        this.observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((e) => {
                    if (e.isIntersecting) e.target.classList.add('visible');
                }),
            { threshold: 0.1 }
        );
        host.querySelectorAll<HTMLElement>('.fade-up, .slide-left, .slide-right').forEach((el) => this.observer.observe(el));
    }
}
