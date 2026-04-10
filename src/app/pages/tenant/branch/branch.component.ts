import { Component, NgZone, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Data, ParamMap, Router, RouterModule } from '@angular/router';
import { SharedModule } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';

import { CommonModule } from '@angular/common';
import { DEFAULT_SORT_DATA, SORT } from '../../../core/model/navigation.constants';
import { ITEMS_PER_PAGE, PAGE_HEADER } from '../../../core/model/pagination.constants';
import { BranchService } from '../../../core/services/branch.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { SortService, sortStateSignal } from '../../../shared/sort';
import { IBranch, ITenant } from '../../models/tenant.model';
import { TenantService } from '../../service/tenant.service';
import { BranchDialogComponent } from './branch-dialog/branch-dialog.component';

@Component({
    selector: 'jhi-branch',
    templateUrl: './branch.component.html',
    imports: [RouterModule, FormsModule, SharedModule, TableModule, ButtonModule, TagModule, TooltipModule, BranchDialogComponent, CommonModule]
})
export class BranchComponent implements OnInit {
    subscription: Subscription | null = null;
    branches = signal<IBranch[]>([]);
    isLoading = false;
    sortState = sortStateSignal({});
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 1;
    router = inject(Router);
    branchService = inject(BranchService);
    activatedRoute = inject(ActivatedRoute);
    sortService = inject(SortService);
    ngZone = inject(NgZone);
    Math = Math;
    dialogVisible = false;
    selectedBranch: IBranch | null = null;

    selectedTenant: ITenant | null = null;
    tenantService = inject(TenantService);
    tenantId: number | null = null;
    loader = inject(ApiLoaderService);
    trackId = (item: IBranch): number => this.branchService.getBranchIdentifier(item);

    ngOnInit(): void {
        this.branches.set([]);
        this.subscription = this.activatedRoute.paramMap.subscribe((params) => {
            this.tenantId = Number(params.get('tenantId'));
            if (!this.tenantId) return;

            this.tenantService.find(this.tenantId).subscribe((res) => {
                this.selectedTenant = res.body;
            });

            this.load();
        });
    }

    delete(branch: IBranch): void {
        if (confirm(`Are you sure you want to delete ${branch.name}?`)) {
            this.branchService.delete(branch.id!).subscribe(() => {
                this.load(); // Refresh list after deletion
            });
        }
    }
    load(): void {
        this.loader.show();
        this.branchService.search(0, 100, 'id', 'ASC', { 'tenant.equals': this.tenantId }).subscribe((res) => {
            this.branches.set(res.content);
            this.loader.hide();
        });
    }

    protected fillComponentAttributeFromRoute(params: ParamMap, data: Data): void {
        const page = params.get(PAGE_HEADER);
        this.page = +(page ?? 1);
        this.sortState.set(this.sortService.parseSortParam(params.get(SORT) ?? data[DEFAULT_SORT_DATA]));
    }

    openCreate() {
        this.selectedBranch = null;
        this.dialogVisible = true;
    }

    openEdit(branch: IBranch) {
        this.selectedBranch = branch;
        this.dialogVisible = true;
    }

    onSaved(_: IBranch) {
        this.dialogVisible = false;
        this.load(); // refresh table
    }

    goBack() {
        this.router.navigate(['/home/tenant']);
    }
}
