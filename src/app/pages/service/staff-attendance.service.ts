// staff-attendance.service.ts  (updated — add these two methods)

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StaffAttendance, StaffAttendanceReport } from '../models/staff-attendence.mdel';

export interface SearchRequest {
    filters?: {
        [key: string]: any;
    };
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
}
export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
}
export interface StaffAttendanceAnalytics {
    departmentStats: DepartmentStat[];
    monthlyTrend: MonthlyTrend[];
    statusDistribution: StatusDistribution;
    topPerformers: TopPerformer[];
}

export interface DepartmentStat {
    departmentName: string;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    leaveDays: number;
    halfDays: number;
    attendancePercentage: number;
}

export interface MonthlyTrend {
    month: string;
    attendancePercentage: number;
    totalRecords: number;
    presentCount: number;
}

export interface StatusDistribution {
    present: number;
    absent: number;
    late: number;
    leave: number;
    halfDay: number;
    onDuty: number;
}

export interface TopPerformer {
    staffId: string;
    staffName: string;
    departmentName: string;
    attendancePercentage: number;
    presentDays: number;
    totalDays: number;
}

export interface AnalyticsRequest {
    branchIds?: string[];
    departmentIds?: string[];
    startDate?: string;
    endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class StaffAttendanceService {
    private apiUrl = environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/staffattendance';

    constructor(private http: HttpClient) {}

    addAttendance(attendance: StaffAttendance): Observable<StaffAttendance> {
        return this.http.post<StaffAttendance>(this.apiUrl, attendance);
    }

    getAttendance(id: string): Observable<StaffAttendance> {
        return this.http.get<StaffAttendance>(`${this.apiUrl}/${id}`);
    }

    deleteAttendance(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    searchAttendance(request: SearchRequest): Observable<PageResponse<StaffAttendance>> {
        return this.http.post<PageResponse<StaffAttendance>>(`${this.apiUrl}/search`, request);
    }

    // ── NEW: fetch all analytics data in one call ──────────────
    getAnalytics(request: AnalyticsRequest): Observable<StaffAttendanceAnalytics> {
        return this.http.post<StaffAttendanceAnalytics>(`${this.apiUrl}/analytics`, request);
    }

    // ── NEW: fetch paginated staff summary report ──────────────
    generateReport(request: SearchRequest): Observable<PageResponse<StaffAttendanceReport>> {
        return this.http.post<PageResponse<StaffAttendanceReport>>(`${this.apiUrl}/report`, request);
    }
}
