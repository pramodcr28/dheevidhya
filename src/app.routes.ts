import { Routes } from '@angular/router';
import { authGuard } from './app/core/auth/auth-guard.guard';
import { AppLayout } from './app/core/layout/app.layout';
import { StaffAttendanceComponent } from './app/pages/calendar/staff-calendar.component';
import { DashboardComponent } from './app/pages/dashboard/dashboard';
import { EmployeeListComponent } from './app/pages/employee/employee-list/employee-list.component';
import { ExaminationComponent } from './app/pages/examination/examination.component';
import { CategoryManagementComponent } from './app/pages/inventory-management/category-management/category-management.component';
import { AssetsManagementComponent } from './app/pages/inventory-management/inventory-management.component';
import { Notfound } from './app/pages/notfound/notfound';
import { AssignmentManagementComponent } from './app/pages/organization/assignment-management/assignment-management.component';
import { AddAcademicYearComponent } from './app/pages/organization/department-setup/add-academic-year/add-academic-year.component';
import { CloneAcademicYearComponent } from './app/pages/organization/department-setup/clone-academic-year/clone-academic-year.component';
import { DepartmentListComponent } from './app/pages/organization/department-setup/department-setup-list/department-setup-list.component';
import { DepartmentSetupComponent } from './app/pages/organization/department-setup/department-setup.component';
import { OrgTreeComponent } from './app/pages/organization/org-tree/org-tree.component';
import { SatsStudentListComponent } from './app/pages/organization/sats-student-list/sats-student-list.component';
import { StudentAttendenceComponent } from './app/pages/organization/student-attendence/student-attendence.component';
import { StudentPromotionComponent } from './app/pages/organization/student-promotion/student-promotion.component';
import { TimetableGeneratorComponent } from './app/pages/organization/time-table-setup/time-table-setup.component';
import { TimetableListComponent } from './app/pages/organization/timetable-list/timetable-list.component';
import { ProfileComponent } from './app/pages/profile/profile.component';
import { SchoolNoticeBoardComponent } from './app/pages/school-notice-board/school-notice-board.component';
import { MyAttendanceReportComponent } from './app/pages/smart-attendance-component/my-attendance-report/my-attendance-report.component';
import { StaffAttendanceManagementComponent } from './app/pages/staff-attendance-management/staff-attendance-management.component';
import { BulkStudentUploadComponent } from './app/pages/students/bulk-student-upload/bulk-student-upload.component';
import { BranchComponent } from './app/pages/tenant/branch/branch.component';
import { TenantComponent } from './app/pages/tenant/tenant.component';

export const appRoutes: Routes = [
    {
        path: '',
        canActivate: [authGuard],
        component: AppLayout,
        children: [
            { path: '', component: DashboardComponent },
            {
                path: 'tenant',
                children: [
                    {
                        path: '',
                        redirectTo: 'list',
                        pathMatch: 'full'
                    },
                    {
                        path: 'list',
                        component: TenantComponent,
                        title: 'Tenant Management'
                    },
                    {
                        path: ':tenantId/branch',
                        component: BranchComponent,
                        title: 'Tenant Branches'
                    },
                    { path: 'employees', component: EmployeeListComponent }
                ]
            },
            { path: 'stats-student-list', component: SatsStudentListComponent },
            // { path: 'students', component: StudentListComponent },
            { path: 'bulk-student-upload', component: BulkStudentUploadComponent },
            { path: 'employees', component: EmployeeListComponent },
            { path: 'org', component: OrgTreeComponent },
            { path: 'time-table-setup', component: TimetableGeneratorComponent },
            { path: 'time-table-list', component: TimetableListComponent },
            { path: 'student-attendence', component: StudentAttendenceComponent },
            { path: 'attendence', component: MyAttendanceReportComponent },
            { path: 'examination', component: ExaminationComponent },
            { path: 'assignment', component: AssignmentManagementComponent },
            { path: 'notice-board', component: SchoolNoticeBoardComponent },
            { path: 'staff-calendar', loadComponent: () => StaffAttendanceComponent, data: { title: 'My Calendar' } },
            { path: 'attendance-management', loadComponent: () => StaffAttendanceManagementComponent, data: { title: 'Attendance Management' } },

            {
                path: 'inventory',
                children: [
                    {
                        path: '',
                        redirectTo: 'assets',
                        pathMatch: 'full'
                    },
                    {
                        path: 'categories',
                        component: CategoryManagementComponent,
                        title: 'Category Management'
                    },
                    {
                        path: 'assets',
                        component: AssetsManagementComponent,
                        title: 'Assets Management'
                    }
                ]
            },
            { path: 'departments', component: DepartmentListComponent },
            {
                path: 'department-setup/:id',
                component: DepartmentSetupComponent
            },
            {
                path: 'add-academic-year/:id',
                component: AddAcademicYearComponent
            },
            {
                path: 'edit-academic-year/:id',
                component: AddAcademicYearComponent
            },
            {
                path: 'clone-academic-year/:id',
                component: CloneAcademicYearComponent
            },
            {
                path: 'student-promotion',
                component: StudentPromotionComponent,
                title: 'Student Promotion'
            },
            { path: 'profile', component: ProfileComponent }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/core/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
