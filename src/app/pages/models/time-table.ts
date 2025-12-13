import { IDepartmentConfig } from './org.model';

export interface TimeTable {
    department: IDepartmentConfig;
    settings: TimeTableSettings;
    // subjects: Subject[];
    schedule: { [day: string]: TimeSlot[] };
}

// ----------------------    export timetable     ---------------------------------

export interface Period {
    id?: string;
    name: string;
    type: 'lecture' | 'break' | 'free';
    startTime: string;
    endTime: string;
    subject: {
        id: string;
        name: string;
    };
    instructor?: {
        id: string;
        name: string;
    };
    // Direct properties - no helper methods needed
    cssClasses?: string;
    tooltip?: string;
    canDrop?: boolean;
    duration?: number; // Duration in minutes (optional, can be calculated)
}

interface Schedule {
    day: string; // or number, depends how you map it
    dayName: string;
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
    id?: string;
    status?: string;
    departmentId?: string;
    departmentName?: string;
    classSections?: ClassSection[];
    settings?: TimeTableSettings;
}

export interface TimeTableSettings {
    academicYear: string;
    semester: string;
    workingDays: any[];
    startTime: string;
    endTime: string;
    periodDuration: number;
    breakDuration: number;
    periodsPerDay: number;
    breaks?: BreakConfig[];
}

export interface BreakConfig {
    id: string;
    name: string;
    afterPeriod: number; // Insert break after this period number (1-indexed)
    duration: number; // Duration in minutes
    enabled: boolean;
}

// Example default breaks
export const DEFAULT_BREAKS: BreakConfig[] = [
    {
        id: 'tea_break',
        name: 'Tea Break',
        afterPeriod: 2,
        duration: 15,
        enabled: false
    },
    {
        id: 'lunch_break',
        name: 'Lunch Break',
        afterPeriod: 4,
        duration: 30,
        enabled: false
    }
];

export interface Teacher {
    unavailable_periods: any;
    name: string;
    id: string;
    timeOff: [number, number][];
    timeOn: [number, number][];
}

export interface Subject {
    id: string;
    name: string;
    teacher: Teacher;
    periodsPerWeek: number;
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
