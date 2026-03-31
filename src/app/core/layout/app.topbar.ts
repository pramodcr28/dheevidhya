import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { MenuItem, MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { StyleClassModule } from 'primeng/styleclass';
import { AccountService } from '../services/account.service';
import { CommonService } from '../services/common.service';
import { LayoutService } from '../services/layout.service';
import { addToken, loadUserProfile, setTheme } from '../store/user-profile/user-profile.actions';
import { UserProfileState } from '../store/user-profile/user-profile.reducer';
import { selectUserTheme } from '../store/user-profile/user-profile.selectors';
import { AppConfigurator } from './app.configurator';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator, RouterLink, SelectModule, FormsModule, ReactiveFormsModule],
    template: `<div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <img src="/assets/images/logo.png" class="dark:hidden" height="160" width="200" alt="Dheevidhya Logo" />
                <img src="/assets/images/logo-white.png" height="160" class="hidden dark:block" width="200" alt="Dheevidhya Logo" />
            </a>
        </div>

        <div class="layout-topbar-actions">
            @if (this.selectedAcademicYear && !commonService.getUserAuthorities.includes('SUPER_ADMIN') && !commonService.getUserAuthorities.includes('IT_ADMINISTRATOR')) {
                <div class="flex items-center mr-2 sm:mr-3">
                    <p-select
                        [options]="academicYears"
                        [(ngModel)]="selectedAcademicYear"
                        placeholder="Academic Year"
                        styleClass="w-24 sm:w-32 md:w-40 text-xs sm:text-sm"
                        [disabled]="loading || academicYears.length <= 1"
                        (onChange)="onAcademicYearChange()"
                        10--
                    >
                    </p-select>
                </div>
            }

            <div class="layout-config-menu flex gap-1 sm:gap-2">
                <button type="button" class="layout-topbar-action p-2 sm:p-2.5 min-w-[2rem] sm:min-w-[2.5rem] min-h-[2rem] sm:min-h-[2.5rem]" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi text-sm sm:text-base': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <!-- <div class="relative hidden sm:block">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight p-2 sm:p-2.5 min-w-[2rem] sm:min-w-[2.5rem] min-h-[2rem] sm:min-h-[2.5rem]"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette text-sm sm:text-base"></i>
                    </button> -->
                <app-configurator />
                <!-- </div> -->
            </div>

            <button
                class="layout-topbar-menu-button layout-topbar-action p-2 sm:p-2.5 min-w-[2rem] sm:min-w-[2.5rem] min-h-[2rem] sm:min-h-[2.5rem]"
                pStyleClass="@next"
                enterFromClass="hidden"
                enterActiveClass="animate-scalein"
                leaveToClass="hidden"
                leaveActiveClass="animate-fadeout"
                [hideOnOutsideClick]="true"
            >
                <i class="pi pi-ellipsis-v text-sm sm:text-base"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <a [routerLink]="'/profile'">
                        <button type="button" class="layout-topbar-action">
                            <i class="pi pi-user"></i>
                            <span>Profile</span>
                        </button>
                    </a>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    items!: MenuItem[];
    accountingService = inject(AccountService);
    academicYears: string[] = [];
    selectedAcademicYear!: string;
    loading = false;
    private store = inject(Store<{ userProfile: UserProfileState }>);
    constructor(public layoutService: LayoutService) {}
    messageService = inject(MessageService);
    commonService = inject(CommonService);

    toggleDarkMode() {
        // this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
        const isDark = !this.layoutService.layoutConfig().darkTheme;
        // Update UI
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
        this.loadAcademicYears();

        this.store.select(selectUserTheme).subscribe((res) => {
            if (res) {
                const isDark = res === 'dark';

                this.layoutService.layoutConfig.update((state) => ({
                    ...state,
                    darkTheme: isDark
                }));
            }

            this.selectedAcademicYear = this.commonService.currentUser?.academicYear;
        });
    }

    onAcademicYearChange(): void {
        if (!this.selectedAcademicYear) return;

        this.loading = true;

        this.accountingService.switchAcademicYear(this.selectedAcademicYear).subscribe({
            next: (response) => {
                this.store.dispatch(addToken({ token: response.token }));

                this.store.dispatch(loadUserProfile({ userConfig: response.profile }));
                window.location.reload();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Academic Year Switched',
                    detail: `Switched to ${this.selectedAcademicYear}`
                });

                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Unable to switch academic year'
                });
            }
        });
    }

    loadAcademicYears(): void {
        this.accountingService.getAcademicYears().subscribe({
            next: (years) => {
                this.academicYears = years;
                if (years.length && this.commonService.currentUser?.academicYear) {
                    this.selectedAcademicYear = this.commonService.currentUser?.academicYear;
                }
            }
        });
    }
}
