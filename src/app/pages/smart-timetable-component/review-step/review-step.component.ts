import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TimeTable, TimeSlot } from '../../models/time-table';
import { TimeTableService } from '../../service/time-table.service';

@Component({
  selector: 'app-review-step',
  imports: [
      CommonModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule
  ],
  templateUrl: './review-step.component.html',
  styles: ``
})
export class ReviewStepComponent {
@Output() previous = new EventEmitter<void>();

  timeTable: TimeTable = {
    settings: {
      academicYear: '',
      semester: '',
      department: '',
      classSection: '',
      workingDays: [],
      startTime: '',
      endTime: '',
      periodDuration: 0,
      breakDuration: 0
    },
    subjects: [],
    schedule: {}
  };

  constructor(private timeTableService: TimeTableService) {}

  ngOnInit() {
    this.timeTableService.timeTable$.subscribe(timeTable => {
      this.timeTable = timeTable;
    });
  }

  generateSchedule() {
    this.timeTableService.generateSchedule();
  }

  hasSchedule(): boolean {
    return Object.keys(this.timeTable.schedule).length > 0;
  }

  getTimeSlots(): { startTime: string; endTime: string }[] {
    if (!this.hasSchedule()) return [];
    
    const firstDay = this.timeTable.settings.workingDays[0];
    return this.timeTable.schedule[firstDay]?.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime
    })) || [];
  }

  getDaySlot(day: string, slotIndex: number): TimeSlot | undefined {
    return this.timeTable.schedule[day]?.[slotIndex];
  }

  getSemesterLabel(semester: string): string {
    const semesters: { [key: string]: string } = {
      'fall': 'Fall Semester',
      'spring': 'Spring Semester',
      'summer': 'Summer Semester'
    };
    return semesters[semester] || semester;
  }

  getDepartmentLabel(department: string): string {
    const departments: { [key: string]: string } = {
      'cs': 'Computer Science',
      'it': 'Information Technology',
      'ece': 'Electronics',
      'mech': 'Mechanical',
      'civil': 'Civil'
    };
    return departments[department] || department;
  }

  getDayLabel(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }

  exportSchedule() {
    const dataStr = JSON.stringify(this.timeTable, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `timetable_${this.timeTable.settings.classSection}_${this.timeTable.settings.academicYear}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  printSchedule() {
    window.print();
  }

  onPrevious() {
    this.previous.emit();
  }
}
