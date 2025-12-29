import { HttpHeaders } from '@angular/common/http';
import { Component, NgZone, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Data, ParamMap, Router, RouterModule } from '@angular/router';
import { SharedModule } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, Subscription, combineLatest, tap } from 'rxjs';
import { DEFAULT_SORT_DATA, SORT } from '../../core/model/navigation.constants';
import { ITEMS_PER_PAGE, PAGE_HEADER, TOTAL_COUNT_RESPONSE_HEADER } from '../../core/model/pagination.constants';
import { SortService, sortStateSignal } from '../../shared/sort';
import { ITenant } from '../models/tenant.model';
import { TenantService } from '../service/tenant.service';
import { EntityArrayResponseType } from '../service/user.service';
import { TenantDialogComponent } from './tenant-dialog/tenant-dialog.component';

@Component({
    selector: 'jhi-tenant',
    templateUrl: './tenant.component.html',
    imports: [RouterModule, FormsModule, SharedModule, TableModule, ButtonModule, TagModule, TooltipModule, TenantDialogComponent]
})
export class TenantComponent implements OnInit {
    subscription: Subscription | null = null;
    tenants = signal<ITenant[]>([]);
    isLoading = false;
    sortState = sortStateSignal({});
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 1;
    router = inject(Router);
    tenantService = inject(TenantService);
    activatedRoute = inject(ActivatedRoute);
    sortService = inject(SortService);
    ngZone = inject(NgZone);
    Math = Math;
    dialogVisible = false;
    selectedTenant: ITenant | null = null;
    trackId = (item: ITenant): number => this.tenantService.getTenantIdentifier(item);

    ngOnInit(): void {
        this.subscription = combineLatest([this.activatedRoute.queryParamMap, this.activatedRoute.data])
            .pipe(
                tap(([params, data]) => this.fillComponentAttributeFromRoute(params, data)),
                tap(() => this.load())
            )
            .subscribe();
    }

    delete(tenant: ITenant): void {
        if (confirm(`Are you sure you want to delete ${tenant.name}?`)) {
            this.tenantService.delete(tenant.id!).subscribe(() => {
                this.load(); // Refresh list after deletion
            });
        }
    }

    load(): void {
        this.queryBackend().subscribe({
            next: (res: EntityArrayResponseType) => {
                this.onResponseSuccess(res);
            }
        });
    }

    protected fillComponentAttributeFromRoute(params: ParamMap, data: Data): void {
        const page = params.get(PAGE_HEADER);
        this.page = +(page ?? 1);
        this.sortState.set(this.sortService.parseSortParam(params.get(SORT) ?? data[DEFAULT_SORT_DATA]));
    }

    protected onResponseSuccess(response: EntityArrayResponseType): void {
        this.fillComponentAttributesFromResponseHeader(response.headers);
        this.tenants.set(response.body ?? []);
    }

    protected fillComponentAttributesFromResponseHeader(headers: HttpHeaders): void {
        this.totalItems = Number(headers.get(TOTAL_COUNT_RESPONSE_HEADER));
    }

    protected queryBackend(): Observable<EntityArrayResponseType> {
        const { page } = this;

        this.isLoading = true;
        const pageToLoad: number = page;
        const queryObject: any = {
            page: pageToLoad - 1,
            size: this.itemsPerPage,
            sort: this.sortService.buildSortParam(this.sortState())
        };
        return this.tenantService.query(queryObject).pipe(tap(() => (this.isLoading = false)));
    }

    openCreate() {
        this.selectedTenant = null;
        this.dialogVisible = true;
    }

    openEdit(tenant: ITenant) {
        this.selectedTenant = tenant;
        this.dialogVisible = true;
    }

    viewBranches(tenant: ITenant): void {
        this.router.navigate(['/tenant', tenant.id, 'branch']);
    }

    onSaved(_: ITenant) {
        this.dialogVisible = false;
        this.load(); // refresh table
    }
}
