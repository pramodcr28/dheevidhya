  import { CommonModule, formatDate } from '@angular/common';
  import { Component, inject, Input } from '@angular/core';
  import { FormsModule } from '@angular/forms';
  import { MessageService, ConfirmationService } from 'primeng/api';
  import { ButtonModule } from 'primeng/button';
  import { CardModule } from 'primeng/card';
  import { DropdownModule } from 'primeng/dropdown';
  import { TableModule } from 'primeng/table';
  import { ToastModule } from 'primeng/toast';
  import { CalendarModule } from 'primeng/calendar';
  import { DragDropModule } from 'primeng/dragdrop';
  import { InputNumberModule } from 'primeng/inputnumber';
  import { Subject } from '../../models/time-table';
  import { SliderModule } from 'primeng/slider';
  import { KnobModule } from 'primeng/knob';
  import { ExaminationTimeSlot, ExaminationTimeTable } from '../../models/examination.model';
import { CommonService } from '../../../core/services/common.service';

  @Component({
    selector: 'app-exam-slots',
    standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      CalendarModule,
      DropdownModule,
      ButtonModule,
      TableModule,
      DragDropModule,
      CardModule,
      ToastModule,
      InputNumberModule,
      SliderModule,
      KnobModule
    ],
    templateUrl: './exam-slots.component.html',
    styles: [],
    providers: [MessageService, ConfirmationService]
  })
  export class ExamSlotsComponent {
    draggedSubject: any;
    isDragOver = false;
    dragOverDay = -1;
    dragOverSlot = -1;

    slotOptions = [
      { label: '1 Slot', value: 1 },
      { label: '2 Slots', value: 2 },
      { label: '3 Slots', value: 3 },
      { label: '4 Slots', value: 4 },
      { label: '5 Slots', value: 5 },
      { label: '6 Slots', value: 6 }
    ];

    durationOptions = [
      { label: '1 Hour', value: 60 },
      { label: '1.5 Hours', value: 90 },
      { label: '2 Hours', value: 120 },
      { label: '2.5 Hours', value: 150 },
      { label: '3 Hours', value: 180 },
      { label: '3.5 Hours', value: 210 },
      { label: '4 Hours', value: 240 }
    ];
    private _subjects: Subject[];
    @Input()
    timeTable:ExaminationTimeTable;

    @Input()
  set subjects(value: Subject[]) {
    this._subjects = value || [];
  }

  get subjects(): Subject[] {
    return this._subjects;
  }

    constructor(private messageService: MessageService) {}
    commonService = inject(CommonService);
    ngOnInit() {

      this.timeTable.settings.endDate.setDate(this.timeTable.settings.startDate.getDate() + Math.round(this.subjects.length/this.timeTable.settings.slotsperday));
    }

    getTimeSlots(): string[] {
    const slots: string[] = [];

    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0);

    for (let i = 0; i < this.timeTable.settings.slotsperday; i++) {
      const endTime = new Date(currentTime.getTime() + this.timeTable.settings.slotDuration * 60000);
      slots.push(`${this.formatTime(currentTime)} - ${this.formatTime(endTime)}`);
      currentTime = new Date(endTime.getTime() + (i < this.timeTable.settings.slotsperday - 1 ? this.timeTable.settings.breakDuration * 60000 : 0));
    }

    return slots;
  }

generateTimeTable() {
  this.timeTable.schedules.splice(0, this.timeTable.schedules.length); // Clear in-place

  let currentDate = new Date(this.timeTable.settings.startDate);

  while (currentDate <= new Date(this.timeTable.settings.endDate)) {
    let slotStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      9, 0, 0, 0 
    );

    for (let i = 0; i < this.timeTable.settings.slotsperday; i++) {
      const slotEnd = new Date(slotStart.getTime() + this.timeTable.settings.slotDuration * 60000);

      this.timeTable.schedules.push({
        startTime:  formatDate(slotStart,this.commonService.dateTimeFormate,'en-US'),
        endTime: formatDate( slotEnd,this.commonService.dateTimeFormate,'en-US'),
        day: formatDate(slotStart,this.commonService.dateFormate,'en-US'),
        breakDuration: 15,
        subjectName: '',
        color: ''  
      });

      if (i < this.timeTable.settings.slotsperday - 1) {
        slotStart = new Date(slotEnd.getTime() + this.timeTable.settings.breakDuration * 60000);
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }
}

getSlotTimeRange(slot: ExaminationTimeSlot): string {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  return `${this.formatTime(start)} - ${this.formatTime(end)}`;
}

getDays(): string[] {
  return Array.from(new Set(this.timeTable.schedules.map(slot => slot.day)));
}

getSlotsForDay(dayISO: string): ExaminationTimeSlot[] {
  return this.timeTable.schedules.filter(slot => slot.day === dayISO);
}

    formatTime(date: Date): string {
      const hour = date.getHours();
      const minute = date.getMinutes();
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const displayMinute = minute.toString().padStart(2, '0');
      return `${displayHour}:${displayMinute} ${period}`;
    }

    formatDate(date: Date | string): string {
      date = new Date(date);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    }

    onDragStart(subject: any) {
      this.draggedSubject = subject;
    }

    onDragEnd(event: any) {
      this.isDragOver = false;
      this.dragOverDay = -1;
      this.dragOverSlot = -1;
      this.draggedSubject = null;
    }

    onDrop(event: any, slot: ExaminationTimeSlot) {
    this.isDragOver = false;
    this.dragOverSlot = null;

    if (this.draggedSubject) {
      slot.subjectName = this.draggedSubject.name;
      slot.color = this.draggedSubject.color
      this.messageService.add({ severity: 'success', summary: 'Assigned', detail: `${this.draggedSubject.name} assigned to ${slot.day}` });
    }
  }

  removeSubject(slot: ExaminationTimeSlot) {
    const removed = slot.subjectName;
    slot.subjectName = undefined;
    if (removed) {
      this.messageService.add({ severity: 'info', summary: 'Removed', detail: `${removed} removed` });
    }
  }

  }