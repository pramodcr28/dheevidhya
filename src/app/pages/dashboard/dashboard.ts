import { Component, inject } from '@angular/core';
import { CommonService } from '../../core/services/common.service';
import { AdminDashboardComponent } from '../../dashboards/admin-dashboard/admin-dashboard.component';
import { HodDashboardComponent } from '../../dashboards/hod-dashboard/hod-dashboard.component';
import { StaffDashboardComponent } from '../../dashboards/staff-dashboard/staff-dashboard.component';
import { StudentDashboardComponent } from '../../dashboards/student-dashboard/student-dashboard.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [AdminDashboardComponent, HodDashboardComponent, StaffDashboardComponent, StudentDashboardComponent],
    template: `
        @if (isAdmin()) {
            <app-admin-dashboard></app-admin-dashboard>
        } @else if (isHod()) {
            <app-hod-dashboard></app-hod-dashboard>
        } @else if (isStaff()) {
            <app-staff-dashboard></app-staff-dashboard>
        } @else if (isStudent()) {
            <app-student-dashboard></app-student-dashboard>
        }
    `
})
export class DashboardComponent {
    commonService = inject(CommonService);

    private getRoles(): string[] {
        return this.commonService.getUserAuthorities ?? [];
    }

    isAdmin(): boolean {
        return this.getRoles().includes('IT_ADMINISTRATOR');
    }

    isHod(): boolean {
        return this.getRoles().some((role) => ['HEAD_OF_DEPARTMENT', 'HEAD_MASTER', 'VICE_PRINCIPAL', 'PRINCIPAL'].includes(role));
    }

    isStaff(): boolean {
        return this.getRoles().some((role) => ['LECTURER', 'TEACHER'].includes(role));
    }

    isStudent(): boolean {
        return this.getRoles().includes('STUDENT');
    }
}
