import { Routes } from '@angular/router';
import { authGuard } from './app/core/auth/auth-guard.guard';
import { AppLayout } from './app/core/layout/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { EmployeeListComponent } from './app/pages/employee/employee-list/employee-list.component';
import { ExaminationComponent } from './app/pages/examination/examination.component';
import { CategoryManagementComponent } from './app/pages/inventory-management/category-management/category-management.component';
import { AssetsManagementComponent } from './app/pages/inventory-management/inventory-management.component';
import { Notfound } from './app/pages/notfound/notfound';
import { AssignmentManagementComponent } from './app/pages/organization/assignment-management/assignment-management.component';
import { DepartmentSetupComponent } from './app/pages/organization/department-setup/department-setup.component';
import { OrgTreeComponent } from './app/pages/organization/org-tree/org-tree.component';
import { StudentAttendenceComponent } from './app/pages/organization/student-attendence/student-attendence.component';
import { TimetableGeneratorComponent } from './app/pages/organization/time-table-setup/time-table-setup.component';
import { TimetableListComponent } from './app/pages/organization/timetable-list/timetable-list.component';
import { ProfileComponent } from './app/pages/profile/profile.component';
import { SchoolNoticeBoardComponent } from './app/pages/school-notice-board/school-notice-board.component';
import { BulkStudentUploadComponent } from './app/pages/students/bulk-student-upload/bulk-student-upload.component';
import { StudentListComponent } from './app/pages/students/student-list/student-list.component';

export const appRoutes: Routes = [
    {
        path: '',
        canActivate: [authGuard],
        component: AppLayout,
        children: [
            { path: '', component: Dashboard },
            { path: 'students', component: StudentListComponent },
            { path: 'bulk-student-upload', component: BulkStudentUploadComponent },
            { path: 'employees', component: EmployeeListComponent },
            { path: 'org', component: OrgTreeComponent },
            { path: 'time-table-setup', component: TimetableGeneratorComponent },
            { path: 'time-table-list', component: TimetableListComponent },
            { path: 'student-attendence', component: StudentAttendenceComponent },
            { path: 'examination', component: ExaminationComponent },
            { path: 'assignment', component: AssignmentManagementComponent },
            { path: 'notice-board', component: SchoolNoticeBoardComponent },
            // { path: 'inventory', component: InventoryManagementComponent},
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
            { path: 'department-setup', component: DepartmentSetupComponent },
            { path: 'profile', component: ProfileComponent }
            // { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            // { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/core/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
