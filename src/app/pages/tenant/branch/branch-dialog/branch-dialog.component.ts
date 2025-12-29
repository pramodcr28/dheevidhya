import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs/operators';
import { BranchService } from '../../../../core/services/branch.service';
import { IBranch } from '../../../models/tenant.model';
import { BranchFormService } from '../branch-form.service';

@Component({
    selector: 'app-branch-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, TextareaModule, SelectModule, ToastModule, CheckboxModule],
    providers: [MessageService],
    templateUrl: './branch-dialog.component.html'
})
export class BranchDialogComponent implements OnInit {
    private branchService = inject(BranchService);
    private branchFormService = inject(BranchFormService);
    private messageService = inject(MessageService);

    @Input() visible = false;
    @Input() tenantId: number | null = null;

    @Input() set branch(value: IBranch | null) {
        this._branch = value;
        if (this.editForm) {
            // if (value) {
            this.branchFormService.resetForm(this.editForm, value);
            // }
        }
    }
    get branch(): IBranch | null {
        return this._branch;
    }

    @Output() saveSuccess = new EventEmitter<IBranch>();
    @Output() cancel = new EventEmitter<void>();

    private _branch: IBranch | null = null;

    editForm = this.branchFormService.createBranchFormGroup();
    isSaving = false;

    branchTypes = [
        { label: 'Head Office', value: 'HQ' },
        // { label: 'Regional Office', value: 'REGIONAL_OFFICE' },
        { label: 'Branch', value: 'BRANCH' }
        // { label: 'Sub-Branch', value: 'SUB_BRANCH' }
    ];

    stateOptions = [
        { label: 'Andhra Pradesh', value: 'AP' },
        { label: 'Arunachal Pradesh', value: 'AR' },
        { label: 'Assam', value: 'AS' },
        { label: 'Bihar', value: 'BR' },
        { label: 'Chhattisgarh', value: 'CG' },
        { label: 'Goa', value: 'GA' },
        { label: 'Gujarat', value: 'GJ' },
        { label: 'Haryana', value: 'HR' },
        { label: 'Himachal Pradesh', value: 'HP' },
        { label: 'Jharkhand', value: 'JH' },
        { label: 'Karnataka', value: 'KA' },
        { label: 'Kerala', value: 'KL' },
        { label: 'Madhya Pradesh', value: 'MP' },
        { label: 'Maharashtra', value: 'MH' },
        { label: 'Manipur', value: 'MN' },
        { label: 'Meghalaya', value: 'ML' },
        { label: 'Mizoram', value: 'MZ' },
        { label: 'Nagaland', value: 'NL' },
        { label: 'Odisha', value: 'OR' },
        { label: 'Punjab', value: 'PB' },
        { label: 'Rajasthan', value: 'RJ' },
        { label: 'Sikkim', value: 'SK' },
        { label: 'Tamil Nadu', value: 'TN' },
        { label: 'Telangana', value: 'TG' },
        { label: 'Tripura', value: 'TR' },
        { label: 'Uttar Pradesh', value: 'UP' },
        { label: 'Uttarakhand', value: 'UT' },
        { label: 'West Bengal', value: 'WB' }
    ];

    countryOptions = [{ label: 'India', value: 'IN' }];

    ngOnInit(): void {}

    onSave(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }

        this.isSaving = true;
        const branchData = this.branchFormService.getBranch(this.editForm);

        branchData.tenant = this.tenantId;

        const request$ = branchData.id ? this.branchService.update(branchData) : this.branchService.create(branchData);

        request$.pipe(finalize(() => (this.isSaving = false))).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'success',
                    detail: 'Branch saved successfully',
                    life: 2000
                });
                this.saveSuccess.emit(res.body ?? branchData);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    detail: err?.error?.message || 'Save failed',
                    life: 3000
                });
            }
        });
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
