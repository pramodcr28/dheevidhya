export interface StaffAttendance {
    id?: string;
    staffId?: string;
    staffName?: string;
    departmentId: string;
    departmentName: string;
    branchId?: string;
    branchName?: string;
    attendanceDate?: string;
    checkInTime?: any | Date;
    checkOutTime?: any | Date;
    status?: AttendanceStatus | any;
    remarks?: string;
}

export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    LEAVE = 'LEAVE'
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
