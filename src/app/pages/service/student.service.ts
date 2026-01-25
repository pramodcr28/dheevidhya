import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IProfileConfig } from '../models/user.model';

interface PromotionSummary {
    totalDepartments: number;
    totalClasses: number;
    totalSections: number;
    promotedStudents: number;
    pendingStudents: number;
}

interface PromotionData {
    studentIds: number[];
    targetClassId: string;
    targetSectionId: string;
    targetDepartmentId: string;
    academicYear: string;
}

@Injectable({
    providedIn: 'root'
})
export class StudentService {
    private apiUrl = '/api/students';

    constructor(private http: HttpClient) {}

    getStudentsBySection(sectionId: string): Observable<IProfileConfig[]> {
        return this.http.get<IProfileConfig[]>(`${this.apiUrl}/section/${sectionId}`);
    }

    getPromotedStudentsBySection(sectionId: string): Observable<IProfileConfig[]> {
        return this.http.get<IProfileConfig[]>(`${this.apiUrl}/section/${sectionId}/promoted`);
    }

    getPromotionSummary(): Observable<PromotionSummary> {
        return this.http.get<PromotionSummary>(`${this.apiUrl}/promotion-summary`);
    }

    promoteStudents(data: PromotionData): Observable<any> {
        return this.http.post(`${this.apiUrl}/promote`, data);
    }

    markStudentAsExited(studentId: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/${studentId}/exit`, {});
    }
}
