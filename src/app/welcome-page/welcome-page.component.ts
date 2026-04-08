import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';

@Component({
    selector: 'app-welcome-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './welcome-page.component.html',
    styleUrls: ['./welcome-page.component.scss']
})
export class WelcomePageComponent implements OnInit, OnDestroy {
    isScrolled = false;
    mobileMenuOpen = false;

    private observer!: IntersectionObserver;
    private sectionObserver!: IntersectionObserver;
    private navLinks: NodeListOf<HTMLAnchorElement> | null = null;

    constructor(private el: ElementRef) {}

    // ── Navbar scroll ──────────────────────────────────────────
    @HostListener('window:scroll')
    onWindowScroll(): void {
        this.isScrolled = window.scrollY > 30;
    }

    // ── Mobile menu ────────────────────────────────────────────
    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu(): void {
        this.mobileMenuOpen = false;
    }

    // ── Lifecycle ──────────────────────────────────────────────
    ngOnInit(): void {
        // Slight delay so the view has rendered before we query it
        setTimeout(() => this.initObservers(), 100);
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        this.sectionObserver?.disconnect();
    }

    private initObservers(): void {
        const host: HTMLElement = this.el.nativeElement;

        // ── Intersection Observer for scroll animations ──
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

        // ── Active nav-link highlighting ──
        this.navLinks = host.querySelectorAll<HTMLAnchorElement>('nav a[href^="#"]');

        this.sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && this.navLinks) {
                        this.navLinks.forEach((link) => {
                            link.style.color = '';
                            if (link.getAttribute('href') === '#' + entry.target.id) {
                                link.style.color = '#E8651A'; // --orange
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
