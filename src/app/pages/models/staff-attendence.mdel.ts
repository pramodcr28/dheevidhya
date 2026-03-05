export interface StaffAttendance {
    id?: string;
    staffId?: string;
    staffName?: string;
    departmentId: string;
    departmentName: string;
    branchId?: string;
    branchName?: string;
    attendanceDate?: string;
    checkInTime?: string;
    checkOutTime?: string;
    status?: AttendanceStatus | any;
    remarks?: string;
}

export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    LEAVE = 'LEAVE',
    ON_DUTY = 'ON_DUTY'
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
