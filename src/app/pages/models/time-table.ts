import { IMasterSubject } from "./org.model";

// export interface Timetable {
//   _id?: string;
//   academicYear?: string;
//   semester?: string;
//   department?: string;
//   year?: number;
//   section?: string;
//   schedule?: DaySchedule[];
//   createdAt?: string;
//   updatedAt?: string; 
//   isActive?: boolean;
// }

// export interface DaySchedule {
//   day?: string;
//   periods?: Period[];
// }

// export type Period = ClassPeriod | BreakPeriod;

// export interface ClassPeriod {
//   startTime?: string; 
//   endTime?: string;  
//   type?: 'class';
//   subject?: IMasterSubject;
//   teacher?:string;
// }

// export interface BreakPeriod {
//   startTime?: string; 
//   endTime?: string;  
//   type?: 'break';
//   name?: string;
// }

// ------------------------------------


export interface TimeTableSettings {
  academicYear: string;
  semester: string;
  department: string;
  classSection: string;
  workingDays: any[];
  startTime: string;
  endTime: string;
  periodDuration: number;
  breakDuration: number;
  periodsPerDay: number;
}

export interface Teacher {
  name: string;
  id: string;
  timeOff: [number, number][];
  timeOn: [number, number][];
}

export interface Subject {
  id: string;
  name: string;
  teacher: Teacher;
  hoursPerWeek: number;
  color: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  subject?: Subject;
  day: string;
}

export interface TimeTable {
  settings: TimeTableSettings;
  subjects: Subject[];
  schedule: { [day: string]: TimeSlot[] };
}

export interface GenericSelectItem {
  label: string;
  value: any;
}