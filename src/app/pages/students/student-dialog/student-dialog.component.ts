import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TextareaModule } from 'primeng/textarea';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { IProfileConfig, ITenantUser, NewProfileConfig, NewTenantUser,IStudentProfile, IGuardianProfile, IHeadMasterProfile, IHeadOfDepartmentProfile, IITAdministratorProfile, ILecturerProfile, IPrincipalProfile, IProfessorProfile, IRoleConfigs, ISportsCoachProfile, ISubstituteTeacherProfile, ITeacherProfile, ITenantAuthority, IVicePrincipalProfile } from '../../models/user.model';
import { UserService } from '../../service/user.service';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { Store } from '@ngrx/store';
import { getAssociatedDepartments } from '../../../core/store/user-profile/user-profile.selectors';
import { IBranch } from '../../models/tenant.model';
import { TenantUserFormService } from '../../service/tenant-user-form.service';
import { ProfileConfigFormService } from '../../service/profile-config-form.service';
import { Gender } from '../../../core/model/auth';

@Component({
  selector: 'app-student-dialog',
  imports: [
    SelectModule,
    RadioButtonModule,
    InputNumberModule,
    CommonModule,
    ButtonModule,
    RippleModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule,
    SelectModule,
    ReactiveFormsModule,
    ToggleButtonModule,
    FormsModule
  ],
  templateUrl: './student-dialog.component.html',
  standalone: true
})
export class StudentDialogComponent implements OnInit {
  studentService = inject(UserService);
  tenantUserFormService = inject(TenantUserFormService);
  profileConfigFormService = inject(ProfileConfigFormService);
  private store = inject(Store<{ userProfile: UserProfileState }>);

  @Input() visible: boolean = false;
  @Input() statuses: any[] = [];
  @Input() set student(value: NewTenantUser | ITenantUser) {
    this._student = value;
    if (this.studentForm) {
      this.tenantUserFormService.resetForm(this.studentForm, value);
    }
  }
  get student(): NewTenantUser | ITenantUser {
    return this._student;
  }

