import { DepartmentTimetable } from './../models/time-table';
import { inject, Injectable } from '@angular/core';
import { Subject, Teacher, TimeTable} from '../models/time-table';
import { IMasterSubject } from '../models/org.model';
import { Store } from '@ngrx/store';
import { UserProfileState } from '../../core/store/user-profile/user-profile.reducer';
import { getSubjectsByFilters } from '../../core/store/user-profile/user-profile.selectors';
import { EntityResponseType, UserService } from './user.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { NewProfileConfig, IProfileConfig } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class TimeTableService {
 public timeTable : TimeTable = {
    departmentId:null,
    settings: {
      academicYear: '2023-2024',
      semester: 'fall',
      department: 'cs',
      classSection: 'cs101-a',
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

  http = inject(HttpClient);
  timeTableUrl = "http://127.0.0.1:8000/generate-timetable";
  availableColors = this.shuffleColors([
      '#3b82f6',
      '#ef4444', 
      '#10b981', 
      '#f59e0b', 
      '#8b5cf6', 
      '#ec4899', 
      '#14b8a6',
      '#84cc16', 
      '#6366f1', 
      '#f43f5e' 
    ]);
  readonly days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  readonly periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6','Period 7','Period 8','Period 9'];

  private store = inject(Store<{ userProfile: UserProfileState }>);
  studentService = inject(UserService);

    protected readonly applicationConfigService = inject(ApplicationConfigService);
  
    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ADMIN_BASE_URL +'api/timetables');
  
    create(timeTable: DepartmentTimetable) {
      return this.http.post<DepartmentTimetable>(this.resourceUrl, timeTable);
    }

    fetchTimeTables(){
      return this.http.get(this.resourceUrl)
    }
  
  onDepartmentChange() {
  this.store.select(getSubjectsByFilters([this.timeTable.departmentId])).subscribe(subjects => {
       this.studentService.search(0, 100, 'id', 'ASC', 
    { 'profileType.equals': "STAFF", 
      'departments.in':[this.timeTable.departmentId],
      'user_id.in':[...subjects.map((sub:any)=>sub.teacher)] })
        .subscribe((res: any) => {
              let teachers = res.content.map(profile=>{
                let teacher:Teacher = { name: profile.username, id: profile.userId, timeOff: [], timeOn: [] };
                return teacher;
              });

               this.timeTable.subjects = subjects.map((sub: IMasterSubject, index: number) => {
        const subject:Subject = { id: sub.id, name: sub.name, teacher: teachers.find(teacher=>teacher.id == sub.teacher), hoursPerWeek: 4, color: this.availableColors[index % this.availableColors.length] };
        return subject;
      });
      });
     
    });
  }

  getTeachersList(){
    return this.timeTable.subjects.map(sub=>sub.teacher);
  }

togglePeriodAvailability(teacherId: string, dayIndex: number, periodIndex: number) {
  const teacher = this.timeTable.subjects.find(sub => sub.teacher.id === teacherId).teacher;
  
  if (!teacher) return;
  const key: [number, number] = [dayIndex, periodIndex];
  const keyStr = key.toString();

  const existingIndex = teacher.timeOn.findIndex(t => t.toString() === keyStr);

  if (existingIndex !== -1) {
    // Already available → remove (mark unavailable)
    teacher.timeOn.splice(existingIndex, 1);
  } else {
    // Add to availability
    teacher.timeOn.push(key);
  }
}

isAvailable(teacher: Teacher, dayIndex: number, periodIndex: number): boolean {
  return teacher.timeOn.some(t => t[0] === dayIndex && t[1] === periodIndex);
}



shuffleColors(colors: string[]): string[] {
  const array = [...colors];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

generateTimeTable(request){
  return this.http.post(this.timeTableUrl,request);
}
}
