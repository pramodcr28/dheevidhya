import { CommonModule } from '@angular/common';
import { Component, computed, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { Subscription } from 'rxjs';
import { Column, ExportColumn } from '../../../core/model/table.model';
import { CommonService } from '../../../core/services/common.service';
import { DheeConfirmationService } from '../../../core/services/dhee-confirmation.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { SortService } from '../../../shared/sort';
import { IProfileConfig, ITenantAuthority, ITenantUser, NewTenantUser } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantAuthorityService } from '../../service/tenant-authority.service';
import { UserService } from '../../service/user.service';
import { EmployeeDialogComponent } from './../employee-dialog/employee-dialog.component';

@Component({
    selector: 'app-employee-list',
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        EmployeeDialogComponent,
        ConfirmationDialogComponent
    ],
    templateUrl: './employee-list.component.html',
    styles: ``,
    providers: [MessageService, DheeConfirmationService]
})
export class EmployeeListComponent {
    studentDialog: boolean = false;
    employee!: NewTenantUser | ITenantUser;
    submitted: boolean = false;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    subscription: Subscription | null = null;
    tenantAuthorities = signal<ITenantAuthority[]>([]);
    isLoading = false;
    employees = signal<ITenantUser[]>([]);

    router = inject(Router);
    employeeService = inject(UserService);
    profileService = inject(ProfileConfigService);
    authorityService = inject(TenantAuthorityService);
    activatedRoute = inject(ActivatedRoute);
    sortService = inject(SortService);
    ngZone = inject(NgZone);
    messageService = inject(MessageService);
    confirmationService = inject(DheeConfirmationService);
    loader = inject(ApiLoaderService);
    commonService = inject(CommonService);

    // Pagination — kept for server load, but table is now client-side filtered
    itemsPerPage = 1000;
    totalItems = 0;
    page = 0;
    sortField = 'lastModifiedDate';
    sortOrder: 'ASC' | 'DESC' = 'DESC';

    // ── Local search state ───────────────────────────────────────────────────
    /** Text currently typed in the input (not yet committed as a chip). */
    currentSearchText: string = '';

    /** Committed filter chips — each one must match for a row to show. */
    searchChips = signal<string[]>([]);

    /**
     * Derived list: all employees filtered by every chip AND the live
     * currentSearchText that has not yet been committed.
     * Uses AND logic: a row must satisfy ALL chips + live text.
     */
    filteredEmployees = computed(() => {
        const allChips = [...this.searchChips()];
        // Also filter on live typing (not-yet-committed text)
        const live = this.currentSearchText.trim().toLowerCase();
        if (live) allChips.push(live);

        if (allChips.length === 0) return this.employees();

        return this.employees().filter((emp) => {
            const haystack = this.buildSearchableString(emp);
            return allChips.every((chip) => haystack.includes(chip.toLowerCase()));
        });
    });
    // ────────────────────────────────────────────────────────────────────────

    ngOnInit() {
        this.authorityService.query().subscribe((result: any) => {
            this.tenantAuthorities.set(result.body);
        });
        this.load();
    }

