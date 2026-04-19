import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IProfileConfig, NewProfileConfig } from '../models/user.model';

type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

type ProfileConfigFormGroupInput = IProfileConfig | PartialWithRequiredKeyOf<NewProfileConfig>;

type ProfileConfigFormDefaults = Pick<NewProfileConfig, 'id'>;

type ProfileConfigFormGroupContent = {
    id: FormControl<IProfileConfig['id'] | NewProfileConfig['id']>;
    userId: FormControl<IProfileConfig['userId']>;
    academicYear: FormControl<IProfileConfig['academicYear']>;
    username: FormControl<IProfileConfig['username']>;
    email: FormControl<IProfileConfig['email']>;
    fullName: FormControl<IProfileConfig['fullName']>;
    contactNumber: FormControl<IProfileConfig['contactNumber']>;
    reportsTo: FormControl<IProfileConfig['reportsTo']>;
    gender: FormControl<IProfileConfig['gender']>;
    profileType: FormControl<IProfileConfig['profileType']>;
    departments: FormControl<IProfileConfig['departments']>;
    roles: FormControl<IProfileConfig['roles']>;
    subjectIds: FormControl<IProfileConfig['subjectIds']>;
    status: FormControl<IProfileConfig['status']>;
    exitDate: FormControl<IProfileConfig['exitDate']>;
    exitReason: FormControl<IProfileConfig['exitReason']>;
};

export type ProfileConfigFormGroup = FormGroup<ProfileConfigFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ProfileConfigFormService {
    createProfileConfigFormGroup(profileConfig: ProfileConfigFormGroupInput = { id: null }): ProfileConfigFormGroup {
        const profileConfigRawValue = {
            ...this.getFormDefaults(),
            ...profileConfig
        };
        return new FormGroup<ProfileConfigFormGroupContent>({
            id: new FormControl(
                { value: profileConfigRawValue.id, disabled: true },
                {
                    nonNullable: true,
                    validators: [Validators.required]
                }
            ),
            userId: new FormControl(profileConfigRawValue.userId),
            academicYear: new FormControl(profileConfigRawValue.academicYear, {
                validators: [Validators.required]
            }),
            username: new FormControl(profileConfigRawValue.username),
            email: new FormControl(profileConfigRawValue.email),
            fullName: new FormControl(profileConfigRawValue.fullName),
            contactNumber: new FormControl(profileConfigRawValue.contactNumber),
            reportsTo: new FormControl(profileConfigRawValue.reportsTo),
            gender: new FormControl(profileConfigRawValue.gender),
            profileType: new FormControl(profileConfigRawValue.profileType),
            departments: new FormControl(profileConfigRawValue.departments),
            roles: new FormControl(profileConfigRawValue.roles),
            subjectIds: new FormControl(profileConfigRawValue.subjectIds),
            status: new FormControl(profileConfigRawValue.status),
            exitDate: new FormControl(profileConfigRawValue.exitDate),
            exitReason: new FormControl(profileConfigRawValue.exitReason)
        });
    }

    getProfileConfig(form: ProfileConfigFormGroup): IProfileConfig | NewProfileConfig {
        return form.getRawValue() as IProfileConfig | NewProfileConfig;
    }

    resetForm(form: ProfileConfigFormGroup, profileConfig: ProfileConfigFormGroupInput): void {
        const profileConfigRawValue = { ...this.getFormDefaults(), ...profileConfig };
        form.reset({
            ...profileConfigRawValue,
            id: { value: profileConfigRawValue.id, disabled: true }
        } as any);
    }

    private getFormDefaults(): ProfileConfigFormDefaults {
        return {
            id: null
        };
    }
}
