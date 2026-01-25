import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, inject, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { CommonService } from '../../core/services/common.service';
import { DepartmentConfigService } from '../../core/services/department-config.service';

@Component({
    selector: 'dhee-select',
    template: `
        @if (internalOptions && internalOptions.length > 0) {
            @if (multiple) {
                <div class="flex flex-col gap-2 w-full">
                    <div class="w-full">
                        @if (displayLabel) {
                            <label class="block font-semibold mb-2 text-gray-700">
                                {{ displayLabel }}
                            </label>
                        }
                        <p-multi-select
                            class="w-full"
                            styleClass="w-full"
                            [options]="internalOptions"
                            [(ngModel)]="value"
                            (ngModelChange)="handleValueChange($event)"
                            [optionLabel]="optionLabel"
                            [optionValue]="optionValue"
                            [placeholder]="placeholder"
                            [filter]="filter"
                            [filterBy]="filterBy"
                            [disabled]="disabled"
                            [style]="style"
                        >
                            <ng-template pTemplate="item" let-item>
                                <ng-container *ngIf="itemTemplate; else defaultItem">
                                    <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item }"> </ng-container>
                                </ng-container>

                                <ng-template #defaultItem>
                                    <div class="flex flex-col">
                                        <span class="font-medium">
                                            {{ getNestedProperty(item, optionLabel) }}
                                        </span>

                                        @if (showAcademicYear && item.academicYear) {
                                            <small class="text-primary-500"> Academic Year: {{ item.academicYear }} </small>
                                        }
                                    </div>
                                </ng-template>
                            </ng-template>

                            @if (selectedItemTemplate) {
                                <ng-template pTemplate="selectedItem" let-item>
                                    <ng-container *ngTemplateOutlet="selectedItemTemplate; context: { $implicit: item }"> </ng-container>
                                </ng-template>
                            }
                        </p-multi-select>
                    </div>
                </div>
            } @else {
                <div class="flex flex-col gap-2 w-full">
                    <div class="w-full">
                        @if (displayLabel) {
                            <label class="block font-semibold mb-2 text-gray-700">
                                {{ displayLabel }}
                            </label>
                        }
                        <p-select
                            class="w-full"
                            styleClass="w-full"
                            [options]="internalOptions"
                            [(ngModel)]="value"
                            (ngModelChange)="handleValueChange($event)"
                            [optionLabel]="optionLabel"
                            [optionValue]="optionValue"
                            [placeholder]="placeholder"
                            [filter]="filter"
                            [filterBy]="filterBy"
                            [disabled]="disabled"
                            [style]="style"
                        >
                            <ng-template pTemplate="item" let-item>
                                <ng-container *ngIf="itemTemplate; else defaultItem">
                                    <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item }"> </ng-container>
                                </ng-container>

                                <ng-template #defaultItem>
                                    <div class="flex flex-col">
                                        <span class="font-medium">
                                            {{ getNestedProperty(item, optionLabel) }}
                                        </span>
                                        @if (showAcademicYear && item.academicYear) {
                                            <small class="text-primary-500"> Academic Year: {{ item.academicYear }} </small>
                                        }
                                    </div>
                                </ng-template>
                            </ng-template>

                            @if (selectedItemTemplate) {
                                <ng-template pTemplate="selectedItem" let-item>
                                    <ng-container *ngTemplateOutlet="selectedItemTemplate; context: { $implicit: item }"> </ng-container>
                                </ng-template>
                            } @else if (showAcademicYear) {
                                <ng-template pTemplate="selectedItem" let-item>
                                    {{ getNestedProperty(item, optionLabel) }}
                                    @if (item.academicYear) {
                                        ({{ item.academicYear }})
                                    }
                                </ng-template>
                            }
                        </p-select>
                    </div>
                </div>
            }

            @if (showError && errorMessage) {
                <small class="text-red-500 block mt-1">
                    {{ errorMessage }}
                </small>
            }
        } @else if (loading) {
            <div class="w-full border border-gray-300 rounded-lg p-3 text-center text-gray-500"><i class="pi pi-spin pi-spinner"></i> Loading...</div>
        }
    `,
    imports: [SelectModule, MultiSelectModule, CommonModule, FormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DheeSelectComponent),
            multi: true
        }
    ]
})
export class DheeSelectComponent implements ControlValueAccessor, OnInit {
    @Input() dataSource: 'departments' | 'subjects' | 'custom' = 'custom';

