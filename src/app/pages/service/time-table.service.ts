import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Teacher, TimeTable } from '../models/time-table';
import { Store } from '@ngrx/store';
import { UserProfileState } from '../../core/store/user-profile/user-profile.reducer';
import { getSubjectsByFilters } from '../../core/store/user-profile/user-profile.selectors';
import { UserService } from './user.service';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimeTableService {
  private http = inject(HttpClient);
  private store = inject(Store<{ userProfile: UserProfileState }>);
  private userService = inject(UserService);
  private applicationConfigService = inject(ApplicationConfigService);
  public teachers: Teacher[] = [];
  public timeTable: TimeTable = {
    department: null,
    settings: {
      academicYear: null,
      semester: 'fall',
      workingDays: [
        { name: 'Sun', selected: false },
        { name: 'Mon', selected: true },
        { name: 'Tue', selected: true },
        { name: 'Wed', selected: true },
        { name: 'Thu', selected: true },
        { name: 'Fri', selected: true },
        { name: 'Sat', selected: false }
      ],
      startTime: '08:00',
      endTime: '16:00',
      periodDuration: 45,
      breakDuration: 10,
      periodsPerDay: 7
    },  
    subjects: [],
    schedule: {}
  };

  private availableColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#84cc16', '#6366f1', '#f43f5e'
  ];

  readonly periods = [
    'Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5',
    'Period 6', 'Period 7', 'Period 8', 'Period 9'
  ];

  private resourceUrl = this.applicationConfigService.getEndpointFor(
    environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/timetables'
  );

  // API Methods
  create(timeTable: any) {
    return this.http.post(this.resourceUrl, timeTable);
  }

  fetchTimeTables() {
    return this.http.get(this.resourceUrl);
  }

  deleteTimeTable(id: string) {
  return this.http.delete(`${this.resourceUrl}/${id}`);
  }

  generateTimeTable(request: any) {
    if(environment.stage != 'dev')
      return this.http.post('https://dheevidhya.in/v3ai/generate-timetable', request);
    else
      return this.http.post('http://localhost:8084/generate-timetable', request);
  }

  // Teacher Methods
  getTeachersList(): Teacher[] {
    return this.teachers;
  }

  onDepartmentChange() {
    this.timeTable.settings.academicYear = this.timeTable.department.academicYear;
    this.store.select(getSubjectsByFilters([this.timeTable.department.id])).subscribe(subjects => {
      this.userService.search(0, 100, 'id', 'ASC', {
        'profileType.equals': "STAFF",
        'departments.in': [this.timeTable.department.id],
        'subject_ids.in': [...subjects.map((sub: any) => sub.id)]
      }).subscribe((res: any) => {
        this.teachers = res.content.map((profile: any) => ({
          name: profile.fullName,
          id: profile.userId,
          timeOff: [],
          timeOn: []
        }));
// teachers.find((teacher: Teacher) => teacher.id === sub.teacher)
        this.timeTable.subjects = subjects.map((sub: any, index: number) => ({
          id: sub.id,
          name: sub.name,
          teacher: null,
          hoursPerWeek: 4,
          color: this.availableColors[index % this.availableColors.length]
        }));
      });
    });
  }

  // Availability Methods
  togglePeriodAvailability(teacherId: string, dayIndex: number, periodIndex: number) {
    const teacher = this.teachers.find(teacher => teacher.id === teacherId);
    if (!teacher) return;

    const key: [number, number] = [dayIndex, periodIndex];
    const keyStr = key.toString();

    const onIndex = teacher.timeOn.findIndex(t => t.toString() === keyStr);
    const offIndex = teacher.timeOff.findIndex(t => t.toString() === keyStr);

    if (onIndex !== -1) {
      // Available → Unavailable
      teacher.timeOn.splice(onIndex, 1);
      teacher.timeOff.push(key);
    } else if (offIndex !== -1) {
      // Unavailable → Neutral
      teacher.timeOff.splice(offIndex, 1);
    } else {
      teacher.timeOn.push(key);
    }
  }

  getPeriodStatus(teacher: Teacher, dayIndex: number, periodIndex: number): 'available' | 'unavailable' | 'neutral' {
    const isAvailable = teacher.timeOn.some(t => t[0] === dayIndex && t[1] === periodIndex);
    const isUnavailable = teacher.timeOff.some(t => t[0] === dayIndex && t[1] === periodIndex);

    if (isAvailable) return 'available';
    if (isUnavailable) return 'unavailable';
    return 'neutral';
  }

  getAvailabilitySummary(teacher: Teacher) {
    const workingDays = this.timeTable.settings.workingDays.filter(d => d.selected);
    const totalSlots = workingDays.length * this.timeTable.settings.periodsPerDay;

    return {
      available: teacher?.timeOn.length,
      unavailable: teacher?.timeOff.length,
      neutral: totalSlots - teacher?.timeOn.length - teacher?.timeOff.length
    };
  }


  resetTimeTable(){
    this.timeTable = {
    department: null,
    settings: {
      academicYear: null,
      semester: 'fall',
      workingDays: [
        { name: 'Sun', selected: false },
        { name: 'Mon', selected: true },
        { name: 'Tue', selected: true },
        { name: 'Wed', selected: true },
        { name: 'Thu', selected: true },
        { name: 'Fri', selected: true },
        { name: 'Sat', selected: false }
      ],
      startTime: '08:00',
      endTime: '16:00',
      periodDuration: 45,
      breakDuration: 10,
      periodsPerDay: 7
    },  
    subjects: [],
    schedule: {}
  };
  }
}