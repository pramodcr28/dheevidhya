import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CommonService } from '../../../core/services/common.service';
import { AttendanceReport } from '../../models/attendence.model';
import { StudentAttendenceServiceService } from '../../service/student-attendence-service.service';
import { Section } from './../../models/org.model';

@Component({
    selector: 'app-detailed-reports',
    imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, InputTextModule, CardModule, BadgeModule, TagModule, TableModule, MultiSelect, DatePickerModule],
    templateUrl: './detailed-reports.component.html',
    styles: ``
})
export class DetailedReportsComponent {
    attendenceService = inject(StudentAttendenceServiceService);
    selectedTimePeriod: any = null;
    commonService = inject(CommonService);

    classAttendanceReport: AttendanceReport[] = [];
    selectedSection: Section[] | null = [];
    selectedSubject: any[] = [];
    today: Date = new Date();
    attendanceDateRange: Date[] = [];
    ngOnInit() {
        this.selectedSection = [];
        // this.attendenceService.currentDate = new Date().toLocaleDateString('en-US', {
        //   year: 'numeric',
        //   month: 'long',
        //   day: 'numeric'
        // });
        this.getReports();
    }

    getReports() {
        console.log();
        let reqBody = {
            academicYear: '2025-2026',
            departmentIds: this.selectedSection.map((sec) => sec.departmentId),
            classIds: this.selectedSection.map((sec) => sec.classId),
            sectionIds: this.selectedSection.map((sec) => sec.sectionId)
            // "subjectIds": [...this.selectedSubject.map(sub=>sub.code)],  // match subjectCode
            // "attendanceDateRange": [
            //   "2025-08-01",  // start date (ISO string or yyyy-MM-dd)
            //   "2025-08-31"   // end date
            // ]
        };
        if (this.selectedSubject.length) {
            reqBody['subjectIds'] = [...this.selectedSubject.map((sub) => sub.code)];
        }

        if (this.attendanceDateRange?.length === 2) {
            reqBody['attendanceDateRange'] = this.attendanceDateRange.map((d) => d.toISOString().split('T')[0]);
        }

        this.attendenceService.getReports(0, 100, 'id', 'ASC', reqBody).subscribe({
            next: (res: any) => {
                this.classAttendanceReport = res.content;
                // console.log(this.classAttendanceReport);
            }
        });
    }

    exportToExcel() {
        console.log('Exporting to Excel');
        alert('Export to Excel functionality would be implemented here');
    }

    printReport() {
        window.print();
    }

    getAverageAttendance(): number {
        if (this.classAttendanceReport.length === 0) return 0;
        const total = this.classAttendanceReport.reduce((sum, report) => sum + report.attendancePercentage, 0);
        return Math.round(total / this.classAttendanceReport.length);
    }

    getBestAttendance(): number {
        if (this.classAttendanceReport.length === 0) return 0;
        return Math.max(...this.classAttendanceReport.map((r) => r.attendancePercentage));
    }

    getWorstAttendance(): number {
        if (this.classAttendanceReport.length === 0) return 0;
        return Math.min(...this.classAttendanceReport.map((r) => r.attendancePercentage));
    }

    getAttendanceStatus(percentage: number): string {
        if (percentage >= 90) return 'Excellent';
        if (percentage >= 75) return 'Good';
        if (percentage >= 60) return 'Fair';
        return 'Poor';
    }

    getAttendanceSeverity(percentage: number): any {
        if (percentage >= 90) return 'success';
        if (percentage >= 75) return 'info';
        if (percentage >= 60) return 'warn';
        return 'danger';
    }
}
