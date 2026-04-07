import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ITenantUser, NewTenantUser, UserStatus } from '../models/user.model';

type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

type TenantUserFormGroupInput = ITenantUser | PartialWithRequiredKeyOf<NewTenantUser>;

type FormValueOf<T extends ITenantUser | NewTenantUser> = Omit<T, 'resetDate'> & {
    resetDate?: string | null;
};

type TenantUserFormRawValue = FormValueOf<ITenantUser>;

type TenantUserFormGroupContent = {
    id: FormControl<TenantUserFormRawValue['id'] | NewTenantUser['id']>;
    login: FormControl<TenantUserFormRawValue['login']>;
    firstName: FormControl<TenantUserFormRawValue['firstName']>;
    lastName: FormControl<TenantUserFormRawValue['lastName']>;
    email: FormControl<TenantUserFormRawValue['email']>;
    imageUrl: FormControl<TenantUserFormRawValue['imageUrl']>;
    activated: FormControl<TenantUserFormRawValue['activated']>;
    langKey: FormControl<TenantUserFormRawValue['langKey']>;
    houseNumber: FormControl<TenantUserFormRawValue['houseNumber']>;
    street: FormControl<TenantUserFormRawValue['street']>;
    locality: FormControl<TenantUserFormRawValue['locality']>;
    landmark: FormControl<TenantUserFormRawValue['landmark']>;
    taluk: FormControl<TenantUserFormRawValue['taluk']>;
    district: FormControl<TenantUserFormRawValue['district']>;
    state: FormControl<TenantUserFormRawValue['state']>;
    country: FormControl<TenantUserFormRawValue['country']>;
    postalCode: FormControl<TenantUserFormRawValue['postalCode']>;
    latitude: FormControl<TenantUserFormRawValue['latitude']>;
    longitude: FormControl<TenantUserFormRawValue['longitude']>;
    authorities: FormControl<TenantUserFormRawValue['authorities']>;
    branchId: FormControl<TenantUserFormRawValue['branchId']>;
    status: FormControl<TenantUserFormRawValue['status']>;
};

export type TenantUserFormGroup = FormGroup<TenantUserFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class TenantUserFormService {
    createTenantUserFormGroup(tenantUser: TenantUserFormGroupInput = { id: null }): TenantUserFormGroup {
        const tenantUserRawValue = {
            ...tenantUser
        };
        return new FormGroup<TenantUserFormGroupContent>({
            id: new FormControl(
                { value: tenantUserRawValue.id, disabled: true },
                {
                    nonNullable: true,
                    validators: [Validators.required]
                }
            ),
            login: new FormControl(tenantUserRawValue.login, {
                validators: [Validators.required]
            }),
            firstName: new FormControl(tenantUserRawValue.firstName, {
                validators: [Validators.required]
            }),
            lastName: new FormControl(tenantUserRawValue.lastName),
            email: new FormControl(tenantUserRawValue.email),
            imageUrl: new FormControl(tenantUserRawValue.imageUrl),

            activated: new FormControl(tenantUserRawValue.activated),
            langKey: new FormControl(tenantUserRawValue.langKey),
            houseNumber: new FormControl(tenantUserRawValue.houseNumber),
            street: new FormControl(tenantUserRawValue.street),
            locality: new FormControl(tenantUserRawValue.locality, {
                validators: [Validators.required]
            }),
            landmark: new FormControl(tenantUserRawValue.landmark),
            taluk: new FormControl(tenantUserRawValue.taluk),
            district: new FormControl(tenantUserRawValue.district, {
                validators: [Validators.required]
            }),
            state: new FormControl(tenantUserRawValue.state, {
                validators: [Validators.required]
            }),
            country: new FormControl(tenantUserRawValue.country, {
                validators: [Validators.required]
            }),
            postalCode: new FormControl(tenantUserRawValue.postalCode, {
                validators: [Validators.required]
            }),
            latitude: new FormControl(tenantUserRawValue.latitude),
            longitude: new FormControl(tenantUserRawValue.longitude),
            authorities: new FormControl(tenantUserRawValue.authorities ?? []),
            branchId: new FormControl(tenantUserRawValue.branchId),
            status: new FormControl(tenantUserRawValue.status ?? UserStatus.ACTIVE)
        });
    }

    getTenantUser(form: TenantUserFormGroup): ITenantUser | NewTenantUser {
        return { ...form.getRawValue() } as unknown as ITenantUser | NewTenantUser;
    }

    resetForm(form: TenantUserFormGroup, tenantUser: TenantUserFormGroupInput): void {
        form.reset({
            ...tenantUser,
            id: { value: tenantUser.id, disabled: true }
        } as any);
    }
}
