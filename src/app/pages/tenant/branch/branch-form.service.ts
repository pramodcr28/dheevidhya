import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IBranch } from '../../models/tenant.model';

@Injectable({ providedIn: 'root' })
export class BranchFormService {
    constructor(private fb: FormBuilder) {}

    createBranchFormGroup(branch?: IBranch): FormGroup {
        return this.fb.group({
            id: [branch?.id ?? null],

            name: [branch?.name ?? null, [Validators.required, Validators.minLength(3)]],

            code: [branch?.code ?? null, [Validators.required, Validators.minLength(2)]],

            type: [branch?.type ?? null, [Validators.required]],

            board: [branch?.board ?? null],

            phone: [branch?.phone ?? null, [Validators.required, Validators.pattern(/^[0-9\-\+\s]+$/)]],

            email: [branch?.email ?? null, [Validators.required, Validators.email]],

            street: [branch?.street ?? null, [Validators.required, Validators.minLength(5)]],

            locality: [branch?.locality ?? null, [Validators.required, Validators.minLength(3)]],

            landmark: [branch?.landmark ?? null],

            taluk: [branch?.taluk ?? null],

            district: [branch?.district ?? null, [Validators.required, Validators.minLength(2)]],

            state: [branch?.state ?? null, [Validators.required]],

            country: [branch?.country ?? null, [Validators.required]],

            postalCode: [branch?.postalCode ?? null, [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],

            latitude: [branch?.latitude ?? null],

            longitude: [branch?.longitude ?? null],

            active: [branch?.active ?? false],

            tenant: [branch?.tenant ?? null]
        });
    }

    getBranch(form: FormGroup): IBranch {
        return form.getRawValue();
    }

    resetForm(form: FormGroup, branch: IBranch): void {
        form.reset({
            ...branch
        });
    }
}
