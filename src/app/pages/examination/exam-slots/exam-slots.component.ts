import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

interface TimeSlot {
  id: string;
  time: string;
  subject?: Subject;
  breakMinutes: number;
}

interface DaySchedule {
  date: Date;
  dateString: string;
  slots: TimeSlot[];
}

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
  startDate: Date = new Date();
  endDate: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  slotsPerDay: number = 2;
  slotDurationMinutes: number = 180;
  draggedSubject: any;

  defaultBreakMinutes: number = 15;
  breakDurations: number[] = [];

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

  subjects: Subject[] = [
    { id: '1', name: 'Mathematics', color: '#3B82F6', teacher: '', hoursPerWeek: 0 },
    { id: '2', name: 'Physics', color: '#EF4444', teacher: '', hoursPerWeek: 0 },
    { id: '3', name: 'Chemistry', color: '#10B981', teacher: '', hoursPerWeek: 0 },
    { id: '4', name: 'Biology', color: '#8B5CF6', teacher: '', hoursPerWeek: 0 },
    { id: '5', name: 'Computer Science', color: '#F59E0B', teacher: '', hoursPerWeek: 0 },
    { id: '6', name: 'English Literature', color: '#EC4899', teacher: '', hoursPerWeek: 0 },
    { id: '7', name: 'History', color: '#6B7280', teacher: '', hoursPerWeek: 0 },
    { id: '8', name: 'Geography', color: '#14B8A6', teacher: '', hoursPerWeek: 0 }
  ];

  schedule: DaySchedule[] = [];
  isDragOver = false;
  dragOverDay = -1;
  dragOverSlot = -1;

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.endDate = new Date(this.startDate);
    this.endDate.setDate(this.startDate.getDate() + 2);
    this.initBreakDurations();
  }

  getTimeSlots(): string[] {
  const slots: string[] = [];

  let currentTime = new Date();
  currentTime.setHours(9, 0, 0, 0);

  for (let i = 0; i < this.slotsPerDay; i++) {
    const endTime = new Date(currentTime.getTime() + this.slotDurationMinutes * 60000);
    slots.push(`${this.formatTime(currentTime)} - ${this.formatTime(endTime)}`);
    currentTime = new Date(endTime.getTime() + (i < this.slotsPerDay - 1 ? this.breakDurations[i] * 60000 : 0));
  }

  return slots;
}

  initBreakDurations() {
    this.breakDurations = Array(this.slotsPerDay - 1).fill(this.defaultBreakMinutes);
  }

  onSlotsChange() {
    this.initBreakDurations();
  }

  generateTimeTable() {
    if (!this.startDate || !this.endDate) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please select both start and end dates' });
      return;
    }

    if (this.endDate < this.startDate) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'End date must be after start date' });
      return;
    }

    this.schedule = [];
    const currentDate = new Date(this.startDate);

    while (currentDate <= this.endDate) {
      const daySchedule: DaySchedule = {
        date: new Date(currentDate),
        dateString: this.formatDate(currentDate),
        slots: []
      };

      let currentTime = new Date(currentDate.setHours(9, 0, 0, 0));

      for (let i = 0; i < this.slotsPerDay; i++) {
        const endTime = new Date(currentTime.getTime() + this.slotDurationMinutes * 60000);
        const timeLabel = `${this.formatTime(currentTime)} - ${this.formatTime(endTime)}`;

        daySchedule.slots.push({
          id: `${currentDate.getTime()}-${i}`,
          time: timeLabel,
          breakMinutes: i < this.slotsPerDay - 1 ? this.breakDurations[i] : 0
        });

        currentTime = new Date(endTime.getTime() + (i < this.slotsPerDay - 1 ? this.breakDurations[i] * 60000 : 0));
      }

      this.schedule.push(daySchedule);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Time table generated successfully' });
  }

  formatTime(date: Date): string {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  }

  formatDate(date: Date): string {
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

  onDrop(event: any, dayIndex: number, slotIndex: number) {
    this.isDragOver = false;
    this.dragOverDay = -1;
    this.dragOverSlot = -1;
    if (this.draggedSubject) {
      this.schedule[dayIndex].slots[slotIndex].subject = this.draggedSubject;
      this.messageService.add({ severity: 'success', summary: 'Success', detail: `${this.draggedSubject.name} assigned to ${this.schedule[dayIndex].dateString}` });
    }
  }

  removeSubject(dayIndex: number, slotIndex: number) {
    const subject = this.schedule[dayIndex].slots[slotIndex].subject;
    this.schedule[dayIndex].slots[slotIndex].subject = undefined;
    if (subject) {
      this.messageService.add({ severity: 'info', summary: 'Removed', detail: `${subject.name} removed from schedule` });
    }
  }

  resetSchedule() {
    this.schedule.forEach(day => {
      day.slots.forEach(slot => {
        slot.subject = undefined;
      });
    });
    this.messageService.add({ severity: 'info', summary: 'Reset', detail: 'All subjects removed from schedule' });
  }

  saveTimeTable() {
    const hasAssignedSubjects = this.schedule.some(day => day.slots.some(slot => slot.subject));
    if (!hasAssignedSubjects) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please assign at least one subject before saving' });
      return;
    }
    console.log('Saving schedule:', this.schedule);
    this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Time table saved successfully' });
  }
}
