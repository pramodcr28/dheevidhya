
import { Component, HostListener, inject, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { LayoutService } from '../../core/services/layout.service';
import { setTheme } from '../../core/store/user-profile/user-profile.actions';
import { UserProfileState } from '../../core/store/user-profile/user-profile.reducer';

@Component({
    selector: 'app-public-nav',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './public-nav.component.html',
    styleUrls: ['./public-nav.component.scss']
})
export class PublicNavComponent implements OnInit {
    @Input() showLoginCta = true;
    @Input() showDemoCta = true;

    isScrolled = false;
    mobileMenuOpen = false;

    layoutService = inject(LayoutService);
    private store = inject(Store<{ userProfile: UserProfileState }>);

    get isDark(): boolean {
        return this.layoutService.layoutConfig().darkTheme ?? false;
    }

    @HostListener('window:scroll')
    onWindowScroll(): void {
        this.isScrolled = window.scrollY > 30;
    }

    ngOnInit(): void {}

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu(): void {
        this.mobileMenuOpen = false;
    }

    toggleTheme(): void {
        const isDark = !this.layoutService.layoutConfig().darkTheme;
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: isDark }));
        this.store.dispatch(setTheme({ theme: isDark ? 'dark' : 'light' }));
    }
}
