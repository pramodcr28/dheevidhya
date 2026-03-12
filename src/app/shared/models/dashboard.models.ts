// ─────────────────────────────────────────────────────────────
//  dashboard.models.ts
//  Typed interfaces aligned with your existing backend models
// ─────────────────────────────────────────────────────────────

// ── Enums (mirrors your backend) ─────────────────────────────

export enum ExamType {
    UNIT_TEST = 'UNIT_TEST',
    SEMISTER_EXAM = 'SEMISTER_EXAM',
    MID_TERM = 'MID_TERM',
    PRE_FINAL = 'PRE_FINAL',
    FINAL = 'FINAL',
    PRACTICAL = 'PRACTICAL',
    INTERNAL = 'INTERNAL',
    SUPPLEMENTARY = 'SUPPLEMENTARY',
    RE_EXAM = 'RE_EXAM'
}

export enum ExamStatus {
    DRAFT = 'DRAFT',
    SCHEDULED = 'SCHEDULED',
    RESCHEDULED = 'RESCHEDULED',
    ONGOING = 'ONGOING',
    RESULT_DECLARED = 'RESULT_DECLARED',
    CANCELLED = 'CANCELLED'
}

export const ExamTypeLabels: Record<ExamType, string> = {
    [ExamType.UNIT_TEST]: 'Unit Test',
    [ExamType.SEMISTER_EXAM]: 'Semester Exam',
    [ExamType.MID_TERM]: 'Mid Term',
    [ExamType.PRE_FINAL]: 'Pre Final',
    [ExamType.FINAL]: 'Final Exam',
    [ExamType.PRACTICAL]: 'Practical',
    [ExamType.INTERNAL]: 'Internal',
    [ExamType.SUPPLEMENTARY]: 'Supplementary',
    [ExamType.RE_EXAM]: 'Re-exam'
};

export enum AssignmentStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ONGOING = 'ONGOING',
    COMPLETED = 'COMPLETED',
    OVERDUE = 'OVERDUE'
}

export enum SubmissionStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    REVIEWED = 'REVIEWED',
    REOPENED = 'REOPENED'
}

export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    LATE = 'LATE',
    LEAVE = 'LEAVE',
    ON_DUTY = 'ON_DUTY',
    EXCUSED = 'EXCUSED'
}

export enum CategoryType {
    GENERAL = 'GENERAL',
    TIMETABLE = 'TIMETABLE',
    ATTENDANCE = 'ATTENDANCE',
    EXAM_ANNOUNCEMENT = 'EXAM_ANNOUNCEMENT',
    EXAM_RESULT = 'EXAM_RESULT',
    HOLIDAY = 'HOLIDAY',
    MEETING = 'MEETING',
    APPRECIATION = 'APPRECIATION',
    SCHOOL_ACHIEVEMENT = 'SCHOOL_ACHIEVEMENT',
    FEST = 'FEST'
}

export enum Priority {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW'
}

export enum TransactionType {
    ISSUE = 'ISSUE',
    RETURN = 'RETURN',
    TRANSFER = 'TRANSFER',
    MAINTENANCE = 'MAINTENANCE',
    REMOVED = 'REMOVED',
    PURCHASE = 'PURCHASE',
    LOST = 'LOST',
    FOUND = 'FOUND'
}

export enum ItemStatus {
    AVAILABLE = 'AVAILABLE',
    ASSIGNED = 'ASSIGNED',
    IN_USE = 'IN_USE',
    UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
    DAMAGED = 'DAMAGED',
    RETIRED = 'RETIRED'
}

// ── Profile / User ────────────────────────────────────────────

export interface DashboardProfile {
    userId: string;
    fullName: string;
    email: string;
    contactNumber: string;
    profileType: 'STUDENT' | 'STAFF' | 'ADMIN' | 'HOD';
    imageUrl?: string;
    academicYear: string;
    departmentName?: string;
    joinedDate?: string;
    employeeId?: string;
    // role-specific extras
    rollNumber?: string;
    className?: string;
    sectionName?: string;
    subjects?: string[];
    experience?: string;
    qualification?: string;
    responsibilities?: string;
}

// ── Exam (from ExaminationDTO) ────────────────────────────────

export interface DashboardExam {
    examId: string;
    title: string;
    examType: ExamType;
    status: ExamStatus;
    academicYear: string;
    departmentId: string;
    departmentName: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    venue: string;
    totalMarks: number;
    className: string;
    sectionName: string;
}

// ── Assignment (from Assignment model) ───────────────────────

export interface DashboardAssignment {
    id: string;
    title: string;
    subjectName: string;
    className: string;
    sectionName: string;
    dueDate: string;
    assignedDate: string;
    type: 'HOMEWORK' | 'PROJECT' | 'EXAM' | 'QUIZ';
    status: AssignmentStatus;
    submissionStatus?: SubmissionStatus;
    grade?: string;
}

// ── Notice (from Notice model) ────────────────────────────────

export interface DashboardNotice {
    id: string;
    title: string;
    content: string;
    categoryType: CategoryType;
    priority: Priority;
    publishedAt: string;
}

// ── Timetable Period (from Period model) ──────────────────────

export interface DashboardPeriod {
    id: string;
    periodNumber: number;
    name: string;
    type: 'lecture' | 'break' | 'free';
    startTime: string;
    endTime: string;
    subjectName: string;
    subjectId: string;
    instructorName?: string;
    className: string;
    sectionName: string;
    room?: string;
    isCurrent?: boolean;
}

// ── Attendance (from AttendanceRequest / StudentAttendanceReportResponse) ─

export interface DashboardAttendanceSummary {
    totalSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalExcused: number;
    overallAttendancePercentage: number;
    minRequired: number; // e.g. 75
    isAtRisk: boolean;
}

export interface SubjectAttendanceSummary {
    subjectCode: string;
    subjectName: string;
    totalSessions: number;
    totalPresent: number;
    attendancePercentage: number;
    attendanceStatus: 'GOOD' | 'WARNING' | 'CRITICAL';
}

// ── Staff Attendance (from StaffAttendance) ───────────────────

export interface StaffAttendanceRow {
    staffId: string;
    staffName: string;
    subjectName: string;
    classes: string;
    checkInTime?: string;
    status: AttendanceStatus;
    attendancePercentage: number; // for sparkline
    weeklyTrend: boolean[]; // 7 booleans = Mon–Sun
}

// ── Inventory (from InventoryTransaction) ────────────────────

export interface DashboardInventoryTransaction {
    id: string;
    itemName: string;
    issuedTo: string;
    action: TransactionType;
    date: string;
    quantity: number;
    status: ItemStatus;
}

// ── Admin Stats ───────────────────────────────────────────────

export interface AdminSystemStats {
    totalStudents: number;
    totalStaff: number;
    totalDepartments: number;
    activeClasses: number;
    studentChange: number;
    staffChange: number;
}

export interface SystemHealthItem {
    label: string;
    value: number; // percentage 0-100
    status: 'ok' | 'warn' | 'critical';
}

export interface SystemTimelineItem {
    icon: string;
    title: string;
    description: string;
    time: string;
    type: 'success' | 'warning' | 'info' | 'danger';
}

export interface LoginTrendPoint {
    day: string;
    students: number;
    staff: number;
}

// ── HOD Dept Stats ────────────────────────────────────────────

export interface DeptSummaryStats {
    totalStaff: number;
    presentToday: number;
    totalStudents: number;
    activeClasses: number;
    inventoryItems: number;
    upcomingExams: number;
    staffAttendancePercent: number;
    avgStudentScore: number;
    syllabusCoverage: number;
}
