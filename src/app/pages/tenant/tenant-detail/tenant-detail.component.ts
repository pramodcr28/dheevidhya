import { Component, input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ITenant } from '../../models/tenant.model';

@Component({
    selector: 'tenant-detail',
    templateUrl: './tenant-detail.component.html',
    imports: [SharedModule, RouterModule, ButtonModule, TagModule]
})
export class TenantDetailComponent implements OnInit {
    tenant = input<ITenant | null>(null);

    ngOnInit(): void {
        console.log('Tenant Detail:', this.tenant);
    }

    previousState(): void {
        window.history.back();
    }
}
