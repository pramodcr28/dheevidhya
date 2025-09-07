import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ChipModule } from 'primeng/chip';
import { AuthServerProvider } from '../../core/services/auth-jwt.service';
import { Store } from '@ngrx/store';
import { UserProfileState } from '../../core/store/user-profile/user-profile.reducer';
import { selectUserConfig } from '../../core/store/user-profile/user-profile.selectors';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RouterLink } from '@angular/router';

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
  imports: [
    ButtonModule, ToastModule, PasswordModule, CommonModule, 
    FormsModule, ReactiveFormsModule, CardModule, AvatarModule, 
    TagModule, DividerModule, TabViewModule, InputTextModule,
    CalendarModule, DropdownModule, ChipModule,ConfirmDialogModule,RouterLink
  ],
  templateUrl: './profile.component.html',
  styles: `
  
  `,
  providers: [MessageService,ConfirmationService]
})
export class ProfileComponent {
  passwordForm!: FormGroup;
  loading = false;
   private store = inject(Store<{ userProfile: UserProfileState }>);
  // Real user profile data from API
  userProfile: UserProfile;

  constructor(
    private fb: FormBuilder,
    private passwordService: AuthServerProvider,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.store.select(selectUserConfig).subscribe(userConfig => {
               this.userProfile = userConfig;
              });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      isTenantUser: [true]
    });
  }
  confirmLogout(){

  }

  onSubmit() {
    if (this.passwordForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields correctly.'
      });
      return;
    }

    this.loading = true;
        
    this.passwordService.changePassword(this.passwordForm.value)
      .subscribe(
        response => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Password changed successfully!'
          });
          const isTenantUser = this.passwordForm.get('isTenantUser')?.value;
          this.passwordForm.reset({ isTenantUser });
        },
        error => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to change password. Please try again.'
          });
        }
      );
  }

  getActiveRole(): string {
    const roles = this.userProfile.roles;
    if (roles.itadmin) return 'IT Admin';
    if (roles.principal) return 'Principal';
    if (roles.headmaster) return 'Headmaster';
    if (roles.headofdepartment) return 'Head of Department';
    if (roles.teacher) return 'Teacher';
    if (roles.student) return 'Student';
    return 'User';
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warn' | 'danger' } = {
      'IT Admin': 'danger',
      'Principal': 'success',
      'Headmaster': 'success',
      'Head of Department': 'info',
      'Teacher': 'info',
      'Student': 'warn'
    };
    return severityMap[role] || 'info';
  }

  formatClassName(name: string): string {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatSectionName(name: string): string {
    return name.replace('SECTION_', 'Section ');
  }

  formatSubjectName(name: string): string {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDepartmentName(name: string): string {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getAvatarInitials(): string {
    return this.userProfile.fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getTotalClasses(): number {
    return this.userProfile.departments.reduce((total, dept) => 
      total + dept.department.classes.length, 0
    );
  }

  getTotalSections(): number {
    return this.userProfile.departments.reduce((total, dept) => 
      total + dept.department.classes.reduce((classTotal, cls) => 
        classTotal + cls.sections.length, 0
      ), 0
    );
  }

  getTotalSubjects(): number {
    return this.userProfile.departments.reduce((total, dept) => 
      total + dept.department.classes.reduce((classTotal, cls) => 
        classTotal + cls.sections.reduce((sectionTotal, section) => 
          sectionTotal + section.subjects.length, 0
        ), 0
      ), 0
    );
  }
}