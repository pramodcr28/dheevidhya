

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';
export interface AttendanceRequest {
  id:string;
  academicYear: string;
  semester: string;
  departmentId: string;
  classId: string;
  sectionId: string;
  subjectCode: string;
  subjectName: string;
  period:number;
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
  StudentName:string;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  attendancePercentage: number;
}
