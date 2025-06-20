import { IMasterSubject } from "./org.model";

export interface Timetable {
  _id?: string;
  academicYear?: string;
  semester?: string;
  department?: string;
  year?: number;
  section?: string;
  schedule?: DaySchedule[];
  createdAt?: string;
  updatedAt?: string; 
  isActive?: boolean;
}

export interface DaySchedule {
  day?: string;
  periods?: Period[];
}

export type Period = ClassPeriod | BreakPeriod;

export interface ClassPeriod {
  startTime?: string; 
  endTime?: string;  
  type?: 'class';
  subject?: IMasterSubject;
  teacher?:string;
}

export interface BreakPeriod {
  startTime?: string; 
  endTime?: string;  
  type?: 'break';
  name?: string;
}

