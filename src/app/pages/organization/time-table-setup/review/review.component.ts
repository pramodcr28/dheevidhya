import { filter } from 'rxjs';
import { CommonService } from './../../../../core/services/common.service';
import { getAssociatedDepartments } from './../../../../core/store/user-profile/user-profile.selectors';
// review.component.ts
import { Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeTableService } from '../../../service/time-table.service';
import { DialogModule } from 'primeng/dialog';

export interface ExportTeacher {
  id: string;
  name: string;
  preferred_periods: [number, number][];
}

export interface ExportSubject {
  id: string;
  name: string;
  teacher_id: string;
  hours_per_week: number;
}

export interface ExportClass {
  id: string;
  name: string;
  subjects: ExportSubject[];
}

export interface ExportTimetableFormat {
  days: number;
  periods_per_day: number;
  teachers: ExportTeacher[];
  classes: ExportClass[];
}


@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule,DialogModule],
  templateUrl: './review.component.html'
})
export class ReviewComponent {

showTimetableDialog = false;
timetableJson: any = {};

get classIds() {
  return Object.keys(this.timetableJson.class_timetables || {});
}

getDayKeys(classId: string) {
  return Object.keys(this.timetableJson.class_timetables[classId] || {});
}

getSlotKeys(classId: string, day: string) {
  return Object.keys(this.timetableJson.class_timetables[classId][day] || {});
}

 commonService = inject(CommonService);
 timeTableService = inject(TimeTableService);

 generateTimetable() {
  const teachers = this.timeTableService.getTeachersList().map(t => ({
    id: t.id,
    name: t.name,
    preferred_periods: t.timeOn
  }));

  let classes: ExportClass[] = [];
  let classCounter = 1;

  this.commonService.associatedDepartments.subscribe(departments=>{
   const department =  departments.find(department=>department.id == this.timeTableService.timeTable.departmentId);

  department?.department.classes?.forEach(cls => {
    cls.sections.forEach((section:any) => {
      const subjects = section.subjects.map(sub => ({
        id: sub.id,
        name: sub.name,
        teacher_id: sub.teacher,
        hours_per_week: 5
      }));

      classes.push({
        id: cls.id + '-' + section.id,
        name: `${cls.name}-${section.name}`,
        subjects
      });

      classCounter++;
    });
  });

  const exportData: ExportTimetableFormat = {
    days: this.timeTableService.timeTable.settings.workingDays.filter(d => d.selected).length,
    periods_per_day: this.timeTableService.timeTable.settings.periodsPerDay,
    teachers,
    classes
  };

  this.showTimetableDialog = true ;
   this.timeTableService.generateTimeTable(exportData)
   .subscribe((response:any)=>{
    this.timetableJson = response.timetable;
    this.showTimetableDialog = true;
  })

  })
}



  getWorkingDays() {
    return this.timeTableService.timeTable.
      settings.workingDays.filter((slot)=>slot.selected).
      map(slot=>slot.name).join(',');
  }
}