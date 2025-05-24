import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { Gender } from '../../../core/model/auth';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments, getBranch } from '../../../core/store/user-profile/user-profile.selectors';
import { IBranch } from '../../models/tenant.model';
import { NewTenantUser, ITenantUser, NewProfileConfig, IProfileConfig, IStudentProfile, ITenantAuthority, IRoleConfigs, IGuardianProfile, ITeacherProfile, ILecturerProfile, IProfessorProfile, IHeadOfDepartmentProfile, IHeadMasterProfile, IPrincipalProfile, IVicePrincipalProfile, ISportsCoachProfile, ISubstituteTeacherProfile, IITAdministratorProfile } from '../../models/user.model';
import { ProfileConfigFormService } from '../../service/profile-config-form.service';
import { TenantUserFormService } from '../../service/tenant-user-form.service';
import { UserService } from '../../service/user.service';
import { MultiSelect } from 'primeng/multiselect';

@Component({
  selector: 'app-employee-dialog',
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
        FormsModule,
        MultiSelect
  ],
  templateUrl: './employee-dialog.component.html',
  styles: ``
})
export class EmployeeDialogComponent {
  studentService = inject(UserService);
  tenantUserFormService = inject(TenantUserFormService);
  profileConfigFormService = inject(ProfileConfigFormService);
  private store = inject(Store<{ userProfile: UserProfileState }>);

  @Input() visible: boolean = false;
  @Input() statuses: any[] = [];
  @Input() set employee(employee: NewTenantUser | ITenantUser) {
    this._employee = employee;
    if (this.employeeForm) {
      this.tenantUserFormService.resetForm(this.employeeForm, employee);
    }
  }
  get employee(): NewTenantUser | ITenantUser {
    return this._employee;
  }

  @Input() set employeeProfile(profile: NewProfileConfig | IProfileConfig) {
    
    this._employeeProfile = profile;
  }
  get employeeProfile(): NewProfileConfig | IProfileConfig {
    return this._employeeProfile;
  }

  @Output() save = new EventEmitter<{ employee: NewTenantUser | ITenantUser; employeeProfile: NewProfileConfig | IProfileConfig }>();
  @Output() cancel = new EventEmitter<void>();

  private _employee!: NewTenantUser | ITenantUser;
  private _employeeProfile!: NewProfileConfig | IProfileConfig;
  
  employeeForm!: FormGroup;
  employeeProfileForm!: FormGroup;
  submitted: boolean = false;
  availableAuthorities: any[] = [];
  associatedDepartments: any[] = [];
  associatedBranch: IBranch | undefined;
  selectedDepartments: any;
  selectedClass: any;
  selectedSection: any;
  selectedGender: Gender = Gender.MALE;
  genderOptions: any[] = [
    { label: 'Female', value: 'FEMALE' },
    { label: 'Male', value: 'MALE' },
    { label: 'Other', value: 'OTHER' }
  ];
  branch:IBranch | any;
  contactNumber:any;
  ngOnInit(): void {
    this.employeeForm = this.tenantUserFormService.createTenantUserFormGroup(this.employee);
    this.employeeProfileForm = this.profileConfigFormService.createProfileConfigFormGroup(this.employeeProfile);
    this.contactNumber = this.employeeProfileForm.get('contactNumber').value;
    this.studentService.getAuthorities().subscribe((response: any) => {
      this.availableAuthorities = response.body.filter(((authority:any)=>authority.name != "STUDENT" && authority.name != "GUARDIAN")).map((authority:any)=> { return {name:authority.name}});
    });

    this.store.select(getAssociatedDepartments).subscribe(departments => {
      
      this.associatedDepartments = departments.map((department: any) => {
        return { ...department, name: department.department?.name };
      });
      this.selectedDepartments = this.associatedDepartments
      .filter(department=> this._employeeProfile.departments?.includes(department.id)) ;
    });

     this.store.select(getBranch).subscribe(branch => {
       this.branch = branch;
    });
  }

  // private setClassAndSectionFromProfile(): void {
  //   if (this._employeeProfile?.roles && this.selectedDepartment?.department?.classes) {
  //     const studentRole = this._employeeProfile.roles.employee as IStudentProfile;
  //     if (studentRole.classId) {
  //       const foundClass = this.selectedDepartment.department.classes.find(
  //         (cls: any) => cls.id == studentRole.classId
  //       );
  //       if (foundClass) {
  //         this.selectedClass = foundClass;
          
