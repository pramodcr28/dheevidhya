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
    type: string; // HOMEWORK | PROJECT | EXAM | QUIZ
    status: string; // AssignmentStatus
    submissionStatus?: string; // SubmissionStatus (student only)
    grade?: string;
}

export interface ProfileSummaryDTO {
    userId: string;
    fullName: string;
    email: string;
    contactNumber: string;
    profileType: string; // STUDENT | STAFF | HOD | ADMIN
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

// ── 1. Admin Dashboard ────────────────────────────────────────────────────────

export interface LoginTrendDTO {
    day: string; // Mon, Tue …
    students: number;
    staff: number;
}

export interface SystemHealthDTO {
    label: string;
    value: number; // 0-100 %
    status: string; // ok | warn | critical
}

export interface TimelineItemDTO {
    icon: string;
    title: string;
    description: string;
    time: string;
    type: string; // success | warning | info | danger
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

// ── 2. Staff Dashboard ────────────────────────────────────────────────────────

export interface TimetablePeriodDTO {
    id: string;
    periodNumber: number;
    name: string;
    type: string; // lecture | break | free
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
    dailyDots: (boolean | null)[]; // true=present, false=absent, null=holiday
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
    status: string; // PRESENT | ABSENT | LATE | LEAVE | ON_DUTY
    attendancePercentage: number;
    monthlyStats: MonthlySatsDTO;
    weeklyTrend: any[]; // last 7 days Mon-Sun
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
    action: string; // TransactionType
    date: string;
    quantity: number;
    status: string; // ItemStatus
}

export interface HodDashboardResponse {
    deptStats: DeptSummaryStatsDTO;
    staffAttendance: StaffAttendanceRowDTO[];
    exams: ExamSummaryDTO[];
    notices: NoticeSummaryDTO[];
    inventory: InventoryTransactionDTO[];
    profile: ProfileSummaryDTO;
}

// ── 4. Student Dashboard ──────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
//  DashboardService
// ─────────────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly http = inject(HttpClient);
    private readonly appCfg = inject(ApplicationConfigService);

    // ── Base URL builders — one per microservice ──────────────────────────────
    //
    //  ADMIN service  → handles: profile counts, dept/branch stats, inventory
    private adminBase(): string {
        return this.appCfg.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/dashboard');
    }

    //  ACADEMICS service → handles: timetable, student-attendance, exams,
    //                                assignments, staff-attendance
    private academicsBase(): string {
        return this.appCfg.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/dashboard');
    }

    //  NOTIFICATION service → handles: notices
    private notificationBase(): string {
        return this.appCfg.getEndpointFor(environment.ServerUrl + environment.ACADEMICS_BASE_URL + 'api/dashboard');
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  1. IT Admin Dashboard
    //     GET  {ADMIN_BASE_URL}/api/dashboard/admin?branchId=&academicYear=
    // ─────────────────────────────────────────────────────────────────────────
    getAdminDashboard(staffId: string, branchId: string, academicYear: string): Observable<AdminDashboardResponse> {
        const params = new HttpParams().set('staffId', staffId).set('branchId', branchId).set('academicYear', academicYear);
        return this.http.get<AdminDashboardResponse>(`${this.adminBase()}/admin`, { params });
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  2. Staff Dashboard
    //     GET  {ACADEMICS_BASE_URL}/api/dashboard/staff
    //            ?staffId=&departmentId=&academicYear=&date=
    // ─────────────────────────────────────────────────────────────────────────
    getStaffDashboard(staffId: string, departmentId: string, academicYear: string): Observable<StaffDashboardResponse> {
        const params = new HttpParams().set('staffId', staffId).set('departmentId', departmentId).set('academicYear', academicYear).set('date', new Date().toISOString().split('T')[0]);
        return this.http.get<StaffDashboardResponse>(`${this.academicsBase()}/staff`, { params });
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  3. HOD Dashboard
    //     GET  {ACADEMICS_BASE_URL}/api/dashboard/hod
    //            ?departmentId=&branchId=&academicYear=
    // ─────────────────────────────────────────────────────────────────────────
    getHodDashboard(staffId: string, departmentId: string, branchId: string, academicYear: string): Observable<HodDashboardResponse> {
        const params = new HttpParams().set('staffId', staffId).set('departmentId', departmentId).set('branchId', branchId).set('academicYear', academicYear);
        return this.http.get<HodDashboardResponse>(`${this.academicsBase()}/hod`, { params });
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  4. Student Dashboard
    //     GET  {ACADEMICS_BASE_URL}/api/dashboard/student
    //            ?studentId=&departmentId=&academicYear=
    // ─────────────────────────────────────────────────────────────────────────
    getStudentDashboard(studentId: string, departmentId: string, academicYear: string): Observable<StudentDashboardResponse> {
        const params = new HttpParams().set('studentId', studentId).set('departmentId', departmentId).set('academicYear', academicYear);
        return this.http.get<StudentDashboardResponse>(`${this.academicsBase()}/student`, { params });
    }
}