    private _options: any[] = [];

    @Input()
    set options(value: any[]) {
        this._options = value || [];

        if (this.dataSource === 'custom') {
            this.internalOptions = [...this._options];
            this.optionsLoaded.emit(this.internalOptions);
        }
    }

    get options(): any[] {
        return this._options;
    }

    @Input() optionLabel: string = 'name';
    @Input() displayLabel: string = null;
    @Input() optionValue: string | undefined;
    @Input() placeholder: string = 'Select';
    @Input() multiple: boolean = false;
    @Input() filter: boolean = false;
    @Input() filterBy: string = '';
    @Input() disabled: boolean = false;
    @Input() style: any = { width: '100%' };
    @Input() styleClass: string = '';
    @Input() showAcademicYear: boolean = false;
    @Input() showError: boolean = false;
    @Input() errorMessage: string = 'This field is required.';
    @Input() emptyStateTitle: string = 'No Options Available';
    @Input() emptyStateMessage: string = 'No items have been configured.';
    @Input() emptyStateContact: string = 'Please contact your administrator';
    @Input() itemTemplate: any;
    @Input() selectedItemTemplate: any;

    @Output() onValueChange = new EventEmitter<any>();
    @Output() optionsLoaded = new EventEmitter<any[]>();

    value: any;
    internalOptions: any[] = [];
    loading: boolean = false;

    commonService = inject(CommonService);
    departmentConfigService = inject(DepartmentConfigService);

    private onChange: (value: any) => void = () => {};
    private onTouched: () => void = () => {};

    ngOnInit() {
        if (this.multiple && !Array.isArray(this.value)) {
            this.value = [];
        }
        this.loadOptions();
    }

    private loadOptions() {
        if (this.dataSource === 'custom') {
            this.internalOptions = [...this.options];
            return;
        }

        if (this.dataSource === 'departments') {
            this.loadDepartments();
        } else if (this.dataSource === 'subjects') {
            this.internalOptions = this.commonService?.associatedSubjects || [];
        }
    }

    private loadDepartments() {
        const isITAdmin = this.commonService?.getUserAuthorities?.includes('IT_ADMINISTRATOR');

        if (isITAdmin) {
            this.loading = true;

            const filterParams = {
                branch: this.commonService.branch?.id
            };

            this.departmentConfigService.search(0, 100, 'id', 'ASC', filterParams).subscribe({
                next: (res: any) => {
                    this.internalOptions = res.content.map((re: any) => ({
                        ...re,
                        name: re.department.name
                    }));
                    this.loading = false;
                    this.optionsLoaded.emit(this.internalOptions);
                },
                error: () => {
                    this.loading = false;
                    this.internalOptions = [];
                }
            });
        } else {
            this.internalOptions = this.commonService?.associatedDepartments || [];
            this.optionsLoaded.emit(this.internalOptions);
        }
    }

    writeValue(value: any): void {
        this.value = this.multiple ? (Array.isArray(value) ? value : []) : value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    handleValueChange(value: any): void {
        this.value = this.multiple ? (Array.isArray(value) ? value : []) : value;
        this.onChange(this.value);
        this.onTouched();
        this.onValueChange.emit(this.value);
    }

    getNestedProperty(obj: any, path: string): any {
        return path.split('.').reduce((prev, curr) => prev?.[curr], obj);
    }

    refresh() {
        this.loadOptions();
    }
}
