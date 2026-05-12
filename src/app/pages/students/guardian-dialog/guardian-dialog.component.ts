
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { CommonService } from '../../../core/services/common.service';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { IGuardianProfile, IProfileConfig, IRoleConfigs, ITenantAuthority, ITenantUser, NewProfileConfig, NewTenantUser } from '../../models/user.model';
import { ProfileConfigFormService } from '../../service/profile-config-form.service';
import { TenantUserFormService } from '../../service/tenant-user-form.service';
import { UserService } from '../../service/user.service';

@Component({
    selector: 'app-guardian-dialog',
    imports: [
    SelectModule,
    RadioButtonModule,
    InputNumberModule,
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
    templateUrl: './guardian-dialog.component.html',
    standalone: true
})
export class GuardianDialogComponent implements OnInit {
    studentService = inject(UserService);
    tenantUserFormService = inject(TenantUserFormService);
    profileConfigFormService = inject(ProfileConfigFormService);
    private store = inject(Store<{ userProfile: UserProfileState }>);
    // branch: IBranch | any;
    @Input() visible: boolean = false;
    @Input() set gaurdian(value: NewTenantUser | ITenantUser) {
        this._gaurdian = value;
        if (this.guardianForm) {
            this.tenantUserFormService.resetForm(this.guardianForm, value);
        }
    }
    get gaurdian(): NewTenantUser | ITenantUser {
        return this._gaurdian;
    }
    @Input() studentProfile: IProfileConfig | any;

    @Input() set guardianProfile(value: NewProfileConfig | IProfileConfig) {
        this._guardianProfile = value;
        this.contactNumber = value.contactNumber;
        if (this.guardianProfileForm && value) {
            this.profileConfigFormService.resetForm(this.guardianProfileForm, value);
        }
    }
    get guardianProfile(): NewProfileConfig | IProfileConfig {
        return this._guardianProfile;
    }

    @Output() save = new EventEmitter<{ user: NewTenantUser | ITenantUser; profile: NewProfileConfig | IProfileConfig }>();
    @Output() cancel = new EventEmitter<void>();

    private _gaurdian!: NewTenantUser | ITenantUser;
    private _guardianProfile!: NewProfileConfig | IProfileConfig;
    commonService = inject(CommonService);
    guardianForm!: FormGroup;
    guardianProfileForm!: FormGroup;
    submitted: boolean = false;
    selectedGender: Gender = Gender.MALE;
    contactNumber: any;
    genderOptions: any[] = [
        { label: 'Female', value: 'FEMALE' },
        { label: 'Male', value: 'MALE' },
        { label: 'Other', value: 'OTHER' }
    ];

    ngOnInit(): void {
        this.guardianForm = this.tenantUserFormService.createTenantUserFormGroup(this.gaurdian);
        this.guardianProfileForm = this.profileConfigFormService.createProfileConfigFormGroup(this.guardianProfile);
    }

    onSave() {
        this.submitted = true;
        const updatedGuardian = this.tenantUserFormService.getTenantUser(this.guardianForm);

        this.generateUserProfile(updatedGuardian);
    }

    async generateUserProfile(updatedGuardian: ITenantUser | NewTenantUser) {
        const profileFormData = this.profileConfigFormService.getProfileConfig(this.guardianProfileForm);
        this.guardianProfile = {
            ...profileFormData,
            id: profileFormData.id ?? null,
            userId: updatedGuardian.id?.toString(),
            academicYear: 'NA',
            username: updatedGuardian.login,
            email: updatedGuardian.email,
            contactNumber: this.contactNumber,
            fullName: `${updatedGuardian.firstName} ${updatedGuardian.lastName}`,
            departments: this.studentProfile.departments,
            gender: this.selectedGender,
            roles: await this.generateRoleConfig(updatedGuardian.authorities!, profileFormData.roles)
        };
        updatedGuardian.branchId = this.commonService?.branch?.id;

        this.save.emit({
            user: updatedGuardian,
            profile: this.guardianProfile
        });
    }

    generateRoleConfig(authorities: ITenantAuthority[] | null, existingRoles: any): IRoleConfigs {
        const roleConfig: IRoleConfigs | any = {};
        authorities?.forEach((authority) => {
            switch (authority?.name) {
                case 'GUARDIAN':
                    if (!existingRoles?.[authority?.name]) {
                        roleConfig.parent = {
                            childrens: [this.studentProfile.userId]
                        } as IGuardianProfile;
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
