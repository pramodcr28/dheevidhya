import { Injectable, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ITenantUser, NewTenantUser, UserStatus } from '../models/user.model';
import { ProfileConfigFormService } from './profile-config-form.service';

@Injectable({ providedIn: 'root' })
export class TenantUserFormService {
    private profileFormService = inject(ProfileConfigFormService);

    createTenantUserFormGroup(tenantUser: ITenantUser | Partial<NewTenantUser> = { id: null }): FormGroup {
        return new FormGroup({
            id: new FormControl({ value: tenantUser.id, disabled: true }, { nonNullable: true, validators: [Validators.required] }),
            login: new FormControl(tenantUser.login, { validators: [Validators.required] }),
            firstName: new FormControl(tenantUser.firstName, { validators: [Validators.required] }),
            lastName: new FormControl(tenantUser.lastName),
            email: new FormControl(tenantUser.email, { validators: [Validators.email] }),
            imageUrl: new FormControl(tenantUser.imageUrl),
            activated: new FormControl(tenantUser.activated),
            langKey: new FormControl(tenantUser.langKey),
            houseNumber: new FormControl(tenantUser.houseNumber),
            street: new FormControl(tenantUser.street),
            locality: new FormControl(tenantUser.locality, { validators: [Validators.required] }),
            landmark: new FormControl(tenantUser.landmark),
            taluk: new FormControl(tenantUser.taluk),
            district: new FormControl(tenantUser.district, { validators: [Validators.required] }),
            state: new FormControl(tenantUser.state, { validators: [Validators.required] }),
            country: new FormControl(tenantUser.country, { validators: [Validators.required] }),
            postalCode: new FormControl(tenantUser.postalCode, { validators: [Validators.required] }),
            latitude: new FormControl(tenantUser.latitude),
            longitude: new FormControl(tenantUser.longitude),
            authorities: new FormControl(tenantUser.authorities ?? []),
            branchId: new FormControl(tenantUser.branchId),
            branchCode: new FormControl(tenantUser.branchCode),
            status: new FormControl(tenantUser.status ?? UserStatus.ACTIVE),

            // The profile is a nested FormGroup
            latestAcademicYear: this.profileFormService.createProfileConfigFormGroup(tenantUser.latestAcademicYear ?? { id: null })
        });
    }

    getTenantUser(form: FormGroup): ITenantUser | NewTenantUser {
        return form.getRawValue() as ITenantUser | NewTenantUser;
    }
}
