import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IProfileConfig, NewProfileConfig } from '../models/user.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IProfileConfig for edit and NewProfileConfigFormGroupInput for create.
 */
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
            userId: new FormControl(profileConfigRawValue.userId, {
                validators: [Validators.required]
            }),
            academicYear: new FormControl(profileConfigRawValue.academicYear, {
                validators: [Validators.required]
            }),
            username: new FormControl(profileConfigRawValue.username, {
                validators: [Validators.required]
            }),
            email: new FormControl(profileConfigRawValue.email, {
                validators: [Validators.required]
            }),
            fullName: new FormControl(profileConfigRawValue.fullName, {
                validators: [Validators.required]
            }),
            contactNumber: new FormControl(profileConfigRawValue.contactNumber),
            reportsTo: new FormControl(profileConfigRawValue.reportsTo),
            gender: new FormControl(profileConfigRawValue.gender),
            profileType: new FormControl(profileConfigRawValue.profileType),
            departments: new FormControl(profileConfigRawValue.departments),
            roles: new FormControl(profileConfigRawValue.roles)
        });
    }

    getProfileConfig(form: ProfileConfigFormGroup): IProfileConfig | NewProfileConfig {
        return form.getRawValue() as IProfileConfig | NewProfileConfig;
    }

    resetForm(form: ProfileConfigFormGroup, profileConfig: ProfileConfigFormGroupInput): void {
        const profileConfigRawValue = { ...this.getFormDefaults(), ...profileConfig };
        form.reset(
            {
                ...profileConfigRawValue,
                id: { value: profileConfigRawValue.id, disabled: true }
            } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
        );
    }

    private getFormDefaults(): ProfileConfigFormDefaults {
        return {
            id: null
        };
    }
}
