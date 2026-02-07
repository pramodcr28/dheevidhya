import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CommonService } from '../../../core/services/common.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getSubjectsByFilters } from '../../../core/store/user-profile/user-profile.selectors';
import { AttendanceException, AttendanceRequest, AttendanceStatus } from '../../models/attendence.model';
import { IMasterSubject, Section } from '../../models/org.model';
import { IProfileConfig } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { StudentAttendenceServiceService } from '../../service/student-attendence-service.service';
import { UserService } from '../../service/user.service';

@Component({
    selector: 'app-take-attendence',
    imports: [CommonModule, FormsModule, ButtonModule, SelectModule, InputTextModule, CardModule, BadgeModule, TagModule, TableModule, DatePicker, ToastModule],
    templateUrl: './take-attendence.component.html',
    styles: ``,
    providers: [MessageService]
})
export class TakeAttendenceComponent {
    selectedTimePeriod: any = null;
    attendenceService = inject(StudentAttendenceServiceService);
    commonService = inject(CommonService);
    profileService = inject(ProfileConfigService);
    selectedSection: Section | null;
    selectedSubject: IMasterSubject;
    slotDate: Date | undefined = new Date();
    messageService = inject(MessageService);
    currentAttendence: AttendanceException[] = [];
    subjects: any[] = [];
    private store = inject(Store<{ userProfile: UserProfileState }>);
    studentService = inject(UserService);
    loader = inject(ApiLoaderService);
    students = signal<any[] | null>([]);
    today: Date = new Date();
    takeAttandence = false;
    todayAttendence: AttendanceRequest;
    onSectionChange() {
        this.store.select(getSubjectsByFilters([this.selectedSection.departmentId], [this.selectedSection.classId], [this.selectedSection.sectionId])).subscribe((subjects) => {
            this.subjects = subjects;
            this.selectedSubject = null;
        });
        //  this.load();
    }

    selectionChange() {
        if (this.selectedSubject && this.selectedSection && this.slotDate) {
            // if(this.slotDate?.getTime() == this.today?.getTime()){
            //   this.takeAttandence = true
            // }
            this.load();
        }
    }

    isSelectedDateToday() {
        return formatDate(this.slotDate, this.commonService.dateFormate, 'en-US') == formatDate(this.today, this.commonService.dateFormate, 'en-US');
    }

    load(): void {
        this.currentAttendence = [];
        this.loader.show('Fetching Student Attendence');

        this.profileService
            .search(0, 100, 'id', 'ASC', {
                'profileType.equals': 'STUDENT',
                'roles.student.section_id.equals': this.selectedSection.sectionId,
                'roles.student.class_id.equals': this.selectedSection.classId,
                'departments.in': this.commonService.associatedDepartments.map((dpt) => dpt.id)
            })
            .subscribe({
                next: (res: any) => {
                    this.attendenceService
                        .search(0, 100, 'id', 'ASC', {
                            'departmentId.in': this.commonService.associatedDepartments.map((dpt) => dpt.id),
                            'classId.equals': this.selectedSection.classId,
                            'sectionId.equals': this.selectedSection.sectionId,
                            'subjectCode.equals': this.selectedSubject.code,
                            'sessionDate.equals': formatDate(this.slotDate, this.commonService.dateFormate, 'en-US')
                        })
                        .subscribe((result: any) => {
                            this.takeAttandence = result?.content?.length > 0;
                            let exceptions: any[] = result?.content[0]?.exceptions ?? [];
                            this.todayAttendence = result?.content[0];
                            res.content?.forEach((student: IProfileConfig) => {
                                let status: AttendanceStatus = 'PRESENT';

                                let exception = exceptions.find((e) => e.studentId === student.userId);

                                if (exception) {
                                    status = exception.status;
                                }

                                this.currentAttendence.push({
                                    studentName: student.fullName,
                                    studentId: student.userId,
                                    status: status
                                });
                            });

                            this.loader.hide();
                        });
                }
            });
    }

    updateAttendance(student: AttendanceException, status: 'PRESENT' | 'ABSENT' | 'LATE') {
        student.status = status;
    }

    markAllPresent() {
        this.currentAttendence.forEach((student) => {
            student.status = 'PRESENT';
        });
    }

    saveAttendance() {
        if (this.selectedSubject) {
            let todayAttendence: AttendanceRequest = {
                ...this.todayAttendence,
                academicYear: this.commonService.currentUser.academicYear,
                semester: 'Fall',
                departmentId: this.selectedSection.departmentId,
                classId: this.selectedSection.classId,
                sectionId: this.selectedSection.sectionId,
                subjectCode: this.selectedSubject.code,
                subjectName: this.selectedSubject.name,
                instructorName: this.commonService.currentUser.username,
                instructorId: this.commonService.currentUser.userId,
                sessionDate: formatDate(this.slotDate, this.commonService.dateFormate, 'en-US'),
                scheduleDay: 'monday',
                startTime: '10:00:00',
                endTime: '11:00:00',
                period: 0,
                exceptions: this.currentAttendence.filter((attendence) => attendence.status != 'PRESENT')
            };

            this.attendenceService.create(todayAttendence).subscribe((res) => {
                this.messageService.add({ text: 'Congrats! Record created!', summary: 'Success', severity: 'success', closeIcon: 'close' });
            });
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please select the subject'
            });
        }
    }

    getTagSeverity(status: any): 'success' | 'danger' | 'warn' {
        switch (status) {
            case 'Present':
                return 'success';
            case 'Absent':
                return 'danger';
            case 'Late':
                return 'warn';
            default:
                return 'success';
        }
    }
}
