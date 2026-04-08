import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostBinding, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppConfigurator } from '../core/layout/app.configurator';
import { LayoutService } from '../core/services/layout.service';
import { setTheme } from '../core/store/user-profile/user-profile.actions';
import { UserProfileState } from '../core/store/user-profile/user-profile.reducer';

@Component({
    selector: 'app-welcome-page',
    standalone: true,
    imports: [CommonModule, RouterLink, AppConfigurator],
    templateUrl: './welcome-page.component.html',
    styleUrls: ['./welcome-page.component.scss']
})
export class WelcomePageComponent implements OnInit, OnDestroy {
    isScrolled = false;
    mobileMenuOpen = false;
    theme: 'light' | 'dark' = 'light';

    @HostBinding('class.dark-theme') get darkTheme() {
        return this.theme === 'dark';
    }
    private store = inject(Store<{ userProfile: UserProfileState }>);
    private observer!: IntersectionObserver;
    private sectionObserver!: IntersectionObserver;
    private navLinks: NodeListOf<HTMLAnchorElement> | null = null;
    layoutService = inject(LayoutService);
    constructor(private el: ElementRef) {}

    @HostListener('window:scroll')
    onWindowScroll(): void {
        this.isScrolled = window.scrollY > 30;
    }

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu(): void {
        this.mobileMenuOpen = false;
    }

    toggleTheme(): void {
        const isDark = !this.layoutService.layoutConfig().darkTheme;
        // Update UI
        this.theme = isDark ? 'dark' : 'light';
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: isDark
        }));

        // Save in store
        this.store.dispatch(
            setTheme({
                theme: isDark ? 'dark' : 'light'
            })
        );
    }

    ngOnInit(): void {
        setTimeout(() => this.initObservers(), 100);
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        this.sectionObserver?.disconnect();
    }

    private initObservers(): void {
        const host: HTMLElement = this.el.nativeElement;

        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.12 }
        );

        host.querySelectorAll<HTMLElement>('.fade-up, .slide-left, .slide-right').forEach((el) => this.observer.observe(el));

        this.navLinks = host.querySelectorAll<HTMLAnchorElement>('nav a[href^="#"]');

        this.sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && this.navLinks) {
                        this.navLinks.forEach((link) => {
                            link.style.color = '';
                            const fragment = link.getAttribute('fragment');
                            if (fragment && fragment === entry.target.id) {
                                link.style.color = '#E8651A';
                            }
                        });
                    }
                });
            },
            { threshold: 0.4 }
        );

        host.querySelectorAll<HTMLElement>('section[id]').forEach((s) => this.sectionObserver.observe(s));
    }
}
