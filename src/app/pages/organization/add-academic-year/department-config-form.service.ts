import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IDepartmentConfig } from '../../models/org.model';

@Injectable({ providedIn: 'root' })
export class DepartmentConfigFormService {
    createForm(config: Partial<IDepartmentConfig> = {}): FormGroup {
        return new FormGroup({
            id: new FormControl(config.id || null),
            dateRange: new FormControl(null, [Validators.required]),
            status: new FormControl(config.status !== undefined ? config.status : true, [Validators.required]),
            branch: new FormControl(config.branch || null),
            department: new FormControl(config.department || null),
            associatedStaffs: new FormControl(config.associatedStaffs || [])
        });
    }

    getFormValue(form: FormGroup): IDepartmentConfig {
        const raw = form.getRawValue();
        return {
            id: raw.id,
            academicStart: raw.academicStart || null,
            academicEnd: raw.academicEnd || null,
            status: raw.status,
            branch: raw.branch,
            department: raw.department,
            associatedStaffs: raw.associatedStaffs || []
        } as IDepartmentConfig;
    }

    resetForm(form: FormGroup, config: IDepartmentConfig): void {
        form.reset({
            id: config.id,
            dateRange: null,
            status: config.status,
            branch: config.branch,
            department: config.department,
            associatedStaffs: config.associatedStaffs || []
        });
    }
}
