import { IDepartmentConfig } from "./org.model";

export interface TimeTableSettings {
  academicYear: string;
  semester: string;
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
  department: IDepartmentConfig;
  settings: TimeTableSettings;
  subjects: Subject[];
  schedule: { [day: string]: TimeSlot[] };
}


// ----------------------    export timetable     ---------------------------------


interface Period {
  startTime: string;
  endTime: string;
  type: string;
  name: string;
  subject: {
    id: string;
    name: string;
  };
  instructor: {
    id: string;
    name: string;
  };
}

interface Schedule {
  day: string; // or number, depends how you map it
  periods: Period[];
}

export interface ClassSection {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  schedules: Schedule[];
}

export interface DepartmentTimetable {
  id:string;
  status: string;
  departmentId: string;
  departmentName: string;
  isActive: boolean;
  classSections: ClassSection[];
  settings: TimeTableSettings
}