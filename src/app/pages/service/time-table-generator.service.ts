// import { ClassPeriod, DaySchedule, Period } from './../models/time-table';
// import { Injectable } from '@angular/core';
// import { IMasterDepartment, IMasterSection } from '../models/org.model';
// import { Timetable } from '../models/time-table';

// @Injectable({
//   providedIn: 'root'
// })
// export class TimeTableGeneratorService {

//   weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

//   periodsPerDay = 3;

//   TimeTables : Timetable[] = [];

//   constructor() { }

//   private currentDepartment: any | null = null;

//   generateTimeTable(department: IMasterDepartment): TimeTableGeneratorService {
//     this.currentDepartment = department;
//     return this;
//   }

//   async next(callback: (data: any | null, error?: string) => void) {
   
//     if (!this.currentDepartment) {
//       callback(null, "No department selected for generation");
//       return;
//     }

//       this.currentDepartment.classes.forEach(_class=>{

//        _class.sections.forEach(section=>{

//         let timeTable:Timetable = {};
//         this.mapSectionInfo(timeTable,section);
//           let schedules:DaySchedule[] = [];
//         this.weekdays.forEach(day=>{

//        this.appendSchedule(day, schedules,section);
      
//       })
//       timeTable.schedule = schedules;
//         console.log(section.subjects);

//       this.TimeTables.push(timeTable);
//     })

//     })
  
//     callback(this.TimeTables);
//   }

//   private appendSchedule(day:string,schedules:DaySchedule[],section:IMasterSection){
//       let schedule:DaySchedule = {}
//       let periods:Period[]=[];
      
//       for(let period =1; period <= this.periodsPerDay; period++){
//        let period:ClassPeriod = {};
//        period.startTime = "some time";
//        period.endTime = "some time";
//        period.type = 'class';
//        this.appendSubjectAndTeacher(period,section);
//        periods.push(period);
//       }
//       schedule.day = day;
//       schedule.periods  = periods;
//       schedules.push(schedule);
//   }

//   appendSubjectAndTeacher(period:ClassPeriod,section:IMasterSection){
//    period.teacher = "Teacher";
//   //  period.subject = ""
//   }


//  private mapSectionInfo(timeTable:Timetable,section:IMasterSection){
//     timeTable.section = section.id.toString();
    
//   }

  

// }
