import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    currentPage: number;
    size: number;
}
@Injectable({
    providedIn: 'root'
})
export class StaffAttendanceService {
    private apiUrl = environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/staff-attendance';

    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json'
        })
    };

    constructor(private http: HttpClient) {}

    // Create attendance record
    addAttendance(attendance: StaffAttendance): Observable<StaffAttendance> {
        // const url = attendance.id ? `${this.apiUrl}/${attendance.id}` : this.apiUrl;
        return this.http.post<StaffAttendance>(this.apiUrl, attendance, this.httpOptions);
    }

    // Update attendance record
    // updateAttendance(id: string, attendance: StaffAttendance): Observable<StaffAttendance> {
    //     return this.http.put<StaffAttendance>(`${this.apiUrl}/${id}`, attendance, this.httpOptions);
    // }

    // Get single attendance record
    getAttendance(id: string): Observable<StaffAttendance> {
        return this.http.get<StaffAttendance>(`${this.apiUrl}/${id}`);
    }

    // Delete attendance record
    deleteAttendance(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // Search attendance records with filters
    searchAttendance(request: SearchRequest): Observable<PageResponse<StaffAttendance>> {
        return this.http.post<PageResponse<StaffAttendance>>(`${this.apiUrl}/search`, request, this.httpOptions);
    }

    // Generate attendance report
    generateReport(request: SearchRequest): Observable<PageResponse<StaffAttendanceReport>> {
        return this.http.post<PageResponse<StaffAttendanceReport>>(`${this.apiUrl}/report`, request, this.httpOptions);
    }

    // Get staff attendance for specific date range
    getStaffAttendanceByDateRange(request: SearchRequest): Observable<PageResponse<StaffAttendance>> {
        return this.searchAttendance(request);
    }

    // Get today's attendance for all staff
    getTodayAttendance(): Observable<PageResponse<StaffAttendance>> {
        const today = new Date().toISOString().split('T')[0];
        const request: SearchRequest = {
            filters: {
                attendanceDateRange: [today, today]
            },
            page: 0,
            size: 1000
        };
        return this.searchAttendance(request);
    }

    // Get monthly stats for a staff member
    getMonthlyStats(staffId: string): Observable<PageResponse<StaffAttendance>> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const today = new Date();

        const request: SearchRequest = {
            filters: {
                staffId,
                attendanceDateRange: [startOfMonth.toISOString().split('T')[0], today.toISOString().split('T')[0]]
            },
            page: 0,
            size: 100
        };
        return this.searchAttendance(request);
    }

    // Export attendance data to CSV
    exportToCSV(data: any[], filename: string): void {
        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    private convertToCSV(data: any[]): string {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');

        const csvRows = data.map((row) =>
            headers
                .map((header) => {
                    const value = row[header];
                    return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
                })
                .join(',')
        );

        return [csvHeaders, ...csvRows].join('\n');
    }

    // Format date for display
    formatDate(date: Date | string): string {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Calculate attendance percentage
    calculateAttendancePercentage(presentDays: number, totalDays: number): number {
        if (totalDays === 0) return 0;
        return Math.round((presentDays / totalDays) * 100 * 100) / 100;
    }
}
