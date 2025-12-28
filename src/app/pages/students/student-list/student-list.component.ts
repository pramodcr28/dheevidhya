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
import { IProfileConfig, ITenantUser, NewProfileConfig, NewTenantUser } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantAuthorityService } from '../../service/tenant-authority.service';
import { UserService } from '../../service/user.service';
import { GuardianDialogComponent } from '../guardian-dialog/guardian-dialog.component';
import { StudentDialogComponent } from '../student-dialog/student-dialog.component';

@Component({
    selector: 'app-student-list',
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
        GuardianDialogComponent,
        StudentDialogComponent
    ],
    templateUrl: './student-list.component.html',
    providers: [MessageService, ConfirmationService]
})
export class StudentListComponent {
    private store = inject(Store<{ userProfile: UserProfileState }>);
    studentDialog: boolean = false;
    guardianDialog: boolean = false;
    student!: NewTenantUser | ITenantUser;
    studentProfile!: NewProfileConfig | IProfileConfig | any;
    selectedGaurdian!: NewTenantUser | ITenantUser;
    selectedGaurdianProfile!: NewProfileConfig | IProfileConfig | any;
    selectedStudentProfile!: NewProfileConfig | IProfileConfig | any;
    submitted: boolean = false;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    subscription: Subscription | null = null;
    tenantAuthorities = signal<[]>([]);
    isLoading = false;
    students = signal<any[] | null>([]);
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 1;
    router = inject(Router);
    studentService = inject(UserService);
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
        this.loader.show('Fetching Student Data');
        this.studentService.search(0, 100, 'id', 'ASC', { 'profileType.equals': 'STUDENT', 'departments.in': this.commonService.associatedDepartments.map((dpt) => dpt.id) }).subscribe({
            next: (res: any) => {
                this.students.set(res.content);
                this.loader.hide();
            }
        });
    }

    openNew() {
        this.student = {
            authorities: [this.tenantAuthorities().find((a: any) => a.name === 'STUDENT')],
            isTenantUser: true,
            activated: true,
            imageUrl: '',
            email: 'NA',
            passwordHash: 'User@123'
        } as NewTenantUser | any;

        this.studentProfile = {} as NewProfileConfig;
        this.submitted = false;
        this.studentDialog = true;
    }

    hideDialog() {
        this.loader.hide();
        this.studentDialog = false;
        this.guardianDialog = false;
        this.submitted = false;
    }

    onStudentSave(userConfig: { user: NewTenantUser | ITenantUser; profile: NewProfileConfig | IProfileConfig | any }) {
        this.submitted = true;

        for (let role in userConfig.profile?.roles) {
            if (userConfig.profile.roles[role] == null) {
                delete userConfig.profile.roles[role];
            }
        }

        userConfig.user.branchId = this.commonService.branch.id;
        userConfig.profile.profileType = 'STUDENT';
        this.loader.show('Adding new Student');
        this.studentService.create(userConfig).subscribe((result) => {
            this.hideDialog();
            this.load();
            this.messageService.add({ text: 'Congrats! Record created!', closeIcon: 'close' });
        });
    }

    onGuardianSave(userConfig: { user: NewTenantUser | ITenantUser; profile: NewProfileConfig | IProfileConfig | any }) {
        this.loader.show('Updating Guardian Info');
        if (!userConfig.user.id) {
            for (let role in userConfig.profile?.roles) {
                if (userConfig.profile.roles[role] == null) {
                    delete userConfig.profile.roles[role];
                }
            }

            userConfig.user.branchId = this.commonService.branch.id;
            userConfig.profile.profileType = 'GUARDIAN';
            this.loader.show('Adding new Student');
            this.studentService.create(userConfig).subscribe((result: any) => {
                if (this.selectedStudentProfile.roles?.student) {
                    this.selectedStudentProfile.roles.student.guardianId = result.body?.user.id.toString();
                }
                this.profileService.update(this.selectedStudentProfile as IProfileConfig).subscribe((result) => {
                    setTimeout(() => {
                        this.hideDialog();
                        this.load();
                        this.messageService.add({ text: 'Congrats! Record updated!', closeIcon: 'close' });
                    });
                });
            });
        }
    }

    deleteStudent(student: IProfileConfig) {
        this.loader.show('Deleting Student');
        this.studentService.delete(+student.userId, +student.roles?.student?.guardianId).subscribe((res) => {
            this.load();
            this.loader.hide();
            this.messageService.add({ severity: 'worn', summary: 'Worn Message', detail: 'Student Deleted Successful!!!' });
        });
    }

    editStudent(student: IProfileConfig) {
        this.studentService.find(+student.userId).subscribe((result: any) => {
            this.studentProfile = student;
            this.student = { ...result.body };
            this.studentDialog = true;
        });
    }

    addOrEditGuardian(student: IProfileConfig) {
        let gaurdianId = student.roles?.student?.guardianId;
        this.selectedStudentProfile = student as any;
        if (gaurdianId) {
            this.studentService.find(gaurdianId).subscribe((result: any) => {
                this.studentService.search(0, 10, 'id', 'ASC', { 'user_id.in': [gaurdianId] }).subscribe((profiles) => {
                    if (profiles.content) {
                        this.selectedGaurdianProfile = profiles.content[0];
                        this.selectedGaurdian = { ...result.body };
                        this.guardianDialog = true;
                    } else {
                        this.loader.hide();
                    }
                });
            });
        } else {
            this.selectedGaurdian = {
                authorities: [this.tenantAuthorities().find((a: any) => a.name === 'GUARDIAN')],
                isTenantUser: true,
                activated: true,
                imageUrl: '',
                email: '',
                passwordHash: 'User@1234'
            } as NewTenantUser | any;

            this.selectedGaurdianProfile = {
                departments: student.departments
            } as NewProfileConfig;
            this.guardianDialog = true;
        }
    }

    hideGuardianDialog() {
        this.guardianDialog = false;
    }
}
