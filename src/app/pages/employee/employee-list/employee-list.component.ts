import { CommonModule } from '@angular/common';
import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ConfirmationService, MessageService } from 'primeng/api';
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
import { ITEMS_PER_PAGE } from '../../../core/model/pagination.constants';
import { Column, ExportColumn } from '../../../core/model/table.model';
import { CommonService } from '../../../core/services/common.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { SortService } from '../../../shared/sort';
import { IProfileConfig, ITenantAuthority, ITenantUser, NewProfileConfig, NewTenantUser } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantAuthorityService } from '../../service/tenant-authority.service';
import { UserService } from '../../service/user.service';
import { EmployeeDialogComponent } from './../employee-dialog/employee-dialog.component';

@Component({
    selector: 'app-employee-list',
    imports: [CommonModule, TableModule, FormsModule, ButtonModule, RippleModule, ToastModule, ToolbarModule, RatingModule, InputTextModule, DialogModule, TagModule, InputIconModule, IconFieldModule, ConfirmDialogModule, EmployeeDialogComponent],
    templateUrl: './employee-list.component.html',
    styles: ``,
    providers: [MessageService, ConfirmationService]
})
export class EmployeeListComponent {
    private store = inject(Store<{ userProfile: UserProfileState }>);
    studentDialog: boolean = false;
    employee!: NewTenantUser | ITenantUser;
    // employeeProfile!: NewProfileConfig | IProfileConfig | any;
    submitted: boolean = false;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    subscription: Subscription | null = null;
    tenantAuthorities = signal<ITenantAuthority[]>([]);
    isLoading = false;
    // employeeProfiles = signal<IProfileConfig[] | null>([]);
    employees = signal<ITenantUser[]>([]);
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 1;
    router = inject(Router);
    employeeService = inject(UserService);
    profileService = inject(ProfileConfigService);
    authorityService = inject(TenantAuthorityService);
    activatedRoute = inject(ActivatedRoute);
    sortService = inject(SortService);
    ngZone = inject(NgZone);
    messageService = inject(MessageService);
    confirmationService = inject(ConfirmationService);
    loader = inject(ApiLoaderService);
    commonService = inject(CommonService);

    ngOnInit() {
        this.authorityService.query().subscribe((result: any) => {
            this.tenantAuthorities.set(result.body);
        });
        this.load();
    }

    load(): void {
        this.loader.show('Fetching Staff Data');
        // let searchCriteria: any = { 'profileType.equals': 'STAFF' };

        // if (this.commonService.getUserAuthorities.includes('SUPER_ADMIN')) {
        //     searchCriteria['branchId.like'] = this.commonService.getUserInfo?.branchId;
        // } else {
        //     searchCriteria['departments.in'] = this.commonService.associatedDepartments.map((dpt) => dpt.id);
        // }
        this.employeeService.userSearch(0, 100, 'id', 'ASC', {}).subscribe({
            next: (res: any) => {
                this.employees.set(res.content);
                this.loader.hide();
            }
        });
    }

    openNew() {
        this.employee = {
            authorities: [],
            isTenantUser: true,
            activated: true,
            imageUrl: '',
            email: '',
            passwordHash: 'User@123'
        } as NewTenantUser | any;

        // this.employeeProfile = {} as NewProfileConfig;
        this.submitted = false;
        this.studentDialog = true;
    }

    hideDialog() {
        this.studentDialog = false;
        this.submitted = false;
        this.loader.hide();
    }

    onEmployeeSave(userConfig: { user: NewTenantUser | ITenantUser; profile: NewProfileConfig | IProfileConfig | any }) {
        this.submitted = true;
        for (let role in userConfig.profile.roles) {
            if (userConfig.profile.roles[role] == null) {
                delete userConfig.profile.roles[role];
            }
        }
        this.loader.show('Updating new Staff');
        userConfig.profile.profileType = 'STAFF';
        userConfig.user.passwordHash = 'User@123';
        this.employeeService.create(userConfig).subscribe((result) => {
            this.hideDialog();
            this.load();
            this.messageService.add({ text: 'Congrats! Record created!', closeIcon: 'close' });
        });
    }

    deleteEmployee(employee: IProfileConfig) {
        this.employeeService.delete(+employee.userId, null).subscribe((res) => {
            this.load();
        });
    }

    getAuthorityNames(authorities: any): string {
        return authorities?.map((a: any) => a.name).join(', ');
    }

    editEmployee(employee: IProfileConfig) {
        this.studentDialog = true;
        this.employee = { ...employee };
        // this.profileService.find(+employee.userId).subscribe((result: any) => {
        //     this.employee = result.body && (result.body as any).user ? (result.body as any).user : (employee as any);
        // this.employeeProfile = { ...result.body };
        // });
    }
}
