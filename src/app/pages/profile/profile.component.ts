import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AuthServerProvider } from '../../core/services/auth-jwt.service';
import { CommonService } from '../../core/services/common.service';
import { DheeConfirmationService } from '../../core/services/dhee-confirmation.service';
import { UserProfileState } from '../../core/store/user-profile/user-profile.reducer';
import { selectUserConfig } from '../../core/store/user-profile/user-profile.selectors';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { TenantAuthorityService } from '../service/tenant-authority.service';
import { clearUserProfile } from './../../core/store/user-profile/user-profile.actions';

interface UserProfile {
    id: string;
    userId: string;
    academicYear: string;
    username: string;
    email: string;
    fullName: string;
    contactNumber: string;
    reportsTo: string | null;
    gender: string;
    departments: Department[];
    roles: UserRoles;
}

interface Department {
    id: string;
    department: DepartmentInfo;
    academicYear: string;
    academicStart: string;
    academicEnd: string;
    status: boolean;
}

interface DepartmentInfo {
    id: string;
    name: string;
    description: string | null;
    code: string;
    status: boolean;
    classes: Class[];
    hod: string;
}

interface Class {
    id: string;
    name: string;
    code: string;
    description: string | null;
    sections: Section[];
    status: boolean;
}

interface Section {
    id: string;
    name: string;
    code: string;
    capacity: number;
    description: string;
    sectionTeacher: string;
    status: boolean;
    subjects: Subject[];
}

interface Subject {
    id: string;
    name: string;
    code: string;
    description: string | null;
    subjectType: string;
    status: boolean;
    teacher: string;
    exams: Exam[];
}

interface Exam {
    examId: string;
    instructorId: string | null;
    startDateTime: string | null;
    endDateTime: string | null;
    totalMarks: number;
    chapters: string | null;
    additionalNotes: string | null;
    status: string;
}

interface UserRoles {
    student: any;
    parent: any;
    teacher: any;
    lecturer: any;
    professor: any;
    headofdepartment: any;
    headmaster: any;
    principal: any;
    viceprincipal: any;
    sportscoach: any;
    itadmin: {
        responsibilities: string | null;
    } | null;
}

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        ButtonModule,
        ToastModule,
        PasswordModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CardModule,
        AvatarModule,
        TagModule,
        DividerModule,
        TabViewModule,
        InputTextModule,
        CalendarModule,
        DropdownModule,
        ChipModule,
        ConfirmDialogModule,
        ConfirmationDialogComponent
    ],
    templateUrl: './profile.component.html',
    styles: ``,
    providers: [MessageService, DheeConfirmationService]
})
export class ProfileComponent {
    passwordForm!: FormGroup;
    loading = false;
    private store = inject(Store<{ userProfile: UserProfileState }>);
    userProfile!: UserProfile;
    authorityService = inject(TenantAuthorityService);
    commonService = inject(CommonService);
    tenantAuthorities = signal<any[]>([]);
    messageService = inject(MessageService);
    passwordService = inject(AuthServerProvider);
    fb = inject(FormBuilder);
    router = inject(Router);
    ngOnInit() {
        this.authorityService.query().subscribe((result: any) => {
            this.tenantAuthorities.set(result.body || []);
        });
        this.store.select(selectUserConfig).subscribe((userConfig) => {
            this.userProfile = userConfig;
        });
        this.passwordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            isTenantUser: [true]
        });
    }

    hasRole(roleName: string): boolean {
        const userAuthorities = this.commonService.getUserAuthorities;
        return userAuthorities?.includes(roleName);
    }

    getActiveRole(): string {
        if (this.hasRole('SUPER_ADMIN')) return 'Super Admin';
        if (this.hasRole('IT_ADMINISTRATOR')) return 'IT Admin';
        if (this.hasRole('PRINCIPAL')) return 'Principal';
        if (this.hasRole('VICE_PRINCIPAL')) return 'Vice Principal';
        if (this.hasRole('HEAD_MASTER')) return 'Headmaster';
        if (this.hasRole('HEAD_OF_DEPARTMENT')) return 'HOD';
        if (this.hasRole('TEACHER')) return 'Teacher';
        if (this.hasRole('LECTURER')) return 'Lecturer';
        if (this.hasRole('STUDENT')) return 'Student';
        return 'User';
    }

    getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' {
        const severityMap: { [key: string]: 'success' | 'info' | 'warn' | 'danger' } = {
            'Super Admin': 'danger',
            'IT Admin': 'danger',
            Principal: 'success',
            'Vice Principal': 'success',
            Headmaster: 'success',
            HOD: 'info',
            Teacher: 'info',
            Lecturer: 'info',
            Student: 'warn'
        };
        return severityMap[role] || 'info';
    }

    formatRoleName(role: string): string {
        if (!role) return '';
        return role
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    formatClassName(name: string): string {
        return name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }

    formatSectionName(name: string): string {
        return name.replace('SECTION_', 'Section ');
    }

    formatSubjectName(name: string): string {
        return name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }

    formatDepartmentName(name: string): string {
        return name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }

    getAvatarInitials(): string {
        const fullName = this.userProfile?.fullName;
        if (!fullName) return '';
        return fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    getTotalClasses(): number {
        return this.userProfile?.departments?.reduce((total, dept) => total + (dept.department?.classes?.length || 0), 0) || 0;
    }

    getTotalSections(): number {
        return this.userProfile?.departments?.reduce((total, dept) => total + (dept.department?.classes?.reduce((classTotal, cls) => classTotal + (cls.sections?.length || 0), 0) || 0), 0) || 0;
    }

    getTotalSubjects(): number {
        return (
            this.userProfile?.departments?.reduce(
                (total, dept) => total + (dept.department?.classes?.reduce((classTotal, cls) => classTotal + (cls?.sections?.reduce((sectionTotal, section) => sectionTotal + (section?.subjects?.length ?? 0), 0) || 0), 0) || 0),
                0
            ) || 0
        );
    }

    confirmLogout() {
        this.store.dispatch(clearUserProfile());
        this.router.navigate(['/auth/login']);
    }

    onSubmit() {
        if (this.passwordForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields correctly.' });
            return;
        }
        this.loading = true;
        this.passwordService.changePassword(this.passwordForm.value).subscribe((response) => {
            if (response.status == 200) {
                this.loading = false;
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password changed successfully!' });
                const isTenantUser = this.passwordForm.get('isTenantUser')?.value;
                this.passwordForm.reset({ isTenantUser });
            } else {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message || 'Failed to change password. Please try again.' });
            }
        });
    }
}
