import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
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