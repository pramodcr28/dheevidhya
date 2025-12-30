import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { IDepartmentConfig } from '../../../models/org.model';

@Injectable({ providedIn: 'root' })
export class DepartmentConfigFormService {
    /** * Creates the main form.
     * Note: 'classes' is a FormArray here for easier dynamic management.
     */
    createForm(config: Partial<IDepartmentConfig> = {}): FormGroup {
        return new FormGroup({
            id: new FormControl(config.id || null),
            dateRange: new FormControl(null, [Validators.required]),
            status: new FormControl(config.status !== undefined ? config.status : true, [Validators.required]),
            branch: new FormControl(config.branch || null),
            department: new FormControl(config.department || null),
            associatedStaffs: new FormControl(config.associatedStaffs || []),
            classes: new FormArray([])
        });
    }

    /** Creates a unique group for a Class */
    createClassFormGroup(classItem: any): FormGroup {
        return new FormGroup({
            id: new FormControl(classItem.id || null),
            name: new FormControl(classItem.name || ''),
            code: new FormControl(classItem.code || ''),
            // Multi-select control for picking which sections exist in this class
            selectedSections: new FormControl(classItem.sections || []),
            // FormArray holding unique configurations (subjects) for each selected section
            sectionConfigs: new FormArray([])
        });
    }

    /** Creates a unique group for a Section (Prevents data leakage) */
    createSectionFormGroup(section: any): FormGroup {
        return new FormGroup({
            id: new FormControl(section.id || null),
            name: new FormControl(section.name || ''),
            // We clone the array to break object references
            subjects: new FormControl(section.subjects ? [...section.subjects] : [])
        });
    }

    /** Maps the flat FormArray structure back into the nested Department model for the API */
    getFormValue(form: FormGroup): IDepartmentConfig {
        const raw = form.getRawValue();

        const formattedClasses = raw.classes.map((c: any) => ({
            id: c.id,
            name: c.name,
            code: c.code,
            sections: c.sectionConfigs.map((s: any) => ({
                id: s.id,
                name: s.name,
                subjects: s.subjects
            }))
        }));

        return {
            id: raw.id,
            status: raw.status,
            branch: raw.branch.id,
            department: {
                ...raw.department,
                classes: formattedClasses
            },
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
