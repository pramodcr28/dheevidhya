import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Tabs, TabsModule } from 'primeng/tabs';
import { AttendenceReportComponent } from './attendence-report/attendence-report.component';
import { DetailedReportsComponent } from './detailed-reports/detailed-reports.component';
import { TakeAttendenceComponent } from './take-attendence/take-attendence.component';

@Component({
    selector: 'app-smart-attendance',
    standalone: true,
    imports: [CommonModule, Tabs, TakeAttendenceComponent, DetailedReportsComponent, AttendenceReportComponent, TabsModule],
    templateUrl: './smart-attendance-component.component.html'
})
export class SmartAttendanceComponent {
    activeTab: string = '0';
}
