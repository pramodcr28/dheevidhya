import { HttpResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService, SharedModule } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ITenant } from '../../models/tenant.model';
import { TenantService } from '../../service/tenant.service';
import { TenantFormGroup, TenantFormService } from './tenant-form.service';

export interface StatusOption {
    label: string;
    value: string;
}

@Component({
    selector: 'tenant-update',
    templateUrl: './tenant-update.component.html',
    imports: [SharedModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, CalendarModule, ToastModule],
    providers: [MessageService]
})
export class TenantUpdateComponent implements OnInit {
    isSaving = false;
    tenant: ITenant | null = null;

    statusOptions: StatusOption[] = [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' }
    ];

    // protected dataUtils = inject(DataUtils);
    protected tenantService = inject(TenantService);
    protected tenantFormService = inject(TenantFormService);
    protected activatedRoute = inject(ActivatedRoute);
    protected router = inject(Router);
    protected messageService = inject(MessageService);

    editForm: TenantFormGroup = this.tenantFormService.createTenantFormGroup();

    ngOnInit(): void {
        this.activatedRoute.data.subscribe(({ tenant }) => {
            this.tenant = tenant;
            if (tenant) {
                this.updateForm(tenant);
            }
        });
    }

    previousState(): void {
        window.history.back();
    }

    save(): void {
        this.isSaving = true;
        const tenant = this.tenantFormService.getTenant(this.editForm);

        if (tenant.id !== null) {
            this.subscribeToSaveResponse(this.tenantService.update(tenant));
        } else {
            this.subscribeToSaveResponse(this.tenantService.create(tenant));
        }
    }

    protected subscribeToSaveResponse(result: Observable<HttpResponse<ITenant>>): void {
        result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
            next: () => this.onSaveSuccess(),
            error: () => this.onSaveError()
        });
    }

    protected onSaveSuccess(): void {
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Tenant saved successfully!'
        });
        this.previousState();
    }

    protected onSaveError(): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save tenant. Please try again.'
        });
    }

    protected onSaveFinalize(): void {
        this.isSaving = false;
    }

    protected updateForm(tenant: ITenant): void {
        this.tenant = tenant;
        this.tenantFormService.resetForm(this.editForm, tenant);
    }
}
