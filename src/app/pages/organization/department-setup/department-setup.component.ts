import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccordionModule, AccordionPanel } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { UserFilterPipePipe } from '../../../core/pipe/user-filter-pipe.pipe';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { IDepartmentAcademicYear, IMasterDepartment } from '../../models/org.model';
import { UserService } from '../../service/user.service';

@Component({
    selector: 'app-department-setup',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, DialogModule, InputTextModule, TabsModule, SelectModule, AccordionModule, AccordionPanel, ToastModule, UserFilterPipePipe],
    templateUrl: './department-setup.component.html',
    styles: [],
    providers: [MessageService]
})
export class DepartmentSetupComponent implements OnInit {
    commonService = inject(CommonService);
    departmentConfigService = inject(DepartmentConfigService);
    userService = inject(UserService);
    private messageService = inject(MessageService);
    private activatedRoute = inject(ActivatedRoute);
    private router = inject(Router);
    public loader = inject(ApiLoaderService);

    selectedMasterDepartment: any | null = null;
    selectedDepartment: IMasterDepartment | null = null;
    selectedAcademicYear: IDepartmentAcademicYear | null = null;
    academicYears: IDepartmentAcademicYear[] = [];
    users: any[] = [];

    activeTabIndex = null;

    ngOnInit() {
        this.activatedRoute.params.subscribe((params) => {
            const deptId = params['id'];
            if (deptId) {
                this.departmentConfigService.fetchAcademicYears(deptId).subscribe(
                    (data) => {
                        this.academicYears = data || [];
                        this.loader.hide();
                        if (this.academicYears.length > 0) {
                            this.selectAcademicYear(this.academicYears[0]?.deptConfigId);
                        }
                    },
                    (error) => {
                        this.loader.hide();
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to fetch academic years'
                        });
                    }
                );
            }
        });
    }

    selectAcademicYear(id: string) {
        this.selectedAcademicYear = this.academicYears.find((ac) => ac.deptConfigId == id);
        this.activeTabIndex = id;
        this.fetchDepartmentConfig(this.activeTabIndex);
    }

    fetchDepartmentConfig(deptConfigId: string) {
        this.loader.show('Fetching department configuration...');

        this.departmentConfigService.find(deptConfigId).subscribe(
            (response: any) => {
                this.selectedDepartment = response.body?.department;
                this.selectedMasterDepartment = response.body;

                this.fetchDepartmentStaff();
            },
            (error) => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch department configuration'
                });
            }
        );
    }

    fetchDepartmentStaff() {
        if (!this.selectedMasterDepartment?.id) return;

        this.userService
            .search(0, 100, 'id', 'ASC', {
                'departments.in': [this.selectedMasterDepartment.id],
                'profileType.equals': 'STAFF'
            })
            .subscribe(
                (result: any) => {
                    this.users = result.content || [];
                    this.loader.hide();
                },
                (error) => {
                    this.loader.hide();
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to fetch staff'
                    });
                }
            );
    }

    async saveSetup() {
        if (!this.selectedMasterDepartment || !this.selectedDepartment) return;

        this.selectedMasterDepartment.department = this.selectedDepartment;
        this.selectedMasterDepartment.branch = this.commonService.branch;
        this.loader.show('Updating Department Configuration...');

        this.departmentConfigService.update(this.selectedMasterDepartment).subscribe(
            () => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Department Configuration Updated Successfully!'
                });
                setTimeout(() => this.goBack(), 1000);
            },
            () => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update configuration'
                });
            }
        );
    }

    goBack() {
        this.router.navigate(['/departments']);
    }

    addNewAcademicYear() {
        this.router.navigate(['/add-academic-year', this.selectedDepartment.id]);
    }

    // NEW METHOD: Handle Edit Navigation
    editAcademicYear() {
        if (this.selectedAcademicYear) {
            // You need to ensure your Routing Module supports '/edit-academic-year/:configId'
            // or reuse the same component route if it can handle ID differentiation
            this.router.navigate(['/edit-academic-year', this.selectedAcademicYear.deptConfigId]);
        }
    }
}
