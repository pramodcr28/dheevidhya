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
import { AttendanceRecord } from '../../models/attendence.model';

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
        TableModule
  ],
  templateUrl: './detailed-reports.component.html',
  styles: ``
})
export class DetailedReportsComponent 
{
   attendenceService = inject(StudentAttendenceServiceService);
   selectedTimePeriod: any = null;

     ngOnInit() {
    this.attendenceService.currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.generateMockReport();
  }

     generateMockReport() {
       // This would be replaced with actual API calls in a real application
       this.attendenceService.classAttendanceReport = this.attendenceService.currentAttendence.map(student => {
         const records: AttendanceRecord[] = [];
         const totalClasses = 20; // Example total classes in selected period
         
         // Generate random attendance records for demonstration
         for (let i = 0; i < totalClasses; i++) {
           const date = new Date();
           date.setDate(date.getDate() - i);
           
           const status = Math.random() > 0.2 ? "PRESENT" : 
                         Math.random() > 0.5 ? "ABSENT" : "LATE";
           
           records.push({
             date: date.toLocaleDateString(),
             status: status
           });
         }
         
         const presentCount = records.filter(r => r.status === 'PRESENT').length;
         const absentCount = records.filter(r => r.status === 'ABSENT').length;
         const lateCount = records.filter(r => r.status === 'LATE').length;
         const attendancePercentage = Math.round((presentCount / totalClasses) * 100);
         
         return {
           student: student,
           attendanceRecords: records,
           totalPresent: presentCount,
           totalAbsent: absentCount,
           totalLate: lateCount,
           attendancePercentage: attendancePercentage
         };
       });
     }

  generateReport() {
    // In a real app, this would fetch data based on selected filters
    console.log('Generating report for:', this.attendenceService.selectedSection, this.selectedTimePeriod);
    this.generateMockReport();
  }

  exportToExcel() {
    console.log('Exporting to Excel');
    alert('Export to Excel functionality would be implemented here');
  }

  printReport() {
    window.print();
  }

    getAverageAttendance(): number {
    if (this.attendenceService.classAttendanceReport.length === 0) return 0;
    const total = this.attendenceService.classAttendanceReport.reduce((sum, report) => sum + report.attendancePercentage, 0);
    return Math.round(total / this.attendenceService.classAttendanceReport.length);
  }

  getBestAttendance(): number {
    if (this.attendenceService.classAttendanceReport.length === 0) return 0;
    return Math.max(...this.attendenceService.classAttendanceReport.map(r => r.attendancePercentage));
  }

  getWorstAttendance(): number {
    if (this.attendenceService.classAttendanceReport.length === 0) return 0;
    return Math.min(...this.attendenceService.classAttendanceReport.map(r => r.attendancePercentage));
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
