import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar'; // Added
import { BadgeModule } from 'primeng/badge'; // Added
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag'; // Added
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { UserFilterPipePipe } from '../../../core/pipe/user-filter-pipe.pipe';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { IDepartmentAcademicYear, IMasterClass, IMasterDepartment } from '../../models/org.model'; // Import IMasterClass
import { ProfileConfigService } from '../../service/profile-config.service';
import { UserService } from '../../service/user.service';

@Component({
    selector: 'app-department-setup',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TabsModule, SelectModule, ToastModule, TooltipModule, UserFilterPipePipe, AvatarModule, TagModule, BadgeModule],
    templateUrl: './department-setup.component.html',
    styles: [],
    providers: [MessageService]
})
export class DepartmentSetupComponent implements OnInit {
    commonService = inject(CommonService);
    departmentConfigService = inject(DepartmentConfigService);
    userService = inject(UserService);
    profileService = inject(ProfileConfigService);
    private messageService = inject(MessageService);
    private activatedRoute = inject(ActivatedRoute);
    private router = inject(Router);
    public loader = inject(ApiLoaderService);

    selectedMasterDepartment: any | null = null;
    selectedDepartment: IMasterDepartment | null = null;
    selectedAcademicYear: IDepartmentAcademicYear | null = null;
    academicYears: IDepartmentAcademicYear[] = [];
    users: any[] = [];
    selectedDepartmentId = null;
    activeTabIndex = null;
    activeClass: IMasterClass | null = null;
    confirmationService = inject(ConfirmationService);
    ngOnInit() {
        this.activatedRoute.params.subscribe((params) => {
            const deptId = params['id'];
            if (deptId) {
                this.selectedDepartmentId = deptId;
                this.apiCall(deptId);
            }
        });
    }

    apiCall(deptId) {
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
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch academic years' });
            }
        );
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

                // Automatically select the first class for the dashboard view
                if (this.selectedDepartment?.classes && this.selectedDepartment.classes.length > 0) {
                    this.activeClass = this.selectedDepartment.classes[0];
                }

                this.fetchDepartmentStaff();
            },
            (error) => {
                this.loader.hide();
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch department configuration' });
            }
        );
    }

    fetchDepartmentStaff() {
        if (!this.selectedMasterDepartment?.id) return;
        this.profileService
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
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch staff' });
                }
            );
    }

    // New Helper: Select a class to view
    selectClass(classItem: IMasterClass) {
        this.activeClass = classItem;
    }

    // Helper: Count total subjects in a class for badges
    getSubjectCount(classItem: IMasterClass): number {
        if (!classItem.sections) return 0;
        // Approximation based on first section to avoid heavy calculation in template
        return classItem.sections[0]?.subjects?.length || 0;
    }

    async saveSetup() {
        if (!this.selectedMasterDepartment || !this.selectedDepartment) return;
        this.selectedMasterDepartment.department = this.selectedDepartment;
        this.selectedMasterDepartment.branch = this.commonService.branch;
        this.loader.show('Updating Department Configuration...');
        this.departmentConfigService.update(this.selectedMasterDepartment).subscribe(
            () => {
                this.loader.hide();
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Department Configuration Updated Successfully!' });
                setTimeout(() => this.goBack(), 1000);
            },
            () => {
                this.loader.hide();
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update configuration' });
            }
        );
    }

    goBack() {
        this.router.navigate(['/departments']);
    }

    addNewAcademicYear() {
        this.router.navigate(['/add-academic-year', this.selectedDepartment?.id ?? this.selectedDepartmentId]);
    }

    editAcademicYear() {
        if (this.selectedAcademicYear) {
            this.router.navigate(['/edit-academic-year', this.selectedAcademicYear.deptConfigId]);
        }
    }

    confirmDelete(id: string): void {
        this.confirmationService.confirm({
            header: 'Confirm Deletion',
            message: 'Are you sure you want to delete this academic year?',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteAcademicYear(id)
        });
    }

    deleteAcademicYear(id: string): void {
        this.departmentConfigService.delete(id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Academic year deleted successfully'
                });

                this.selectedAcademicYear = null;
                this.apiCall(this.selectedDepartmentId);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete academic year'
                });
            }
        });
    }
}
