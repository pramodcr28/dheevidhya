import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { ToastModule } from 'primeng/toast';
import { ApiLoaderComponent } from './app/core/layout/loaderComponent';
import { AccountService } from './app/core/services/account.service';
import { CommonService } from './app/core/services/common.service';
import { WebSocketService } from './app/core/services/websocket.service';
import { UserProfileState } from './app/core/store/user-profile/user-profile.reducer';
import { selectUserConfig } from './app/core/store/user-profile/user-profile.selectors';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, ApiLoaderComponent, CommonModule, ToastModule],
    template: ` <p-toast></p-toast>
        <!-- API Loader Component -->
        <app-api-loader></app-api-loader>
        <router-outlet></router-outlet>`
})
export class AppComponent {
    private wsService = inject(WebSocketService);
    private accountService = inject(AccountService);
    private store = inject(Store<{ userProfile: UserProfileState }>);
    private commonService = inject(CommonService);
    ngOnInit() {
        this.store.select(selectUserConfig).subscribe((user) => {
            const studentRole = user.roles.student;
            const department = user.departments[0]; // First department
            const subejcts = department.department.classes.flatMap((cls) => cls.sections).flatMap((sec) => sec.subjects);
            if (studentRole) {
                // Find the class and section details
                const classObj = department.department.classes.find((cls) => cls.id === studentRole.classId);
                const section = classObj?.sections.find((sec) => sec.id === studentRole.sectionId);

                this.commonService.getStudentInfo = {
                    className: classObj?.name || '',
                    sectionName: section?.name || '',
                    classId: studentRole.classId,
                    sectionId: studentRole.sectionId,
                    departmentName: department.department.name,
                    departmentId: department.id,
                    fullName: user.fullName,
                    userId: user.userId
                };
            } else {
                this.commonService.getUserInfo = {
                    subjectsNames: subejcts.filter((sub) => user.subjectIds.includes(sub.id)).map((sub) => sub.name),
                    subjectIds: user.subjectIds,
                    fullName: user.fullName,
                    userId: user.userId
                };
            }
            // this.commonService.getStudentInfo = {className: , sectionName: , classId: , sectionId:  , departmentName: , departmentId:  };
            // this.associatedDepartments = departments;
            // this.associatedDepartmentIds = departments.map((dept) => dept.id);
        });
        this.wsService.getMessages().subscribe((message) => {
            console.log('Web socket trigger ID' + message);
            this.accountService.identity().subscribe((result) => {});
        });
    }
}
