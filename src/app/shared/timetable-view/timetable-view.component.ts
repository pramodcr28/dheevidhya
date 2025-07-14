import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DepartmentTimetable } from '../../pages/models/time-table';

@Component({
  selector: 'app-timetable-view',
  imports: [CommonModule,ToastModule],
  providers:[MessageService],
  templateUrl: './timetable-view.component.html',
  styles: ``
})
export class TimetableViewComponent {
  
  @Input() timetableJson: DepartmentTimetable;
  @Input() dailogeType: 'Edit' | 'View'; 
  @Output() publish = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  getSlotIndexes(classSec: any): number[] {
    if (!classSec || !classSec.schedules || !classSec.schedules[0]?.periods) {
      return [];
    }
    return classSec.schedules[0].periods.map((_: any, i: number) => i);
  }

  getDayName(dayIndex) {
  return this.timetableJson.settings.workingDays
    .filter(day => day.selected)[dayIndex]?.name;
  }

  onPublish() {
    this.publish.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
