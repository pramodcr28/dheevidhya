// department-list.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../../../environments/environment';
import { ApplicationConfigService } from '../../../../core/services/application-config.service';
import { ApiLoaderService } from '../../../../core/services/loaderService';
import { MasterDepartmentService } from '../../../../core/services/master-department.service';
import { IMasterDepartment } from '../../../models/org.model';

@Component({
    selector: 'app-department-list',
    standalone: true,
    imports: [CommonModule, ButtonModule, CardModule, SkeletonModule, ToastModule],
    templateUrl: './department-setup-list.component.html',
    styles: [],
    providers: [MessageService]
})
export class DepartmentListComponent implements OnInit {
    private http = inject(HttpClient);
    private applicationConfigService = inject(ApplicationConfigService);
    private router = inject(Router);
    private messageService = inject(MessageService);
    public loader = inject(ApiLoaderService);

    public departmentService = inject(MasterDepartmentService);

    masterDepartments: IMasterDepartment[] = [];
    ngOnInit() {
        this.fetchMasterDepartments();
        this.departmentService.query().subscribe(
            (data) => {
                this.masterDepartments = data.body || [];
            },
            (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch departments'
                });
            }
        );
    }

    fetchMasterDepartments() {
        const endpoint = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/master-departments');

        this.http.get<IMasterDepartment[]>(endpoint);
    }

    selectDepartment(dept: IMasterDepartment) {
        this.router.navigate(['/department-setup', dept.id]);
    }
}
