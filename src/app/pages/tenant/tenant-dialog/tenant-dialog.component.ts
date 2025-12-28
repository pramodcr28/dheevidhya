import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs/operators';

import { DatePickerModule } from 'primeng/datepicker';
import { ITenant } from '../../models/tenant.model';
import { TenantService } from '../../service/tenant.service';
import { TenantFormService } from './tenant-form.service';

@Component({
    selector: 'app-tenant-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule, DatePickerModule],
    providers: [MessageService],
    templateUrl: './tenant-dialog.component.html'
})
export class TenantDialogComponent implements OnInit {
    private tenantService = inject(TenantService);
    private tenantFormService = inject(TenantFormService);
    private messageService = inject(MessageService);

    @Input() visible = false;

    @Input() set tenant(value: ITenant | null) {
        this._tenant = value;
        if (this.editForm) {
            value ? this.tenantFormService.resetForm(this.editForm, value) : this.editForm.reset();
        }
    }
    get tenant(): ITenant | null {
        return this._tenant;
    }

    @Output() saveSuccess = new EventEmitter<ITenant>();
    @Output() cancel = new EventEmitter<void>();

    private _tenant: ITenant | null = null;

    editForm = this.tenantFormService.createTenantFormGroup();
    isSaving = false;

    statusOptions = [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' }
    ];

    ngOnInit(): void {}

    onSave(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }

        this.isSaving = true;
        const tenantData = this.tenantFormService.getTenant(this.editForm);

        const request$ = tenantData.id ? this.tenantService.update(tenantData) : this.tenantService.create(tenantData);

        request$.pipe(finalize(() => (this.isSaving = false))).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'success',
                    detail: 'Tenant saved successfully',
                    life: 2000
                });
                this.saveSuccess.emit(res.body ?? tenantData);
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
