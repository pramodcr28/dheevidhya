import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { finalize } from 'rxjs';
import { ContactLead } from '../../core/model/account.model';
import { AccountService } from '../../core/services/account.service';

@Component({
    selector: 'app-contact-leads-table',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, TooltipModule],
    templateUrl: './contact-leads-table.component.html'
})
export class ContactLeadsTableComponent implements OnInit {
    private readonly accountService = inject(AccountService);

    leads: ContactLead[] = [];
    loading = false;
    error: string | null = null;

    ngOnInit(): void {
        this.loadLeads();
    }

    loadLeads(): void {
        this.loading = true;
        this.error = null;

        this.accountService
            .getContactLeads()
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (leads) => {
                    this.leads = leads ?? [];
                },
                error: () => {
                    this.error = 'Unable to load generated leads.';
                    this.leads = [];
                }
            });
    }

    getCreatedOn(lead: ContactLead): string | null {
        return lead.createdDate || lead.createdAt || null;
    }
}
