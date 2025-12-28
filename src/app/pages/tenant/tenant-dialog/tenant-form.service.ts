import { Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ITenant } from '../../models/tenant.model';

@Injectable({ providedIn: 'root' })
export class TenantFormService {
    constructor(private fb: FormBuilder) {}

    createTenantFormGroup(tenant?: ITenant) {
        return this.fb.group({
            id: [tenant?.id ?? null],

            name: [tenant?.name ?? null, [Validators.required, Validators.minLength(3)]],

            regNo: [tenant?.regNo ?? null, [Validators.required]],

            taxId: [tenant?.taxId ?? null],

            estDate: [tenant?.estDate ?? null, [Validators.required]],

            web: [tenant?.web ?? null],

            email: [tenant?.email ?? null, [Validators.required, Validators.email]],

            phone: [tenant?.phone ?? null],

            status: [tenant?.status ?? null, [Validators.required]],

            desc: [tenant?.desc ?? null]
        });
    }

    getTenant(form: any): ITenant {
        return form.getRawValue();
    }

    resetForm(form: any, tenant: ITenant): void {
        form.reset({
            ...tenant
        });
    }
}
