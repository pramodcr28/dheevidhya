import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ApiLoaderComponent } from './app/core/layout/loaderComponent';
import { AccountService } from './app/core/services/account.service';
import { CommonService } from './app/core/services/common.service';
import { WebSocketService } from './app/core/services/websocket.service';
import { UserProfileState } from './app/core/store/user-profile/user-profile.reducer';
import { selectUserConfig } from './app/core/store/user-profile/user-profile.selectors';
import { ConfirmationDialogComponent } from './app/shared/confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, ApiLoaderComponent, CommonModule, ToastModule, ConfirmDialogModule, ConfirmationDialogComponent],
    template: ` <p-toast></p-toast>
        <!-- API Loader Component -->
        <p-confirmDialog> </p-confirmDialog>
        <app-confirmation-dialog></app-confirmation-dialog>
        <app-confirmation-dialog></app-confirmation-dialog>
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
            const studentRole = user?.roles?.student;
            const department = user?.departments[0]; // First department
            if (department != null) {
                const subejcts = department.department.classes.flatMap((cls) => cls.sections).flatMap((sec) => sec.subjects);
                if (studentRole && department) {
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
                        userId: user.userId,
                        academicYear: user.academicYear || ''
                    };
                } else {
                    this.commonService.getUserInfo = {
                        subjectsNames: subejcts.filter((sub) => user.subjectIds?.includes(sub.id)).map((sub) => sub.name),
                        subjectIds: user.subjectIds,
                        fullName: user.fullName,
                        userId: user.userId,
                        branchId: this.commonService?.branch?.id + '' || '',
                        branchCode: this.commonService?.branch?.code + '' || '',
                        branchName: this.commonService?.branch?.name || '',
                        academicYear: user.academicYear || '',
                        departmentName: department.department.name,
                        departmentId: department.id
                    };
                }
            }
        });
        this.wsService.getMessages().subscribe((message) => {
            console.log('Web socket trigger ID' + message);
            this.accountService.identity().subscribe((result) => {});
        });
    }
}
