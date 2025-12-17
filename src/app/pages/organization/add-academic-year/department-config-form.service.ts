import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import dayjs from 'dayjs/esm';
import { IDepartmentConfig, NewDepartmentConfig } from '../../models/org.model';

type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

type DepartmentConfigFormGroupInput = IDepartmentConfig | PartialWithRequiredKeyOf<NewDepartmentConfig>;

type DepartmentConfigFormRawValue = Omit<IDepartmentConfig, 'academicStart' | 'academicEnd'> & {
    academicStart?: string | null;
    academicEnd?: string | null;
};

type DepartmentConfigFormDefaults = Pick<NewDepartmentConfig, 'id' | 'academicStart' | 'academicEnd' | 'status'>;

type DepartmentConfigFormGroupContent = {
    id: FormControl<DepartmentConfigFormRawValue['id'] | NewDepartmentConfig['id']>;
    academicYear: FormControl<DepartmentConfigFormRawValue['academicYear']>;
    academicStart: FormControl<DepartmentConfigFormRawValue['academicStart']>;
    academicEnd: FormControl<DepartmentConfigFormRawValue['academicEnd']>;
    status: FormControl<DepartmentConfigFormRawValue['status']>;
    branch: FormControl<DepartmentConfigFormRawValue['branch']>;
    department: FormControl<DepartmentConfigFormRawValue['department']>;
};

export type DepartmentConfigFormGroup = FormGroup<DepartmentConfigFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class DepartmentConfigFormService {
    createDepartmentConfigFormGroup(departmentConfig: DepartmentConfigFormGroupInput = { id: null }): DepartmentConfigFormGroup {
        const departmentConfigRawValue = this.convertDepartmentConfigToDepartmentConfigRawValue({
            ...this.getFormDefaults(),
            ...departmentConfig
        });
        return new FormGroup<DepartmentConfigFormGroupContent>({
            id: new FormControl(
                { value: departmentConfigRawValue.id, disabled: true },
                {
                    nonNullable: true,
                    validators: [Validators.required]
                }
            ),
            academicYear: new FormControl(departmentConfigRawValue.academicYear, {
                validators: [Validators.required]
            }),
            academicStart: new FormControl(departmentConfigRawValue.academicStart, {
                validators: [Validators.required]
            }),
            academicEnd: new FormControl(departmentConfigRawValue.academicEnd, {
                validators: [Validators.required]
            }),
            status: new FormControl(departmentConfigRawValue.status, {
                validators: [Validators.required]
            }),
            branch: new FormControl(departmentConfigRawValue.branch), // Removed required if not always needed in UI
            department: new FormControl(departmentConfigRawValue.department)
        });
    }

    getDepartmentConfig(form: DepartmentConfigFormGroup): IDepartmentConfig | NewDepartmentConfig {
        return this.convertDepartmentConfigRawValueToDepartmentConfig(form.getRawValue() as DepartmentConfigFormRawValue);
    }

    resetForm(form: DepartmentConfigFormGroup, departmentConfig: DepartmentConfigFormGroupInput): void {
        const departmentConfigRawValue = this.convertDepartmentConfigToDepartmentConfigRawValue({
            ...this.getFormDefaults(),
            ...departmentConfig
        });
        form.reset({
            ...departmentConfigRawValue,
            id: { value: departmentConfigRawValue.id, disabled: true }
        } as any);
    }

    private getFormDefaults(): DepartmentConfigFormDefaults {
        const currentTime = dayjs();
        return {
            id: null,
            academicStart: currentTime,
            academicEnd: currentTime,
            status: true
        };
    }

    private convertDepartmentConfigRawValueToDepartmentConfig(rawDepartmentConfig: DepartmentConfigFormRawValue): IDepartmentConfig | NewDepartmentConfig {
        return {
            ...rawDepartmentConfig,
            academicStart: rawDepartmentConfig.academicStart ? dayjs(rawDepartmentConfig.academicStart) : null,
            academicEnd: rawDepartmentConfig.academicEnd ? dayjs(rawDepartmentConfig.academicEnd) : null
        };
    }

    private convertDepartmentConfigToDepartmentConfigRawValue(departmentConfig: IDepartmentConfig | (Partial<NewDepartmentConfig> & DepartmentConfigFormDefaults)): DepartmentConfigFormRawValue {
        return {
            ...departmentConfig,
            academicStart: departmentConfig.academicStart ? dayjs(departmentConfig.academicStart).format('YYYY-MM-DD') : undefined,
            academicEnd: departmentConfig.academicEnd ? dayjs(departmentConfig.academicEnd).format('YYYY-MM-DD') : undefined
        };
    }
}
