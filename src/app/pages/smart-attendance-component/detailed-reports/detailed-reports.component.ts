import { Section } from './../../models/org.model';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { StudentAttendenceServiceService } from '../../service/student-attendence-service.service';
import { CommonService } from '../../../core/services/common.service';
import { MultiSelect } from 'primeng/multiselect';
import { AttendanceReport} from '../../models/attendence.model';

@Component({
  selector: 'app-detailed-reports',
  imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DropdownModule,
        InputTextModule,
        CardModule,
        BadgeModule,
        TagModule,
        TableModule,
        MultiSelect
  ],
  templateUrl: './detailed-reports.component.html',
  styles: ``
})
export class DetailedReportsComponent {
   attendenceService = inject(StudentAttendenceServiceService);
   selectedTimePeriod: any = null;
   commonService = inject(CommonService);
   
   classAttendanceReport: AttendanceReport[] = [];
   selectedSection: Section[] | null = [];
   selectedSubject:any[] = [];
     ngOnInit() {
      this.selectedSection = [
        { sectionId: "68282c6489869816a4108492",
          classId:"682b567577794f7170f3d743",
          departmentId:"682b574a77794f7170f3d747",
          sectionName: "SECTION_A",
          className: "SECOND_PUC",
          departmentName:""
        }]
    this.attendenceService.currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
   this.getReports();
  
  }

  getReports(){
      this.attendenceService.getReports(0, 100, 'id', 'ASC', 
      {
        "academicYear": "2025-2026",
        "departmentIds": this.selectedSection.map(sec=>sec.departmentId),
        "classIds":  this.selectedSection.map(sec=>sec.classId),
        "sectionIds": this.selectedSection.map(sec=>sec.sectionId)
      }
    ).subscribe({
          next: (res: any) => {
            this.classAttendanceReport = res.content;

            // console.log(this.classAttendanceReport)
          },
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
    return Math.max(...this.classAttendanceReport.map(r => r.attendancePercentage));
  }

  getWorstAttendance(): number {
    if (this.classAttendanceReport.length === 0) return 0;
    return Math.min(...this.classAttendanceReport.map(r => r.attendancePercentage));
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
