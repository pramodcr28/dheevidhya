import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from '../../../core/model/constants';
import { ITenant, NewTenant } from '../../models/tenant.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ITenant for edit and NewTenantFormGroupInput for create.
 */
type TenantFormGroupInput = ITenant | PartialWithRequiredKeyOf<NewTenant>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends ITenant | NewTenant> = Omit<T, 'createdAt' | 'updatedAt'> & {
    createdAt?: string | null;
    updatedAt?: string | null;
};

type TenantFormRawValue = FormValueOf<ITenant>;

type NewTenantFormRawValue = FormValueOf<NewTenant>;

type TenantFormDefaults = Pick<NewTenant, 'id' | 'createdAt' | 'updatedAt'>;

type TenantFormGroupContent = {
    id: FormControl<TenantFormRawValue['id'] | NewTenant['id']>;
    name: FormControl<TenantFormRawValue['name']>;
    desc: FormControl<TenantFormRawValue['desc']>;
    regNo: FormControl<TenantFormRawValue['regNo']>;
    taxId: FormControl<TenantFormRawValue['taxId']>;
    estDate: FormControl<TenantFormRawValue['estDate']>;
    web: FormControl<TenantFormRawValue['web']>;
    email: FormControl<TenantFormRawValue['email']>;
    phone: FormControl<TenantFormRawValue['phone']>;
    status: FormControl<TenantFormRawValue['status']>;
    createdBy: FormControl<TenantFormRawValue['createdBy']>;
    createdAt: FormControl<TenantFormRawValue['createdAt']>;
    updatedBy: FormControl<TenantFormRawValue['updatedBy']>;
    updatedAt: FormControl<TenantFormRawValue['updatedAt']>;
};

export type TenantFormGroup = FormGroup<TenantFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class TenantFormService {
    createTenantFormGroup(tenant: TenantFormGroupInput = { id: null }): TenantFormGroup {
        const tenantRawValue = this.convertTenantToTenantRawValue({
            ...this.getFormDefaults(),
            ...tenant
        });
        return new FormGroup<TenantFormGroupContent>({
            id: new FormControl(
                { value: tenantRawValue.id, disabled: true },
                {
                    nonNullable: true,
                    validators: [Validators.required]
                }
            ),
            name: new FormControl(tenantRawValue.name, {
                validators: [Validators.required]
            }),
            desc: new FormControl(tenantRawValue.desc),
            regNo: new FormControl(tenantRawValue.regNo),
            taxId: new FormControl(tenantRawValue.taxId),
            estDate: new FormControl(tenantRawValue.estDate),
            web: new FormControl(tenantRawValue.web),
            email: new FormControl(tenantRawValue.email, {
                validators: [Validators.required]
            }),
            phone: new FormControl(tenantRawValue.phone),
            status: new FormControl(tenantRawValue.status, {
                validators: [Validators.required]
            }),
            createdBy: new FormControl(tenantRawValue.createdBy),
            createdAt: new FormControl(tenantRawValue.createdAt),
            updatedBy: new FormControl(tenantRawValue.updatedBy),
            updatedAt: new FormControl(tenantRawValue.updatedAt)
        });
    }

    getTenant(form: TenantFormGroup): ITenant | NewTenant {
        return this.convertTenantRawValueToTenant(form.getRawValue() as TenantFormRawValue | NewTenantFormRawValue);
    }

    resetForm(form: TenantFormGroup, tenant: TenantFormGroupInput): void {
        const tenantRawValue = this.convertTenantToTenantRawValue({ ...this.getFormDefaults(), ...tenant });
        form.reset(
            {
                ...tenantRawValue,
                id: { value: tenantRawValue.id, disabled: true }
            } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
        );
    }

    private getFormDefaults(): TenantFormDefaults {
        const currentTime = dayjs();

        return {
            id: null,
            createdAt: currentTime,
            updatedAt: currentTime
        };
    }

    private convertTenantRawValueToTenant(rawTenant: TenantFormRawValue | NewTenantFormRawValue): ITenant | NewTenant {
        return {
            ...rawTenant,
            createdAt: dayjs(rawTenant.createdAt, DATE_TIME_FORMAT),
            updatedAt: dayjs(rawTenant.updatedAt, DATE_TIME_FORMAT)
        };
    }

    private convertTenantToTenantRawValue(tenant: ITenant | (Partial<NewTenant> & TenantFormDefaults)): TenantFormRawValue | PartialWithRequiredKeyOf<NewTenantFormRawValue> {
        return {
            ...tenant,
            createdAt: tenant.createdAt ? tenant.createdAt.format(DATE_TIME_FORMAT) : undefined,
            updatedAt: tenant.updatedAt ? tenant.updatedAt.format(DATE_TIME_FORMAT) : undefined
        };
    }
}
