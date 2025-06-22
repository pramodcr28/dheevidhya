

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';
export interface AttendanceRequest {
  academicYear: string;
  semester: string;
  departmentId: string;
  className: string;
  section: string;
  subjectCode: string;
  subjectName: string;
  instructorName: string;
  instructorId: string;
  sessionDate: string;
  scheduleDay: string;
  startTime: string;
  endTime: string;
  exceptions?: AttendanceException[];
}



// export interface Student {
//   id: string;
//   name: string;
//   initials: string;
//   status: 'Present' | 'Absent' | 'Late';
// }
export interface AttendanceException {
  id?: number;
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
