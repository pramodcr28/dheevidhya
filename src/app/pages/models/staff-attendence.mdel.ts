export interface StaffAttendance {
    id?: string;
    staffId?: string;
    staffName?: string;
    // departmentId: string;
    // departmentName: string;
    branchId?: string;
    branchName?: string;
    attendanceDate?: String;
    checkInTime?: string;
    checkOutTime?: string;
    status?: AttendanceStatus | any;
    remarks?: string;
}

export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    // HALF_DAY = 'HALF_DAY',
    LEAVE = 'LEAVE'
    // LATE = 'LATE',
    // ON_DUTY = 'ON_DUTY'
}

export interface AttendanceStatusOption {
    label: string;
    value: AttendanceStatus;
    severity: 'success' | 'warning' | 'danger' | 'info';
}

export interface StaffAttendanceReport {
    staffId: string;
    staffName: string;
    departmentName: string;
    branchName: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    leaveDays: number;
    attendancePercentage: number;
}

export interface Department {
    id: string;
    name: string;
}

export interface Branch {
    id: string;
    name: string;
}

export interface MonthStats {
    present: number;
    absent: number;
    late: number;
    leave: number;
}

export interface DayStats {
    present: number;
    absent: number;
    late: number;
    leave: number;
    total: number;
}

export interface AttendanceLog {
    staffId: string;
    staffName: string;
    departmentName: string;
    attendanceDate: Date;
    checkInTime: string;
    checkOutTime: string;
    status: string;
    remarks: string;
}