  @Input() set studentProfile(value: NewProfileConfig | IProfileConfig) {
    this._studentProfile = value;
    if (this.studentProfileForm && value) {
      this.profileConfigFormService.resetForm(this.studentProfileForm, value);
      
      if (value.departments && value.departments.length > 0) {
        const departmentId = value.departments[0];
        const foundDepartment = this.associatedDepartments.find(dep => dep.id === departmentId);
        if (foundDepartment) {
          this.selectedDepartment = foundDepartment;
          
          if (value.roles && value.roles.student) {
            const studentRole = value.roles.student as IStudentProfile;
            
            // Find class
            if (studentRole.classId && this.selectedDepartment?.department?.classes) {
              const foundClass = this.selectedDepartment.department.classes.find(
                (cls: any) => cls.id === studentRole.classId
              );
              if (foundClass) {
                this.selectedClass = foundClass;
                
                // Find section
                if (studentRole.sectionId && this.selectedClass?.sections) {
                  const foundSection = this.selectedClass.sections.find(
                    (sec: any) => sec.id === studentRole.sectionId
                  );
                  if (foundSection) {
                    this.selectedSection = foundSection;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  get studentProfile(): NewProfileConfig | IProfileConfig {
    return this._studentProfile;
  }

  @Output() save = new EventEmitter<{ student: NewTenantUser | ITenantUser; studentProfile: NewProfileConfig | IProfileConfig }>();
  @Output() cancel = new EventEmitter<void>();

  private _student!: NewTenantUser | ITenantUser;
  private _studentProfile!: NewProfileConfig | IProfileConfig;
  
  studentForm!: FormGroup;
  studentProfileForm!: FormGroup;
  submitted: boolean = false;
  availableAuthorities: any[] = [];
  associatedDepartments: any[] = [];
  associatedBranch: IBranch | undefined;
  selectedDepartment: any;
  selectedClass: any;
  selectedSection: any;
  selectedGender: Gender = Gender.MALE;
  genderOptions: any[] = [
    { label: 'Female', value: 'FEMALE' },
    { label: 'Male', value: 'MALE' },
    { label: 'Other', value: 'OTHER' }
  ];

  ngOnInit(): void {
    this.studentForm = this.tenantUserFormService.createTenantUserFormGroup(this.student);
    this.studentProfileForm = this.profileConfigFormService.createProfileConfigFormGroup(this.studentProfile);
    
    this.studentService.getAuthorities().subscribe((response: any) => {
      this.availableAuthorities = response.body;
    });

    this.store.select(getAssociatedDepartments).subscribe(departments => {
      this.associatedDepartments = departments.map((department: any) => {
        return { ...department, name: department.department?.name };
      });
      
      if (this._studentProfile && this._studentProfile.departments && this._studentProfile.departments.length > 0) {
        const departmentId = this._studentProfile.departments[0];
        const foundDepartment = this.associatedDepartments.find(dep => dep.id === departmentId);
        if (foundDepartment) {
          this.selectedDepartment = foundDepartment;
          this.setClassAndSectionFromProfile();
        }
      }
    });
  }

  private setClassAndSectionFromProfile(): void {
    if (this._studentProfile?.roles?.student && this.selectedDepartment?.department?.classes) {
      const studentRole = this._studentProfile.roles.student as IStudentProfile;
      if (studentRole.classId) {
        const foundClass = this.selectedDepartment.department.classes.find(
          (cls: any) => cls.id == studentRole.classId
        );
        if (foundClass) {
          this.selectedClass = foundClass;
          
          if (studentRole.sectionId && this.selectedClass?.sections) {
            const foundSection = this.selectedClass.sections.find(
              (sec: any) => sec.id == studentRole.sectionId
            );
            if (foundSection) {
              this.selectedSection = foundSection;
            }
          }
        }
      }
    }
  }

  onSave() {
    this.submitted = true;
    const updatedStudent = this.tenantUserFormService.getTenantUser(this.studentForm);
    
    if (!updatedStudent.id) {
      updatedStudent.branch = this.selectedDepartment.branch;
      updatedStudent.passwordHash = "";
    }

    this.generateUserProfile(updatedStudent);
  }

  async generateUserProfile(updatedStudent: ITenantUser | NewTenantUser) {
    const profileFormData = this.profileConfigFormService.getProfileConfig(this.studentProfileForm);
    this.studentProfile = {
      ...profileFormData,
      id: profileFormData.id ?? null,
      userId: updatedStudent.id?.toString(),
      academicYear: this.selectedDepartment.academicYear,
      username: updatedStudent.login,
      email: updatedStudent.email,
      fullName: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
      gender: this.selectedGender,
      departments: [this.selectedDepartment.id],
      roles: await this.generateRoleConfig(updatedStudent.authorities!,profileFormData.roles)
    };

    this.save.emit({
      student: updatedStudent,
      studentProfile: this.studentProfile
    });
  }

   generateRoleConfig(authorities: ITenantAuthority[] | null,existingRoles:any): IRoleConfigs {
    const roleConfig: IRoleConfigs | any = {
   
    };
    authorities?.forEach((authority) => {
      switch (authority?.name) {
        case 'STUDENT':

          if( !existingRoles?.[authority.name]){
            roleConfig.student = {
              classId: this.selectedClass?.id ?? null,
              sectionId: this.selectedSection?.id ?? null
            } as IStudentProfile;
          }
         
          break;
        case 'GUARDIAN':
           if(!existingRoles?.[authority.name]){
             roleConfig.parent = {} as IGuardianProfile;
           }
          break;
        case 'TEACHER':
           if(!existingRoles?.[authority.name]){
             roleConfig.teacher = {} as ITeacherProfile;
           }
    
          break;
        case 'LECTURER':
            if(!existingRoles?.[authority.name]){
             roleConfig.lecturer = {} as ILecturerProfile;
           }
       
          break;
        case 'PROFESSOR':
            if(!existingRoles?.[authority.name]){
             roleConfig.professor = {} as IProfessorProfile;
           }
          
          break;
        case 'HEAD_OF_DEPARTMENT':
            if(!existingRoles?.[authority.name]){
            roleConfig.headofdepartment = {} as IHeadOfDepartmentProfile;
           }
        
          break;
        case 'HEAD_MASTER':
            if(!existingRoles?.[authority.name]){
             roleConfig.headmaster = {} as IHeadMasterProfile;
           }
      
          break;
        case 'PRINCIPAL/DEAN':
            if(!existingRoles?.[authority.name]){
            roleConfig.principal = {} as IPrincipalProfile;
           }
 
          break;
        case 'VICE_PRINCIPAL':
            if(!existingRoles?.[authority.name]){
           roleConfig.viceprincipal = {} as IVicePrincipalProfile;
           }
    
          break;
        case 'SPORTS_COACH':
            if(!existingRoles?.[authority.name]){
            roleConfig.sportscoach = {} as ISportsCoachProfile;
           }
       
          break;
        case 'SUBSTITUTE_TEACHER':
           if(!existingRoles?.[authority.name]){
            roleConfig.substituteteacher = {} as ISubstituteTeacherProfile;
           }

          break;
        case 'IT_ADMINISTRATOR':
          if(!existingRoles?.[authority.name]){
             roleConfig.itadmin = {} as IITAdministratorProfile;
           }
          break;
        default:
          break;
      }
    });

    return roleConfig;
  }

  onCancel() {
    this.cancel.emit();
  }
}