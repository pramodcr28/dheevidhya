import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeTableService } from '../../../service/time-table.service';
import { Teacher } from '../../../models/time-table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule],
  templateUrl: './teachers.component.html'
})
export class TeachersComponent {
  timeTableService = inject(TimeTableService);
  selectedTeacher: Teacher | null = null;
  showDialog = false;

  getTeachers() {
    return this.timeTableService.getTeachersList();
  }

  getWorkingDays() {
    return this.timeTableService.timeTable.settings.workingDays.filter(day => day.selected);
  }

  getPeriods() {
    return this.timeTableService.periods.slice(0, this.timeTableService.timeTable.settings.periodsPerDay);
  }

  openDialog(teacher: Teacher) {
    this.selectedTeacher = teacher;
    this.showDialog = true;
  }

  toggleAvailability(dayIndex: number, periodIndex: number) {
    if (!this.selectedTeacher) return;
    this.timeTableService.togglePeriodAvailability(this.selectedTeacher.id, dayIndex, periodIndex);
  }

  setBulkStatus(status: 'available' | 'unavailable' | 'neutral') {
    if (!this.selectedTeacher) return;
    
    const workingDays = this.getWorkingDays();
    const periodsPerDay = this.timeTableService.timeTable.settings.periodsPerDay;
    
    // Clear existing
    this.selectedTeacher.timeOn = [];
    this.selectedTeacher.timeOff = [];
    
    // Set new status for all periods
    for (let dayIndex = 0; dayIndex < workingDays.length; dayIndex++) {
      for (let periodIndex = 0; periodIndex < periodsPerDay; periodIndex++) {
        const key: [number, number] = [dayIndex, periodIndex];
        
        if (status === 'available') {
          this.selectedTeacher.timeOn.push(key);
        } else if (status === 'unavailable') {
          this.selectedTeacher.timeOff.push(key);
        }
      }
    }
  }

  getCellClass(dayIndex: number, periodIndex: number): string {
    if (!this.selectedTeacher) return '';
    
    const status = this.timeTableService.getPeriodStatus(this.selectedTeacher, dayIndex, periodIndex);
    const base = 'transition-colors duration-200';
    
    switch (status) {
      case 'available':
        return `${base} bg-green-100 hover:bg-green-200 border-l-4 border-green-500`;
      case 'unavailable':
        return `${base} bg-red-100 hover:bg-red-200 border-l-4 border-red-500`;
      default:
        return `${base} bg-gray-100 hover:bg-gray-200 border-l-4 border-gray-300`;
    }
  }

 getIndicatorClass(dayIndex: number, periodIndex: number): string {
  if (!this.selectedTeacher) return '';
  
  const status = this.timeTableService.getPeriodStatus(this.selectedTeacher, dayIndex, periodIndex);
  
  switch (status) {
    case 'available':
      return 'bg-green-500';
    case 'unavailable':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

// Get PrimeNG icon class based on status
getIconClass(dayIndex: number, periodIndex: number): string {
  if (!this.selectedTeacher) return 'pi pi-circle';
  
  const status = this.timeTableService.getPeriodStatus(this.selectedTeacher, dayIndex, periodIndex);
  
  switch (status) {
    case 'available':
      return 'pi pi-check';
    case 'unavailable':
      return 'pi pi-times';
    default:
      return '';
  }
}

  getSummary(teacher: Teacher) {
    return this.timeTableService.getAvailabilitySummary(teacher);
  }

  saveChanges() {
    // Implement save logic here
    console.log('Saving changes for:', this.selectedTeacher?.name);
    this.showDialog = false;
  }
}