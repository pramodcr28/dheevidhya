import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TakeAttendenceComponent } from './take-attendence/take-attendence.component';
import { DetailedReportsComponent } from './detailed-reports/detailed-reports.component';
import { AttendenceReportComponent } from './attendence-report/attendence-report.component';

@Component({
  selector: 'app-smart-attendance',
  standalone: true,
  imports: [
    CommonModule,
    TakeAttendenceComponent,
    DetailedReportsComponent,
    AttendenceReportComponent
  ],
  templateUrl: './smart-attendance-component.component.html',
})
export class SmartAttendanceComponent {

  activeTab: 'attendance' | 'reports' | 'detailed' = 'attendance';

}