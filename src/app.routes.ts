import { Routes } from '@angular/router';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { StudentListComponent } from './app/pages/students/student-list/student-list.component';
import { AppLayout } from './app/core/layout/app.layout';
import { ProfileComponent } from './app/pages/profile/profile.component';
import { EmployeeListComponent } from './app/pages/employee/employee-list/employee-list.component';
import { OrgTreeComponent } from './app/pages/organization/org-tree/org-tree.component';
import { TimetableGeneratorComponent } from './app/pages/organization/time-table-setup/time-table-setup.component';
import { DepartmentSetupComponent } from './app/pages/organization/department-setup/department-setup.component';
import { StudentAttendenceComponent } from './app/pages/organization/student-attendence/student-attendence.component';
import { ExaminationComponent } from './app/pages/examination/examination.component';
import { TimetableListComponent } from './app/pages/organization/timetable-list/timetable-list.component';
import { AssignmentManagementComponent } from './app/pages/organization/assignment-management/assignment-management.component';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard },
            { path: 'students', component: StudentListComponent },
            { path: 'employees', component: EmployeeListComponent },
            { path: 'org', component: OrgTreeComponent },
            { path: 'time-table-setup', component: TimetableGeneratorComponent },
            { path: 'time-table-list', component: TimetableListComponent },
            { path: 'student-attendence', component: StudentAttendenceComponent },
            { path: 'examination', component: ExaminationComponent},
            { path: 'assignment', component: AssignmentManagementComponent},
            
            { path: 'department-setup', component: DepartmentSetupComponent },
            { path: 'profile', component: ProfileComponent },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/core/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
