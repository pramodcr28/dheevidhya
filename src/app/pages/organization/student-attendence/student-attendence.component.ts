import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { ITenantUser } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { StudentAttendenceServiceService } from '../../service/student-attendence-service.service';
import { UserService } from '../../service/user.service';
import { SmartAttendanceComponent } from '../../smart-attendance-component/smart-attendance-component.component';

type Status = 'Present' | 'Late' | 'Absent' | '';

@Component({
    selector: 'app-student-attendence',
    imports: [CommonModule, ButtonModule, SmartAttendanceComponent],
    templateUrl: './student-attendence.component.html',
    styles: ``
})
export class StudentAttendenceComponent {
    studentService = inject(UserService);
    profileService = inject(ProfileConfigService);
    attendenceService = inject(StudentAttendenceServiceService);
    loader = inject(ApiLoaderService);
    students = signal<any[] | null>([]);
    attendendenceList = signal([]);
    ngOnInit() {
        this.load();
    }

    load(): void {
        this.loader.show('Fetching Staff Data');
        this.profileService.search(0, 100, 'id', 'ASC', { 'profileType.equals': 'STUDENT' }).subscribe({
            next: (res: any) => {
                this.students.set(res.content);
                this.loader.hide();
            }
        });

        this.attendenceService.search(0, 100, 'sessionDate', 'ASC', {}).subscribe((res) => {
            this.attendendenceList.set(res.content);
            this.loader.hide();
        });
    }

    getInitials(name: string): string {
        const parts = name.split(' ');
        return parts
            .map((p) => p[0])
            .join('')
            .toUpperCase();
    }

    markToday(student: ITenantUser, status: Status) {
        // student.statusToday = status;
    }

    getStatusColor(status: Status): string {
        switch (status) {
            case 'Present':
                return 'bg-green-100 text-green-800';
            case 'Late':
                return 'bg-yellow-100 text-yellow-700';
            case 'Absent':
                return 'bg-red-100 text-red-700';
            default:
                return 'text-gray-400';
        }
    }

    getStatusCircle(status: Status): string {
        switch (status) {
            case 'Present':
                return 'bg-green-500';
            case 'Late':
                return 'bg-yellow-400';
            case 'Absent':
                return 'bg-red-500';
            default:
                return 'bg-gray-300';
        }
    }
}
