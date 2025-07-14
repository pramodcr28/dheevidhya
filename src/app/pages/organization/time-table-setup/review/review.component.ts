import { CommonService } from './../../../../core/services/common.service';
import { Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeTableService } from '../../../service/time-table.service';
import { DialogModule } from 'primeng/dialog';
import { ClassSection, DepartmentTimetable } from '../../../models/time-table';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { TimetableViewComponent } from '../../../../shared/timetable-view/timetable-view.component';
import { Router } from '@angular/router';
@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule,DialogModule,ToastModule,MessageModule,TimetableViewComponent],
  providers: [MessageService],
  templateUrl: './review.component.html'
})
export class ReviewComponent {

 showTimetableDialog = false;
 timetableJson: DepartmentTimetable | null = null;
 messageService = inject(MessageService);
 commonService = inject(CommonService);
 timeTableService = inject(TimeTableService);
 router = inject(Router);
 generateTimetable() {
  const teachers = this.timeTableService.getTeachersList().map(t => ({
    id: t.id,
    name: t.name,
    preferred_periods: t.timeOn,
    avoided_periods:t.timeOff
  }));

  let classes: any[] = [];
  let classCounter = 1;

  this.commonService.associatedDepartments.subscribe(departments=>{
   const department =  departments.find(department=>department.id == this.timeTableService.timeTable.department.id);

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

  const exportData: any = {
    days: this.timeTableService.timeTable.settings.workingDays.filter(d => d.selected).length,
    periods_per_day: this.timeTableService.timeTable.settings.periodsPerDay,
    teachers,
    classes
  };

  this.showTimetableDialog = true ;
this.timeTableService.generateTimeTable(exportData).subscribe((response: any) => {
  const rawTimetable = response.timetable;

  const classSections: any[] = [];

  // rawTimetable keys are like: "classId-sectionId"
  for (const key of Object.keys(rawTimetable)) {
    const [classId, sectionId] = key.split('-');
    const classEntry = classes.find(cls => cls.id === key);

  let className = '';
  let sectionName = '';

  if (classEntry) {
    [className, sectionName] = classEntry.name.split('-');
  }
    const dayEntries = rawTimetable[key];

    const schedules: any[] = [];

    for (const dayIndex of Object.keys(dayEntries)) {
      const periods: any[] = [];

      const periodEntries = dayEntries[dayIndex]; 

      for (const periodIndex of Object.keys(periodEntries)) {
        const period = periodEntries[periodIndex];
        periods.push({
          startTime: '08:00', 
          endTime: '08:45',   
          type: period.subject_name === 'FREE' ? 'break' : 'lecture',
          name: period.subject_name,
          subject: {
            id: period.subject_id,
            name: period.subject_name
          },
          instructor: {
            id: period.teacher_id,
            name: period.teacher_name
          }
        });
      }

      schedules.push({
        day: dayIndex, 
        periods
      });
    }

    classSections.push({
      classId,
      className,
      sectionId,
      sectionName,
      schedules
    });
  }

  this.timetableJson = {
    id:null,
    status:"Draft",
    departmentId: this.timeTableService.timeTable.department.id,
    departmentName: this.timeTableService.timeTable.department.department.name,
    settings: {...this.timeTableService.timeTable.settings },
    classSections,
    isActive: true,
  };
  this.showTimetableDialog = true;
});
  })
}




saveTimetable() {
  this.timeTableService.create(this.timetableJson)
  .subscribe((result:any)=>{
      this.router.navigate(['/time-table-list']);
      this.messageService.add({ severity: 'success', summary: 'Success Message', detail: 'Congrats! Time Table Added' });
     });
}

cancel(){
  this.showTimetableDialog = false;
  this.timetableJson = null;
}

getSlotIndexes(classSec: ClassSection): number[] {
  const slots = classSec.schedules[0]?.periods.length || 0;
  return Array.from({ length: slots }, (_, i) => i);
}


  getWorkingDays() {
    return this.timeTableService.timeTable.
      settings.workingDays.filter((slot)=>slot.selected).
      map(slot=>slot.name).join(',');
  }
}