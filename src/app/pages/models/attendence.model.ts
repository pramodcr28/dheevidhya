import { UserStatus } from './user.model';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';
export interface AttendanceRequest {
    id: string;
    academicYear: string;
    semester: string;
    departmentId: string;
    classId: string;
    sectionId: string;
    subjectCode: string;
    subjectName: string;
    period: number;
    instructorName: string;
    instructorId: string;
    sessionDate: string;
    scheduleDay: string;
    startTime: string;
    endTime: string;
    exceptions?: AttendanceException[];
}

export interface AttendanceException {
    studentId: String;
    studentName: string;
    status: AttendanceStatus;
    remarks?: string;
    _studentStatus?: UserStatus | any;
}

export interface LowAttendanceStudent {
    id: string;
    name: string;
    studentId: string;
    attendanceRate: number;
}

export interface AttendanceStats {
    averageRate: number;
    rateChange: number;
    totalClasses: number;
    studentsAtRisk: number;
}

export interface AttendanceReport {
    studentId: string;
    StudentName: string;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    attendancePercentage: number;
}

export interface SubjectAttendanceSummary {
    subjectCode: string;
    subjectName: string;
    totalSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalExcused: number;
    attendancePercentage: number;
    attendanceStatus: 'GOOD' | 'WARNING' | 'CRITICAL';
}

export interface StudentAttendanceReportResponse {
    studentId: string;
    studentName: string;
    rollNumber: string;
    academicYear: string;
    totalSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalExcused: number;
    overallAttendancePercentage: number;
    subjects: SubjectAttendanceSummary[];
}
