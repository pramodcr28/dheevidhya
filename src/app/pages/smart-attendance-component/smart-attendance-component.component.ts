import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { DetailedReportsComponent } from './detailed-reports/detailed-reports.component';
import { TakeAttendenceComponent } from './take-attendence/take-attendence.component';

@Component({
    selector: 'app-smart-attendance',
    standalone: true,
    imports: [CommonModule, TakeAttendenceComponent, DetailedReportsComponent, TabsModule],
    templateUrl: './smart-attendance-component.component.html'
})
export class SmartAttendanceComponent {
    activeView: 'take' | 'report' = 'take';
    today: Date = new Date();
}
