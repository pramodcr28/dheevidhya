import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DragDropModule } from 'primeng/dragdrop';
import { InputNumberModule } from 'primeng/inputnumber';
import { Subject } from '../../models/time-table';
import { SliderModule } from 'primeng/slider';
import { KnobModule } from 'primeng/knob';
import { ExaminationTimeSlot, ExaminationTimeTable } from '../../models/examination.model';
import { CommonService } from '../../../core/services/common.service';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-exam-slots',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePickerModule,
    SelectModule,
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
  validationErrors: string[] = [];

  slotOptions = [
    { label: '1 Slot', value: 1 },
    { label: '2 Slots', value: 2 },
    { label: '3 Slots', value: 3 },
    { label: '4 Slots', value: 4 },
    { label: '5 Slots', value: 5 },
    { label: '6 Slots', value: 6 }
  ];

  durationOptions = [
    { label: '30 Minutes', value: 30 },
    { label: '1 Hour', value: 60 },
    { label: '1.5 Hours', value: 90 },
    { label: '2 Hours', value: 120 },
    { label: '2.5 Hours', value: 150 },
    { label: '3 Hours', value: 180 },
    { label: '3.5 Hours', value: 210 },
    { label: '4 Hours', value: 240 }
  ];

  @Input()
  timeTable: ExaminationTimeTable;

  @Input() subjects: Subject[];

  constructor(private messageService: MessageService) {}
  commonService = inject(CommonService);

  ngOnInit() {
    // Initialize default times if not set
    if (!this.timeTable.settings.dayStartTime) {
      this.timeTable.settings.dayStartTime = new Date();
      this.timeTable.settings.dayStartTime.setHours(9, 0, 0, 0);
    }
    
    if (!this.timeTable.settings.dayEndTime) {
      this.timeTable.settings.dayEndTime = new Date();
      this.timeTable.settings.dayEndTime.setHours(17, 0, 0, 0);
    }
    
    this.validateForm();
  }

  ngOnChanges() {
    this.validateForm();
  }

  validateForm(): void {
    this.validationErrors = [];
    if (!this.timeTable.settings.startDate) {
      this.validationErrors.push('Start date is required');
    }
    if (!this.timeTable.settings.endDate) {
      this.validationErrors.push('End date is required');
    }
    if (this.timeTable.settings.startDate && this.timeTable.settings.endDate) {
      if (this.timeTable.settings.startDate > this.timeTable.settings.endDate) {
        this.validationErrors.push('End date must be after start date');
      }
    }

    // Time validations
    if (!this.timeTable.settings.dayStartTime) {
      this.validationErrors.push('Day start time is required');
    }
    if (!this.timeTable.settings.dayEndTime) {
      this.validationErrors.push('Day end time is required');
    }
    if (this.timeTable.settings.dayStartTime && this.timeTable.settings.dayEndTime) {
      if (this.timeTable.settings.dayStartTime >= this.timeTable.settings.dayEndTime) {
        this.validationErrors.push('Day end time must be after start time');
      }
    }

    // Slot validations
    if (!this.timeTable.settings.slotsPerDay || this.timeTable.settings.slotsPerDay < 1 ) {
      this.validationErrors.push('At least 1 slot per day is required');
    }
    if (!this.timeTable.settings.slotDuration || this.timeTable.settings.slotDuration < 30) {
      this.validationErrors.push('Slot duration must be at least 30 minutes');
    }

    // Check if slots fit within day
    if (this.timeTable.settings.dayStartTime && this.timeTable.settings.dayEndTime && 
        this.timeTable.settings.slotsPerDay && this.timeTable.settings.slotDuration) {   
      const dayDurationMinutes = this.getDayDurationInMinutes();
      const totalSlotDuration = this.timeTable.settings.slotsPerDay * this.timeTable.settings.slotDuration;
      const totalBreakDuration = (this.timeTable.settings.slotsPerDay - (this.timeTable.settings.slotsPerDay <=1 ? this.timeTable.settings.slotsPerDay:1) ) * this.timeTable.settings.breakDuration;
      const requiredTime = totalSlotDuration + totalBreakDuration;

      let dayDifference = this.timeTable.settings.dayEndTime.getDate() - this.timeTable.settings.startDate.getDate();
      if (requiredTime > dayDurationMinutes * (dayDifference >0 ? dayDifference:1)) {
        this.validationErrors.push(`Total time required (${requiredTime} min) exceeds available day time (${dayDurationMinutes} min)`);
      }
    }

    // Subject validations
    if (!this.subjects || this.subjects.length === 0) {
      this.validationErrors.push('At least one subject is required');
    }

    const startDate = new Date(this.timeTable.settings.startDate);
    const endDate = new Date(this.timeTable.settings.endDate);
//   from date and end logic needs to change
    if (this.subjects?.length && startDate && endDate && this.timeTable.settings.slotsPerDay) {
      const totalDays = Math.floor((endDate.getDate() - startDate.getDate()));
      const totalAvailableSlots = (1+ totalDays )* this.timeTable.settings.slotsPerDay;

      if (totalAvailableSlots < this.subjects.length) {
        this.validationErrors.push(
          `Insufficient time slots: ${totalAvailableSlots} available, but ${this.subjects.length} subjects selected.`
        );
      }
    }
  }

  getDayDurationInMinutes(): number {
    if (!this.timeTable.settings.dayStartTime || !this.timeTable.settings.dayEndTime) {
      return 0;
    }
    const start = new Date(this.timeTable.settings.dayStartTime);
    const end = new Date(this.timeTable.settings.dayEndTime);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }

  getTimeSlots(): string[] {
    const slots: string[] = [];
    
    if (!this.timeTable.settings.dayStartTime) {
      return slots;
    }

    let currentTime = new Date(this.timeTable.settings.dayStartTime);

    for (let i = 0; i < this.timeTable.settings.slotsPerDay; i++) {
      const endTime = new Date(currentTime.getTime() + this.timeTable.settings.slotDuration * 60000);
      slots.push(`${this.formatTime(currentTime)} - ${this.formatTime(endTime)}`);
      
      // Add break time for next slot (except for last slot)
      if (i < this.timeTable.settings.slotsPerDay - 1) {
        currentTime = new Date(endTime.getTime() + this.timeTable.settings.breakDuration * 60000);
      }
    }

    return slots;
  }

  generateTimeTable() {
    // Validate before generating
    this.validateForm();
    if (this.validationErrors.length > 0) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Validation Error', 
        detail: 'Please fix validation errors before generating timetable' 
      });
      return;
    }

    this.timeTable.schedules.splice(0, this.timeTable.schedules.length); // Clear in-place

    let currentDate = new Date(this.timeTable.settings.startDate);
    while (currentDate.getDate() <= new Date(this.timeTable.settings.endDate).getDate()) {
      // Skip weekends if needed (optional)
      // if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      //   currentDate.setDate(currentDate.getDate() + 1);
      //   continue;
      // }

      let slotStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        this.timeTable.settings.dayStartTime.getHours(),
        this.timeTable.settings.dayStartTime.getMinutes(),
        0, 0
      );
      for (let i = 0; i < this.timeTable.settings.slotsPerDay; i++) {
        const slotEnd = new Date(slotStart.getTime() + this.timeTable.settings.slotDuration * 60000);
         let slot = {
          startTime: formatDate(slotStart, this.commonService.dateTimeFormate, 'en-US'),
          endTime: formatDate(slotEnd, this.commonService.dateTimeFormate, 'en-US'),
          day: formatDate(slotStart, this.commonService.dateFormate, 'en-US'),
          breakDuration: this.timeTable.settings.breakDuration,
          subjectName: '',
          color: ''
        };
        this.timeTable.schedules.push(slot);
        // Add break time for next slot (except for last slot)
        if (i < this.timeTable.settings.slotsPerDay - 1) {
          slotStart = new Date(slotEnd.getTime() + this.timeTable.settings.breakDuration * 60000);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.messageService.add({ 
      severity: 'success', 
      summary: 'Success', 
      detail: `Timetable generated with ${this.timeTable.schedules.length} slots` 
    });
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
    this.draggedSubject = null;
  }
  onDrop(event: any, targetSlot: ExaminationTimeSlot) {
  this.isDragOver = false;

  if (!this.draggedSubject) return;

  // 1. Check if the target slot already has a subject
  if (targetSlot.subjectName) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Slot Occupied',
      detail: `This slot is already assigned to ${targetSlot.subjectName}. Please remove it first.`
    });
    return;
  }

  // 2. Remove subject from any previously assigned slot
  for (const slot of this.timeTable.schedules) {
    if (slot.subjectName === this.draggedSubject.name) {
      slot.subjectName = null;
      slot.color = null;
      break; // Only one slot per subject
    }
  }

  // 3. Assign the subject to the new slot
  targetSlot.subjectName = this.draggedSubject.name;
  targetSlot.color = this.draggedSubject.color;

  // 4. Notify user
  this.messageService.add({ 
    severity: 'success', 
    summary: 'Assigned', 
    detail: `${this.draggedSubject.name} assigned to ${targetSlot.day}` 
  });
}
  removeSubject(slot: ExaminationTimeSlot) {
    const removed = slot.subjectName;
    slot.subjectName = undefined;
    if (removed) {
      this.messageService.add({ 
        severity: 'info', 
        summary: 'Removed', 
        detail: `${removed} removed` 
      });
    }
  }
}