  //         if (studentRole.sectionId && this.selectedClass?.sections) {
  //           const foundSection = this.selectedClass.sections.find(
  //             (sec: any) => sec.id == studentRole.sectionId
  //           );
  //           if (foundSection) {
  //             this.selectedSection = foundSection;
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  onSave() {
    if(this.selectedDepartments.length){
    this.submitted = true;
    const updatedStudent = this.tenantUserFormService.getTenantUser(this.employeeForm);
    
    if (!updatedStudent.id) {
      updatedStudent.branch = this.branch;
      updatedStudent.passwordHash = "";
    }

    this.generateUserProfile(updatedStudent);
    }
   
  }

  async generateUserProfile(updatedStudent: ITenantUser | NewTenantUser) {
    const profileFormData = this.profileConfigFormService.getProfileConfig(this.employeeProfileForm);
    this.employeeProfile = {
      ...profileFormData,
      id: profileFormData.id ?? null,
      userId: updatedStudent.id?.toString(),
      academicYear: this.selectedDepartments[0]?.academicYear,
      username: updatedStudent.login,
      email: updatedStudent.email,
      contactNumber:this.contactNumber,
      fullName: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
      gender: this.selectedGender,
      departments: [...this.selectedDepartments.map(deprt=>deprt.id)],
      roles: await this.generateRoleConfig(updatedStudent.authorities!,profileFormData.roles)
    };

    this.save.emit({
      employee: updatedStudent,
      employeeProfile: this.employeeProfile
    });
  }

   generateRoleConfig(authorities: ITenantAuthority[] | null,existingRoles:any): IRoleConfigs {
    const roleConfig: IRoleConfigs | any = {
   
    };
    authorities?.forEach((authority) => {
      switch (authority?.name) {
        case 'STUDENT':

          if( !existingRoles?.[authority.name]){
            roleConfig.employee = {
              classId: this.selectedClass?.id ?? null,
              sectionId: this.selectedSection?.id ?? null,
              rollNumber: null
            } as IStudentProfile;
          }
         
          break;
        case 'GUARDIAN':
           if(!existingRoles?.[authority.name]){
             roleConfig.parent = {
              studentIds:[],

             } as IGuardianProfile;
           }
          break;
        case 'TEACHER':
           if(!existingRoles?.[authority.name]){
             roleConfig.teacher = {
              subjectIds:[],

             } as ITeacherProfile;
           }
    
          break;
        case 'LECTURER':
            if(!existingRoles?.[authority.name]){
             roleConfig.lecturer = {
              subjectIds:[]
             } as ILecturerProfile;
            }
          break;
        case 'PROFESSOR':
            if(!existingRoles?.[authority.name]){
             roleConfig.professor = {
              subjectIds:[],

             } as IProfessorProfile;
           }
          
          break;
        case 'HEAD_OF_DEPARTMENT':
            if(!existingRoles?.[authority.name]){
            roleConfig.headofdepartment = {

            } as IHeadOfDepartmentProfile;
           }
        
          break;
        case 'HEAD_MASTER':
            if(!existingRoles?.[authority.name]){
             roleConfig.headmaster = {

             } as IHeadMasterProfile;
           }
      
          break;
        case 'PRINCIPAL':
            if(!existingRoles?.[authority.name]){
            roleConfig.principal = {

            } as IPrincipalProfile;
           }
 
          break;
        case 'VICE_PRINCIPAL':
            if(!existingRoles?.[authority.name]){
           roleConfig.viceprincipal = {

           } as IVicePrincipalProfile;
           }
    
          break;
        case 'SPORTS_COACH':
            if(!existingRoles?.[authority.name]){
            roleConfig.sportscoach = {

            } as ISportsCoachProfile;
           }
       
          break;
        case 'SUBSTITUTE_TEACHER':
           if(!existingRoles?.[authority.name]){
            roleConfig.substituteteacher = {
               subjectIds:[]
            } as ISubstituteTeacherProfile;
           }

          break;
        case 'IT_ADMINISTRATOR':
          if(!existingRoles?.[authority.name]){
             roleConfig.itadmin = {

             } as IITAdministratorProfile;
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
