import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TimeTable, TimeTableSettings, TimeSlot, Subject } from '../models/time-table';
import { GenericDataService } from './generic-data.service';

@Injectable({
  providedIn: 'root'
})
export class TimeTableService {
private timeTableSubject = new BehaviorSubject<TimeTable>({
    settings: {
      academicYear: '2023-2024',
      semester: 'fall',
      department: 'cs',
      classSection: 'cs101-a',
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: '08:00',
      endTime: '16:00',
      periodDuration: 60,
      breakDuration: 10
    },
    subjects: [],
    schedule: {}
  });

  constructor(private genericDataService: GenericDataService) {}

  get timeTable$(): Observable<TimeTable> {
    return this.timeTableSubject.asObservable();
  }

  get currentTimeTable(): TimeTable {
    return this.timeTableSubject.value;
  }

  updateSettings(settings: TimeTableSettings): void {
    const current = this.currentTimeTable;
    this.timeTableSubject.next({
      ...current,
      settings
    });
  }

  addSubject(subject: Subject): void {
    const current = this.currentTimeTable;
    const colors = this.genericDataService.getSubjectColors();
    const colorIndex = current.subjects.length % colors.length;
    
    const newSubject = {
      ...subject,
      id: this.generateId(),
      color: colors[colorIndex]
    };

    this.timeTableSubject.next({
      ...current,
      subjects: [...current.subjects, newSubject]
    });
  }

  updateSubject(subjectId: string, updates: Partial<Subject>): void {
    const current = this.currentTimeTable;
    const subjects = current.subjects.map(subject => 
      subject.id === subjectId ? { ...subject, ...updates } : subject
    );

    this.timeTableSubject.next({
      ...current,
      subjects
    });
  }

  removeSubject(subjectId: string): void {
    const current = this.currentTimeTable;
    const subjects = current.subjects.filter(subject => subject.id !== subjectId);

    this.timeTableSubject.next({
      ...current,
      subjects
    });
  }

  generateSchedule(): void {
    const current = this.currentTimeTable;
    const { settings, subjects } = current;
    
    const timeSlots = this.genericDataService.generateTimeSlots(
      settings.startTime,
      settings.endTime,
      settings.periodDuration,
      settings.breakDuration
    );

    const schedule: { [day: string]: TimeSlot[] } = {};
    
    settings.workingDays.forEach(day => {
      schedule[day] = timeSlots.map((slot, index) => ({
        id: `${day}-${index}`,
        day,
        ...slot,
        subject: slot.isBreak ? undefined : this.assignSubject(subjects, day, index)
      }));
    });

    this.timeTableSubject.next({
      ...current,
      schedule
    });
  }

  private assignSubject(subjects: Subject[], day: string, slotIndex: number): Subject | undefined {
    if (subjects.length === 0) return undefined;
    
    // Simple round-robin assignment
    const subjectIndex = slotIndex % subjects.length;
    return subjects[subjectIndex];
  }

  saveTimeTable(): void {
    const current = this.currentTimeTable;
    localStorage.setItem('timeTable', JSON.stringify(current));
  }

  loadTimeTable(): void {
    const saved = localStorage.getItem('timeTable');
    if (saved) {
      this.timeTableSubject.next(JSON.parse(saved));
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
