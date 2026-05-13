import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from '../../core/services/application-config.service';

export interface NoticeSummaryDTO {
    id: string;
    title: string;
    content: string;
    categoryType: string;
    priority: string;
    publishedAt: string;
}

export interface ExamSummaryDTO {
    examId: string;
    title: string;
    examType: string;
    status: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    venue: string;
    totalMarks: number;
    className: string;
    sectionName: string;
    departmentName: string;
}

export interface AssignmentSummaryDTO {
    id: string;
    title: string;
    subjectName: string;
    className: string;
    sectionName: string;
    dueDate: string;
    assignedDate: string;
    type: string;
    status: string;
    submissionStatus?: string;
    grade?: string;
}

export interface ProfileSummaryDTO {
    userId: string;
    fullName: string;
    email: string;
    contactNumber: string;
    profileType: string;
    academicYear: string;
    employeeId: string;
    departments: string[];
    joinedDate: string;
    experience?: string;
    qualification?: string;
    subjects?: string[];
    // student-only
    rollNumber?: string;
    className?: string;
    sectionName?: string;
    // admin/hod
    responsibilities?: string;
}
export interface LoginTrendDTO {
    day: string;
    students: number;
    staff: number;
}

export interface SystemHealthDTO {
    label: string;
    value: number;
    status: string;
}

export interface TimelineItemDTO {
    icon: string;
    title: string;
    description: string;
    time: string;
    type: string;
}

export interface AdminDashboardResponse {
    totalStudents: number;
    totalStaff: number;
    totalDepartments: number;
    activeClasses: number;
    studentChange: number;
    staffChange: number;
    loginTrend: LoginTrendDTO[];
    systemHealth: SystemHealthDTO[];
    recentTimeline: TimelineItemDTO[];
    recentNotices: NoticeSummaryDTO[];
    profile: ProfileSummaryDTO;
}

export interface TimetablePeriodDTO {
    id: string;
    periodNumber: number;
    name: string;
    type: string;
    startTime: string;
    endTime: string;
    subjectName: string;
    subjectId: string;
    instructorName: string;
    className: string;
    sectionName: string;
    room: string;
    current: boolean;
}

export interface ClassAttendanceSummaryDTO {
    classLabel: string;
    subjectLabel: string;
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
    isMarked: boolean;
}

export interface MonthlyAttendanceDTO {
    presentDays: number;
    totalDays: number;
    percentage: number;
    dailyDots: (boolean | null)[];
}

export interface StaffDashboardResponse {
    timetableToday: TimetablePeriodDTO[];
    classAttendance: ClassAttendanceSummaryDTO;
    monthlyAttendance: MonthlyAttendanceDTO;
    assignments: AssignmentSummaryDTO[];
    exams: ExamSummaryDTO[];
    notices: NoticeSummaryDTO[];
    profile: ProfileSummaryDTO;
    deptStats: DeptSummaryStatsStffDTO;
}

export interface DeptSummaryStatsStffDTO {
    totalStudents: number;
    assClassOrSection: ClassSectionDTO[];
    assSubjects: ClassSectionDTO[];
}

export interface ClassSectionDTO {
    classId: string;
    sectionId: string;
    className: string;
    sectionName: string;
    deptName: string;
    deptId: string;
    subCode: string;
    subName: string;
}

export interface DeptSummaryStatsDTO {
    totalStaff: number;
    presentToday: number;
    totalStudents: number;
    activeClasses: number;
    inventoryItems: number;
    upcomingExams: number;
    staffAttendancePercent: number;
    selfAvrgAtendce: number;
    avgStudentScore: number;
    syllabusCoverage: number;
}

export interface StaffAttendanceRowDTO {
    staffId: string;
    staffName: string;
    subjectName: string;
    classes: string;
    checkInTime?: string;
    status: string;
    attendancePercentage: number;
    monthlyStats: MonthlySatsDTO;
    weeklyTrend: any[];
}

export interface MonthlySatsDTO {
    totalWorkingDays: number;
    totalPresentDays: number;
    absentDays: number;
    leaveDays: number;
    daysFromMonthStart: number;
}
export interface InventoryTransactionDTO {
    id: string;
    itemName: string;
    issuedTo: string;
    action: string;
    date: string;
    quantity: number;
    status: string;
}

export interface HodDashboardResponse {
    deptStats: DeptSummaryStatsDTO;
    staffAttendance: StaffAttendanceRowDTO[];
    exams: ExamSummaryDTO[];
    notices: NoticeSummaryDTO[];
    inventory: InventoryTransactionDTO[];
    profile: ProfileSummaryDTO;
}

export interface StudentAttendanceSummaryDTO {
    totalSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalExcused: number;
    overallAttendancePercentage: number;
    minRequired: number;
    atRisk: boolean;
}

export interface SubjectAttendanceSummaryDTO {
    subjectCode: string;
    subjectName: string;
    totalSessions: number;
    totalPresent: number;
    attendancePercentage: number;
    attendanceStatus: 'GOOD' | 'WARNING' | 'CRITICAL';
}

export interface SemesterStatsDTO {
    attendancePercent: number;
    assignmentsDone: number;
    assignmentsTotal: number;
    avgScore: number;
    syllabusCoverage: number;
    overallGrade: string;
}

export interface StudentDashboardResponse {
    attendance: StudentAttendanceSummaryDTO;
    subjectAttendance: SubjectAttendanceSummaryDTO[];
    exams: ExamSummaryDTO[];
    assignments: AssignmentSummaryDTO[];
    notices: NoticeSummaryDTO[];
    semesterStats: SemesterStatsDTO;
    profile: ProfileSummaryDTO;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly http = inject(HttpClient);
    private readonly appCfg = inject(ApplicationConfigService);

    private adminBase(): string {
        return this.appCfg.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/dashboard');
    }

    private academicsBase(): string {
        return this.appCfg.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/dashboard');
    }

    private notificationBase(): string {
        return this.appCfg.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/dashboard');
    }

    getAdminDashboard(staffId: string, branchId: string, academicYear: string): Observable<AdminDashboardResponse> {
        const params = new HttpParams().set('staffId', staffId).set('branchId', branchId).set('academicYear', academicYear);
        return this.http.get<AdminDashboardResponse>(`${this.adminBase()}/admin`, { params });
    }

    getStaffDashboard(staffId: string, departmentId: string, academicYear: string): Observable<StaffDashboardResponse> {
        const params = new HttpParams().set('staffId', staffId).set('departmentId', departmentId).set('academicYear', academicYear).set('date', new Date().toISOString().split('T')[0]);
        return this.http.get<StaffDashboardResponse>(`${this.academicsBase()}/staff`, { params });
    }

    getHodDashboard(staffId: string, departmentId: string, branchId: string, academicYear: string): Observable<HodDashboardResponse> {
        const params = new HttpParams().set('staffId', staffId).set('departmentId', departmentId).set('branchId', branchId).set('academicYear', academicYear);
        return this.http.get<HodDashboardResponse>(`${this.academicsBase()}/hod`, { params });
    }

    getStudentDashboard(studentId: string, departmentId: string, academicYear: string): Observable<StudentDashboardResponse> {
        const params = new HttpParams().set('studentId', studentId).set('departmentId', departmentId).set('academicYear', academicYear);
        return this.http.get<StudentDashboardResponse>(`${this.academicsBase()}/student`, { params });
    }
}
