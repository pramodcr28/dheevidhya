import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DatePicker } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CommonService } from '../../../core/services/common.service';
import { StudentAttendanceReportResponse } from '../../models/attendence.model';
import { StudentAttendenceServiceService } from '../../service/student-attendence-service.service';

@Component({
    selector: 'app-my-attendance-report',
    standalone: true,
    imports: [CommonModule, FormsModule, TagModule, ProgressBarModule, SkeletonModule, SelectButtonModule, CalendarModule, DropdownModule, ToastModule, CardModule, ChipModule, DatePicker],
    providers: [MessageService],
    templateUrl: `./my-attendance-report.component.html`
})
export class MyAttendanceReportComponent implements OnInit {
    report = signal<StudentAttendanceReportResponse | null>(null);
    loading = signal(false);
    studentAttendanceService = inject(StudentAttendenceServiceService);
    commonService = inject(CommonService);
    dateRange: Date[] = [];
    constructor(private toast: MessageService) {}

    ngOnInit(): void {
        this.loadReport();
    }

    loadReport(): void {
        if (this.dateRange.length > 0 && (!this.dateRange[0] || !this.dateRange[1])) return;

        if (!this.commonService.currentUser.academicYear) {
            this.toast.add({ severity: 'warn', summary: 'Select academic year', life: 3000 });
            return;
        }

        this.loading.set(true);
        let params = new HttpParams().set('academicYear', this.commonService.currentUser.academicYear).set('studentId', '264');

        if (this.dateRange?.length === 2) {
            params = params.set('startDate', this.commonService.formatDateForApi(this.dateRange[0])).set('endDate', this.commonService.formatDateForApi(this.dateRange[1]));
        }

        this.studentAttendanceService.getStudentReport(params).subscribe({
            next: (data) => {
                this.report.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.toast.add({ severity: 'error', summary: 'Failed to load report', life: 3000 });
                this.loading.set(false);
            }
        });
    }

    pctStroke(status: 'GOOD' | 'WARNING' | 'CRITICAL'): string {
        return status === 'GOOD' ? 'text-emerald-500' : status === 'WARNING' ? 'text-amber-400' : 'text-red-500';
    }
}
