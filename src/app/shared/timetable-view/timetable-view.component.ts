import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-timetable-view',
  imports: [CommonModule,ToastModule],
  providers:[MessageService],
  templateUrl: './timetable-view.component.html',
  styles: ``
})
export class TimetableViewComponent {
  @Input() timetableJson: any;
  @Output() publish = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  getSlotIndexes(classSec: any): number[] {
    if (!classSec || !classSec.schedules || !classSec.schedules[0]?.periods) {
      return [];
    }
    return classSec.schedules[0].periods.map((_: any, i: number) => i);
  }

  onPublish() {
    this.publish.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
