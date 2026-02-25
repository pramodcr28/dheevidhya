import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SmartAttendanceComponent } from '../../smart-attendance-component/smart-attendance-component.component';

@Component({
    selector: 'app-student-attendence',
    imports: [CommonModule, ButtonModule, SmartAttendanceComponent],
    templateUrl: './student-attendence.component.html',
    styles: ``
})
export class StudentAttendenceComponent {}
