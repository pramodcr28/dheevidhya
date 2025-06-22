import { Injectable } from '@angular/core';
import { GenericSelectItem, Subject, TimeTableSettings } from '../models/time-table';

@Injectable({
  providedIn: 'root'
})
export class GenericDataService {

   
  getAcademicYears(): GenericSelectItem[] {
    return [
      { label: '2023-2024', value: '2023-2024' },
      { label: '2024-2025', value: '2024-2025' },
      { label: '2025-2026', value: '2025-2026' }
    ];
  }

  getSemesters(): GenericSelectItem[] {
    return [
      { label: 'Fall Semester', value: 'fall' },
      { label: 'Spring Semester', value: 'spring' },
      { label: 'Summer Semester', value: 'summer' }
    ];
  }

  getDepartments(): GenericSelectItem[] {
    return [
      { label: 'Computer Science', value: 'cs' },
      { label: 'Information Technology', value: 'it' },
      { label: 'Electronics', value: 'ece' },
      { label: 'Mechanical', value: 'mech' },
      { label: 'Civil', value: 'civil' }
    ];
  }

  getClassSections(): GenericSelectItem[] {
    return [
      { label: 'CS101-A', value: 'cs101-a' },
      { label: 'CS101-B', value: 'cs101-b' },
      { label: 'CS102-A', value: 'cs102-a' },
      { label: 'CS102-B', value: 'cs102-b' }
    ];
  }

  getWorkingDays(): GenericSelectItem[] {
    return [
      { label: 'Monday', value: 'monday' },
      { label: 'Tuesday', value: 'tuesday' },
      { label: 'Wednesday', value: 'wednesday' },
      { label: 'Thursday', value: 'thursday' },
      { label: 'Friday', value: 'friday' },
      { label: 'Saturday', value: 'saturday' }
    ];
  }

  getSubjectColors(): string[] {
    return [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#F97316', // Orange
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#EC4899', // Pink
      '#6B7280'  // Gray
    ];
  }

  generateTimeSlots(startTime: string, endTime: string, periodDuration: number, breakDuration: number): any[] {
    const slots = [];
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    let current = start;
    let periodCount = 0;
    
    while (current < end) {
      const slotEnd = Math.min(current + periodDuration, end);
      
      slots.push({
        startTime: this.minutesToTime(current),
        endTime: this.minutesToTime(slotEnd),
        isBreak: false
      });
      
      current = slotEnd;
      periodCount++;
      
      // Add break after every 2 periods (if not at the end)
      if (periodCount % 2 === 0 && current < end) {
        const breakEnd = Math.min(current + breakDuration, end);
        slots.push({
          startTime: this.minutesToTime(current),
          endTime: this.minutesToTime(breakEnd),
          isBreak: true
        });
        current = breakEnd;
      }
    }
    
    return slots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  generateAdvancedTimeSlots(
    startTime: string, 
    endTime: string, 
    periodDuration: number, 
    breakDuration: number,
    lunchBreakAfterPeriod?: number,
    lunchDuration?: number
  ): any[] {
    const slots = [];
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    let current = start;
    let periodCount = 0;
    
    while (current < end) {
      const slotEnd = Math.min(current + periodDuration, end);
      
      slots.push({
        id: `period-${periodCount + 1}`,
        startTime: this.minutesToTime(current),
        endTime: this.minutesToTime(slotEnd),
        isBreak: false,
        periodNumber: periodCount + 1
      });
      
      current = slotEnd;
      periodCount++;
      
      // Add lunch break after specified period
      if (lunchBreakAfterPeriod && periodCount === lunchBreakAfterPeriod && current < end) {
        const lunchEnd = Math.min(current + (lunchDuration || 60), end);
        slots.push({
          id: `lunch-break`,
          startTime: this.minutesToTime(current),
          endTime: this.minutesToTime(lunchEnd),
          isBreak: true,
          isLunch: true
        });
        current = lunchEnd;
      }
      // Add regular break after every 2 periods
      else if (periodCount % 2 === 0 && current < end && (!lunchBreakAfterPeriod || periodCount !== lunchBreakAfterPeriod)) {
        const breakEnd = Math.min(current + breakDuration, end);
        slots.push({
          id: `break-${Math.floor(periodCount / 2)}`,
          startTime: this.minutesToTime(current),
          endTime: this.minutesToTime(breakEnd),
          isBreak: true,
          isLunch: false
        });
        current = breakEnd;
      }
    }
    
    return slots;
  }

  // Validate time table settings
  validateSettings(settings: TimeTableSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!settings.academicYear) errors.push('Academic year is required');
    if (!settings.semester) errors.push('Semester is required');
    if (!settings.department) errors.push('Department is required');
    if (!settings.classSection) errors.push('Class/Section is required');
    if (settings.workingDays.length === 0) errors.push('At least one working day is required');
    if (!settings.startTime) errors.push('Start time is required');
    if (!settings.endTime) errors.push('End time is required');
    if (settings.periodDuration < 30) errors.push('Period duration must be at least 30 minutes');
    if (settings.breakDuration < 5) errors.push('Break duration must be at least 5 minutes');
    
    const startMinutes = this.timeToMinutes(settings.startTime);
    const endMinutes = this.timeToMinutes(settings.endTime);
    if (startMinutes >= endMinutes) {
      errors.push('End time must be after start time');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate sample data for testing
  generateSampleData(): { subjects: Partial<Subject>[] } {
    return {
      subjects: [
        { name: 'Mathematics', teacher: 'Dr. Smith', hoursPerWeek: 5 },
        { name: 'Computer Science', teacher: 'Prof. Johnson', hoursPerWeek: 4 },
        { name: 'Physics', teacher: 'Dr. Brown', hoursPerWeek: 4 },
        { name: 'Chemistry', teacher: 'Prof. Davis', hoursPerWeek: 3 },
        { name: 'English', teacher: 'Ms. Wilson', hoursPerWeek: 3 },
        { name: 'History', teacher: 'Mr. Taylor', hoursPerWeek: 2 }
      ]
    };
  }
}
