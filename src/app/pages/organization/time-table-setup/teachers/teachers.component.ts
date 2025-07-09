import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeTableService } from '../../../service/time-table.service';
import { Teacher } from '../../../models/time-table';
import { DialogModule } from 'primeng/dialog';



@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule,DialogModule],
  templateUrl: './teachers.component.html'
})
export class TeachersComponent {
// [x: string]: any;
   timeTableService = inject(TimeTableService);
   selectedTeacher: Teacher | null = null;
   showDialog: boolean = false;

workingDays() {
  return this.timeTableService.timeTable.settings.workingDays.filter(slot => slot.selected);
}

getPeriodCountArray(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i);
}

saveAvailability(): void {
  // this.timeTableService.saveTeacherAvailability(this.selectedTeacher);
  this.showDialog = false; // Optionally close the dialog on save
}
}