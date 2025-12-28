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
import { SortService, SortState, sortStateSignal } from '../../shared/sort';
import { ITenant } from '../models/tenant.model';
import { TenantService } from '../service/tenant.service';
import { EntityArrayResponseType } from '../service/user.service';

@Component({
    selector: 'jhi-tenant',
    templateUrl: './tenant.component.html',
    imports: [RouterModule, FormsModule, SharedModule, TableModule, ButtonModule, TagModule, TooltipModule]
})
export class TenantComponent implements OnInit {
    subscription: Subscription | null = null;
    tenants = signal<ITenant[]>([]);
    isLoading = false;

    sortState = sortStateSignal({});

    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 1;

    public readonly router = inject(Router);
    protected readonly tenantService = inject(TenantService);
    protected readonly activatedRoute = inject(ActivatedRoute);
    protected readonly sortService = inject(SortService);
    // protected dataUtils = inject(DataUtils);
    // protected modalService = inject(NgbModal);
    protected ngZone = inject(NgZone);

    // Math reference for template
    Math = Math;

    trackId = (item: ITenant): number => this.tenantService.getTenantIdentifier(item);

    ngOnInit(): void {
        this.subscription = combineLatest([this.activatedRoute.queryParamMap, this.activatedRoute.data])
            .pipe(
                tap(([params, data]) => this.fillComponentAttributeFromRoute(params, data)),
                tap(() => this.load())
            )
            .subscribe();
    }

    // byteSize(base64String: string): string {
    //     return this.dataUtils.byteSize(base64String);
    // }

    // openFile(base64String: string, contentType: string | null | undefined): void {
    //     return this.dataUtils.openFile(base64String, contentType);
    // }

    delete(tenant: ITenant): void {
        // const modalRef = this.modalService.open(TenantDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
        // modalRef.componentInstance.tenant = tenant;
        // // unsubscribe not needed because closed completes on modal close
        // modalRef.closed
        //     .pipe(
        //         filter((reason) => reason === ITEM_DELETED_EVENT),
        //         tap(() => this.load())
        //     )
        //     .subscribe();
    }

    load(): void {
        this.queryBackend().subscribe({
            next: (res: EntityArrayResponseType) => {
                this.onResponseSuccess(res);
            }
        });
    }

    // navigateToWithComponentValues(event: SortState): void {
    //     this.handleNavigation(this.page, event);
    // }

    // navigateToPage(page: number): void {
    //     this.handleNavigation(page, this.sortState());
    // }

    protected fillComponentAttributeFromRoute(params: ParamMap, data: Data): void {
        const page = params.get(PAGE_HEADER);
        this.page = +(page ?? 1);
        this.sortState.set(this.sortService.parseSortParam(params.get(SORT) ?? data[DEFAULT_SORT_DATA]));
    }

    protected onResponseSuccess(response: EntityArrayResponseType): void {
        this.fillComponentAttributesFromResponseHeader(response.headers);
        const dataFromBody = this.fillComponentAttributesFromResponseBody(response.body);
        this.tenants.set(dataFromBody);
    }

    protected fillComponentAttributesFromResponseBody(data: ITenant[] | null): ITenant[] {
        return data ?? [];
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

    protected handleNavigation(page: number, sortState: SortState): void {
        const queryParamsObj = {
            page,
            size: this.itemsPerPage,
            sort: this.sortService.buildSortParam(sortState)
        };

        this.ngZone.run(() => {
            this.router.navigate(['./'], {
                relativeTo: this.activatedRoute,
                queryParams: queryParamsObj
            });
        });
    }
}