    load(): void {
        this.loader.show('Fetching Staff Data');
        let filterParams = {};

        if (this.commonService.getUserAuthorities.includes('SUPER_ADMIN')) {
            filterParams = { 'authorities.name.equals': 'IT_ADMINISTRATOR' };
        } else {
            filterParams = {
                'branch_id.eq': this.commonService.branch?.id,
                'authorities.name.nin': ['IT_ADMINISTRATOR', 'STUDENT']
            };
        }

        // Load all staff at once for local search (up to ~1000 is fine client-side)
        this.employeeService.userSearch(0, this.itemsPerPage, this.sortField, this.sortOrder, filterParams).subscribe({
            next: (res: any) => {
                this.employees.set(res.content);
                this.totalItems = res.totalElements || 0;
                this.loader.hide();
            },
            error: () => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load staff data'
                });
            }
        });
    }

    private buildSearchableString(emp: ITenantUser): string {
        const authorityNames = emp.authorities?.map((a: any) => a.name).join(' ') ?? '';
        return [emp.firstName, emp.lastName, `${emp.firstName} ${emp.lastName}`, emp.email, emp.login, authorityNames].filter(Boolean).join(' ').toLowerCase();
    }

    addSearchChip(): void {
        const text = this.currentSearchText.trim();
        if (!text) return;

        if (this.searchChips().some((c) => c.toLowerCase() === text.toLowerCase())) {
            this.currentSearchText = '';
            return;
        }

        this.searchChips.update((chips) => [...chips, text]);
        this.currentSearchText = '';
    }

    removeChip(index: number): void {
        this.searchChips.update((chips) => chips.filter((_, i) => i !== index));
    }

    onBackspaceKey(): void {
        if (this.currentSearchText === '' && this.searchChips().length > 0) {
            this.searchChips.update((chips) => chips.slice(0, -1));
        }
    }

    clearAllSearch(): void {
        this.searchChips.set([]);
        this.currentSearchText = '';
    }

    highlight(value: string): string {
        if (!value) return '';

        const chips = [...this.searchChips()];
        const live = this.currentSearchText.trim();
        if (live) chips.push(live);

        if (chips.length === 0) return this.escapeHtml(value);

        let result = this.escapeHtml(value);

        chips.forEach((chip) => {
            if (!chip) return;
            const escaped = this.escapeRegex(this.escapeHtml(chip));
            const regex = new RegExp(`(${escaped})`, 'gi');
            result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
        });

        return result;
    }

    private escapeHtml(text: string): string {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    private escapeRegex(text: string): string {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ── Sort ─────────────────────────────────────────────────────────────────

    onSort(event: any): void {
        this.sortField = event.field || 'id';
        this.sortOrder = event.order === 1 ? 'ASC' : 'DESC';
        // Sorting handled by PrimeNG table client-side (lazy=false)
    }

    // ── Dialog / CRUD — unchanged ─────────────────────────────────────────

    openNew() {
        this.employee = {
            authorities: [],
            isTenantUser: true,
            activated: true,
            imageUrl: '',
            email: '',
            firstName: '',
            lastName: '',
            login: '',
            passwordHash: 'User@123'
        } as NewTenantUser;

        this.submitted = false;
        this.studentDialog = true;
    }

    hideDialog() {
        this.studentDialog = false;
        this.submitted = false;
        this.loader.hide();
    }

    onEmployeeSave(data: { user: NewTenantUser | ITenantUser; profile: IProfileConfig }) {
        this.submitted = true;

        if (!data.profile) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Profile configuration is required' });
            return;
        }

        this.loader.show('Saving Staff Data');

        if (data.profile.roles) {
            for (let role in data.profile.roles) {
                if (data.profile.roles[role] == null) delete data.profile.roles[role];
            }
        }
        data.profile.profileType = 'STAFF';

        if (!data.user.id) data.user.passwordHash = 'User@123';

        this.employeeService.create({ user: data.user, profile: data.profile }).subscribe((res: any) => {
            if (res && res.body.status === 200) {
                this.hideDialog();
                this.load();
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Employee profile saved successfully' });
            } else {
                this.loader.hide();
                this.messageService.add({ severity: 'error', summary: res.body.error || 'Error', detail: res.body.message || 'Failed to save employee data' });
            }
        });
    }

    onUserSave(user: NewTenantUser | ITenantUser) {
        this.submitted = true;

        if (!user.id) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Cannot save user without ID. Please create user with profile first.' });
            return;
        }

        this.loader.show('Updating User Information');

        this.employeeService.create({ user, profile: null }).subscribe((res: any) => {
            if (res && res.body.status === 200) {
                this.hideDialog();
                this.load();
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Employee profile saved successfully' });
            } else {
                this.loader.hide();
                this.messageService.add({ severity: 'error', summary: res.body.error || 'Error', detail: res.body.message || 'Failed to save employee data' });
            }
        });
    }

    deleteEmployee(employee: ITenantUser) {
        this.confirmationService.confirm({
            message: `Are you sure you want to Exit the ${employee.firstName} ${employee.lastName}?`,
            header: 'Exit Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.loader.show('Exiting Staff');
                this.employeeService.delete(+employee.id!, null).subscribe({
                    next: () => {
                        this.load();
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Staff exited successfully' });
                    },
                    error: () => {
                        this.loader.hide();
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to exit staff' });
                    }
                });
            }
        });
    }

    getAuthorityNames(authorities: any): string {
        return authorities?.map((a: any) => a.name).join(', ') || 'N/A';
    }

    editEmployee(employee: ITenantUser) {
        this.studentDialog = true;
        this.employee = { ...employee };
    }
}
