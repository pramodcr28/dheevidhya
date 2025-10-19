import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';

import { DATE_TIME_FORMAT } from '../../core/model/constants';
import { ITenantUser, NewTenantUser } from '../models/user.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ITenantUser for edit and NewTenantUserFormGroupInput for create.
 */
type TenantUserFormGroupInput = ITenantUser | PartialWithRequiredKeyOf<NewTenantUser>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends ITenantUser | NewTenantUser> = Omit<T, 'resetDate'> & {
    resetDate?: string | null;
};

type TenantUserFormRawValue = FormValueOf<ITenantUser>;

type NewTenantUserFormRawValue = FormValueOf<NewTenantUser>;

type TenantUserFormDefaults = Pick<NewTenantUser, 'id' | 'activated' | 'resetDate' | 'isTenantUser' | 'authorities'>;

type TenantUserFormGroupContent = {
    id: FormControl<TenantUserFormRawValue['id'] | NewTenantUser['id']>;
    login: FormControl<TenantUserFormRawValue['login']>;
    passwordHash: FormControl<TenantUserFormRawValue['passwordHash']>;
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
    activationKey: FormControl<TenantUserFormRawValue['activationKey']>;
    resetKey: FormControl<TenantUserFormRawValue['resetKey']>;
    resetDate: FormControl<TenantUserFormRawValue['resetDate']>;
    isTenantUser: FormControl<TenantUserFormRawValue['isTenantUser']>;
    authorities: FormControl<TenantUserFormRawValue['authorities']>;
    branchId: FormControl<TenantUserFormRawValue['branchId']>;
};

export type TenantUserFormGroup = FormGroup<TenantUserFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class TenantUserFormService {
    createTenantUserFormGroup(tenantUser: TenantUserFormGroupInput = { id: null }): TenantUserFormGroup {
        const tenantUserRawValue = this.convertTenantUserToTenantUserRawValue({
            ...this.getFormDefaults(),
            ...tenantUser
        });
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
            passwordHash: new FormControl(tenantUserRawValue.passwordHash, {
                validators: [Validators.required]
            }),
            firstName: new FormControl(tenantUserRawValue.firstName, {
                validators: [Validators.required]
            }),
            lastName: new FormControl(tenantUserRawValue.lastName),
            email: new FormControl(tenantUserRawValue.email, {
                validators: [Validators.required]
            }),
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
            activationKey: new FormControl(tenantUserRawValue.activationKey),
            resetKey: new FormControl(tenantUserRawValue.resetKey),
            resetDate: new FormControl(tenantUserRawValue.resetDate),
            isTenantUser: new FormControl(tenantUserRawValue.isTenantUser),
            authorities: new FormControl(tenantUserRawValue.authorities ?? []),
            branchId: new FormControl(tenantUserRawValue.branchId)
        });
    }

    getTenantUser(form: TenantUserFormGroup): ITenantUser | NewTenantUser {
        return this.convertTenantUserRawValueToTenantUser(form.getRawValue() as TenantUserFormRawValue | NewTenantUserFormRawValue);
    }

    resetForm(form: TenantUserFormGroup, tenantUser: TenantUserFormGroupInput): void {
        const tenantUserRawValue = this.convertTenantUserToTenantUserRawValue({ ...this.getFormDefaults(), ...tenantUser });
        form.reset(
            {
                ...tenantUserRawValue,
                id: { value: tenantUserRawValue.id, disabled: true }
            } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
        );
    }

    private getFormDefaults(): TenantUserFormDefaults {
        const currentTime = dayjs();

        return {
            id: null,
            activated: false,
            resetDate: currentTime,
            isTenantUser: false,
            authorities: []
        };
    }

    private convertTenantUserRawValueToTenantUser(rawTenantUser: TenantUserFormRawValue | NewTenantUserFormRawValue): ITenantUser | NewTenantUser {
        return {
            ...rawTenantUser,
            resetDate: dayjs(rawTenantUser.resetDate, DATE_TIME_FORMAT)
        };
    }

    private convertTenantUserToTenantUserRawValue(tenantUser: ITenantUser | (Partial<NewTenantUser> & TenantUserFormDefaults)): TenantUserFormRawValue | PartialWithRequiredKeyOf<NewTenantUserFormRawValue> {
        return {
            ...tenantUser,
            resetDate: tenantUser.resetDate ? tenantUser.resetDate?.format(DATE_TIME_FORMAT) : undefined,
            authorities: tenantUser.authorities ?? []
        };
    }
}
