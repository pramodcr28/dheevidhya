// ─────────────────────────────────────────────────────────────
//  dashboard-dummy.data.ts
//  All dummy data in one place.
//  TODO: Replace each const with a real service call when backend is ready.
//  Each section is labelled with the microservice it belongs to.
// ─────────────────────────────────────────────────────────────

import {
    AdminSystemStats,
    AssignmentStatus,
    AttendanceStatus,
    CategoryType,
    DashboardAssignment,
    DashboardAttendanceSummary,
    DashboardExam,
    DashboardInventoryTransaction,
    DashboardNotice,
    DashboardPeriod,
    DashboardProfile,
    DeptSummaryStats,
    ExamStatus,
    ExamType,
    ItemStatus,
    LoginTrendPoint,
    Priority,
    StaffAttendanceRow,
    SubjectAttendanceSummary,
    SubmissionStatus,
    SystemHealthItem,
    SystemTimelineItem,
    TransactionType
} from '../dashboard.models';

// ═══════════════════════════════════════════
// SERVICE: admin-service / uaa-service
// ═══════════════════════════════════════════

export const ADMIN_STATS: AdminSystemStats = {
    totalStudents: 1284,
    totalStaff: 86,
    totalDepartments: 12,
    activeClasses: 42,
    studentChange: 48,
    staffChange: 3
};

export const SYSTEM_HEALTH: SystemHealthItem[] = [
    { label: 'CPU Load', value: 34, status: 'ok' },
    { label: 'Memory Usage', value: 67, status: 'warn' },
    { label: 'Disk (Server 2)', value: 89, status: 'critical' }
];

export const SYSTEM_TIMELINE: SystemTimelineItem[] = [
    { icon: 'pi pi-check-circle', title: 'v2.4.1 deployed successfully', description: 'Grade module fix & performance patch', time: 'Today 09:15', type: 'success' },
    { icon: 'pi pi-lock', title: 'SSL Certificate renewed', description: 'Valid 365 days · auto-renewal on', time: 'Yesterday', type: 'info' },
    { icon: 'pi pi-exclamation-triangle', title: 'Database migration ran', description: 'Schema update for attendance tables', time: 'Mar 04', type: 'warning' },
    { icon: 'pi pi-sync', title: 'Bulk student import done', description: '1,284 records synced from ERP', time: 'Mar 01', type: 'info' }
];

export const LOGIN_TREND: LoginTrendPoint[] = [
    { day: 'Mon', students: 820, staff: 68 },
    { day: 'Tue', students: 910, staff: 74 },
    { day: 'Wed', students: 980, staff: 82 },
    { day: 'Thu', students: 870, staff: 71 },
    { day: 'Fri', students: 940, staff: 78 },
    { day: 'Sat', students: 210, staff: 18 },
    { day: 'Sun', students: 90, staff: 6 }
];

export const ADMIN_NOTIFICATIONS: DashboardNotice[] = [
    { id: 'n1', title: 'Disk usage critical', content: 'Server 2 at 89% capacity. Action required.', categoryType: CategoryType.GENERAL, priority: Priority.HIGH, publishedAt: '2026-03-06T08:05:00' },
    { id: 'n2', title: '48 new students enrolled', content: 'Accounts created for Spring term.', categoryType: CategoryType.GENERAL, priority: Priority.MEDIUM, publishedAt: '2026-03-06T07:00:00' },
    { id: 'n3', title: 'Scheduled maintenance', content: 'DB backup at 02:00 AM tonight.', categoryType: CategoryType.GENERAL, priority: Priority.MEDIUM, publishedAt: '2026-03-06T05:00:00' },
    { id: 'n4', title: '3 staff pending roles', content: 'New staff accounts awaiting role assignment.', categoryType: CategoryType.GENERAL, priority: Priority.LOW, publishedAt: '2026-03-05T16:00:00' }
];

export const ADMIN_PROFILE: DashboardProfile = {
    userId: 'usr-0001',
    fullName: 'Rahul Agarwal',
    email: 'r.agarwal@edumanage.edu',
    contactNumber: '+91 98001 23456',
    profileType: 'ADMIN',
    academicYear: '2025-26',
    employeeId: 'EMP-0001',
    departmentName: 'Information Technology Division',
    joinedDate: '2018-08-01',
    responsibilities: 'Super Admin · All modules access'
};

// ═══════════════════════════════════════════
// SERVICE: timetable-service
// ═══════════════════════════════════════════

export const STAFF_TIMETABLE_TODAY: DashboardPeriod[] = [
    {
        id: 'p1',
        periodNumber: 1,
        name: 'Period 1',
        type: 'lecture',
        startTime: '08:00',
        endTime: '08:45',
        subjectName: 'Algebra II',
        subjectId: 'sub-01',
        instructorName: 'Sanjana Pillai',
        className: '10',
        sectionName: 'B',
        room: 'R-201',
        isCurrent: false
    },
    {
        id: 'p2',
        periodNumber: 2,
        name: 'Period 2',
        type: 'lecture',
        startTime: '09:00',
        endTime: '09:45',
        subjectName: 'Calculus I',
        subjectId: 'sub-02',
        instructorName: 'Sanjana Pillai',
        className: '11',
        sectionName: 'A',
        room: 'R-305',
        isCurrent: true
    },
    {
        id: 'p3',
        periodNumber: 3,
        name: 'Period 3',
        type: 'lecture',
        startTime: '10:00',
        endTime: '10:45',
        subjectName: 'Statistics',
        subjectId: 'sub-03',
        instructorName: 'Sanjana Pillai',
        className: '12',
        sectionName: 'C',
        room: 'R-102',
        isCurrent: false
    },
    {
        id: 'p4',
        periodNumber: 4,
        name: 'Period 4',
        type: 'lecture',
        startTime: '11:00',
        endTime: '11:45',
        subjectName: 'Algebra II',
        subjectId: 'sub-01',
        instructorName: 'Sanjana Pillai',
        className: '10',
        sectionName: 'A',
        room: 'R-201',
        isCurrent: false
    },
    { id: 'p5', periodNumber: 5, name: 'Period 5', type: 'free', startTime: '14:00', endTime: '14:45', subjectName: 'Free Period', subjectId: '', className: '', sectionName: '', room: '', isCurrent: false }
];

// ═══════════════════════════════════════════
// SERVICE: exam-service
// ═══════════════════════════════════════════

export const STAFF_EXAMS: DashboardExam[] = [
    {
        examId: 'ex-01',
        title: 'Calculus I — Mid Term',
        examType: ExamType.MID_TERM,
        status: ExamStatus.SCHEDULED,
        academicYear: '2025-26',
        departmentId: 'dept-01',
        departmentName: 'Mathematics',
        startDate: '2026-03-12',
        endDate: '2026-03-12',
        startTime: '09:00',
        endTime: '11:00',
        venue: 'Hall A',
        totalMarks: 100,
        className: '11',
        sectionName: 'A'
    },
    {
        examId: 'ex-02',
        title: 'Algebra II — Unit Test',
        examType: ExamType.UNIT_TEST,
        status: ExamStatus.DRAFT,
        academicYear: '2025-26',
        departmentId: 'dept-01',
        departmentName: 'Mathematics',
        startDate: '2026-03-18',
        endDate: '2026-03-18',
        startTime: '10:00',
        endTime: '11:30',
        venue: 'Room 201',
        totalMarks: 50,
        className: '10',
        sectionName: 'B'
    },
    {
        examId: 'ex-03',
        title: 'Statistics — Final Exam',
        examType: ExamType.FINAL,
        status: ExamStatus.SCHEDULED,
        academicYear: '2025-26',
        departmentId: 'dept-01',
        departmentName: 'Mathematics',
        startDate: '2026-03-25',
        endDate: '2026-03-25',
        startTime: '14:00',
        endTime: '17:00',
        venue: 'Hall B',
        totalMarks: 100,
        className: '12',
        sectionName: 'C'
    }
];

export const HOD_EXAMS: DashboardExam[] = [
    {
        examId: 'ex-04',
        title: 'Data Structures — Mid Term',
        examType: ExamType.MID_TERM,
        status: ExamStatus.SCHEDULED,
        academicYear: '2025-26',
        departmentId: 'dept-02',
        departmentName: 'Computer Science',
        startDate: '2026-03-15',
        endDate: '2026-03-15',
        startTime: '09:00',
        endTime: '12:00',
        venue: 'Hall A',
        totalMarks: 100,
        className: '11',
        sectionName: 'A'
    },
    {
        examId: 'ex-05',
        title: 'Algorithms — Practical',
        examType: ExamType.PRACTICAL,
        status: ExamStatus.DRAFT,
        academicYear: '2025-26',
        departmentId: 'dept-02',
        departmentName: 'Computer Science',
        startDate: '2026-03-22',
        endDate: '2026-03-22',
        startTime: '10:00',
        endTime: '12:00',
        venue: 'Lab 2',
        totalMarks: 50,
        className: '12',
        sectionName: 'A'
    }
];

export const STUDENT_EXAMS: DashboardExam[] = [
    {
        examId: 'ex-06',
        title: 'Calculus I — Mid Term',
        examType: ExamType.MID_TERM,
        status: ExamStatus.SCHEDULED,
        academicYear: '2025-26',
        departmentId: 'dept-01',
        departmentName: 'Mathematics',
        startDate: '2026-03-12',
        endDate: '2026-03-12',
        startTime: '09:00',
        endTime: '11:00',
        venue: 'Hall A',
        totalMarks: 100,
        className: '11',
        sectionName: 'A'
    },
    {
        examId: 'ex-07',
        title: 'Physics — Practical',
        examType: ExamType.PRACTICAL,
        status: ExamStatus.SCHEDULED,
        academicYear: '2025-26',
        departmentId: 'dept-03',
        departmentName: 'Physics',
        startDate: '2026-03-16',
        endDate: '2026-03-16',
        startTime: '10:00',
        endTime: '13:00',
        venue: 'Lab 3',
        totalMarks: 50,
        className: '11',
        sectionName: 'A'
    },
    {
        examId: 'ex-08',
        title: 'Chemistry — Unit Test 3',
        examType: ExamType.UNIT_TEST,
        status: ExamStatus.SCHEDULED,
        academicYear: '2025-26',
        departmentId: 'dept-04',
        departmentName: 'Chemistry',
        startDate: '2026-03-22',
        endDate: '2026-03-22',
        startTime: '11:00',
        endTime: '12:30',
        venue: 'Room 104',
        totalMarks: 50,
        className: '11',
        sectionName: 'A'
    }
];

export const STAFF_ASSIGNMENTS: DashboardAssignment[] = [
    { id: 'as-01', title: 'Calculus Problem Set 7', subjectName: 'Calculus I', className: '11', sectionName: 'A', dueDate: '2026-03-10', assignedDate: '2026-03-03', type: 'HOMEWORK', status: AssignmentStatus.PUBLISHED },
    { id: 'as-02', title: 'Statistics Chapter Quiz', subjectName: 'Statistics', className: '12', sectionName: 'C', dueDate: '2026-03-07', assignedDate: '2026-03-01', type: 'QUIZ', status: AssignmentStatus.ONGOING },
    { id: 'as-03', title: 'Algebra Worksheet 4', subjectName: 'Algebra II', className: '10', sectionName: 'B', dueDate: '2026-03-05', assignedDate: '2026-02-28', type: 'HOMEWORK', status: AssignmentStatus.COMPLETED },
    { id: 'as-04', title: 'Trigonometry Test Paper', subjectName: 'Trigonometry', className: '10', sectionName: 'A', dueDate: '2026-03-03', assignedDate: '2026-02-25', type: 'EXAM', status: AssignmentStatus.COMPLETED }
];

export const STUDENT_ASSIGNMENTS: DashboardAssignment[] = [
    { id: 'sa-01', title: 'Calculus Problem Set 7', subjectName: 'Mathematics', className: '11', sectionName: 'A', dueDate: '2026-03-10', assignedDate: '2026-03-03', type: 'HOMEWORK', status: AssignmentStatus.PUBLISHED, submissionStatus: undefined },
    { id: 'sa-02', title: 'Lab Report — Titration', subjectName: 'Chemistry', className: '11', sectionName: 'A', dueDate: '2026-03-08', assignedDate: '2026-03-01', type: 'PROJECT', status: AssignmentStatus.PUBLISHED, submissionStatus: undefined },
    {
        id: 'sa-03',
        title: "Newton's Laws Essay",
        subjectName: 'Physics',
        className: '11',
        sectionName: 'A',
        dueDate: '2026-03-05',
        assignedDate: '2026-02-28',
        type: 'HOMEWORK',
        status: AssignmentStatus.COMPLETED,
        submissionStatus: SubmissionStatus.SUBMITTED
    },
    {
        id: 'sa-04',
        title: 'English Comprehension 3',
        subjectName: 'English',
        className: '11',
        sectionName: 'A',
        dueDate: '2026-03-04',
        assignedDate: '2026-02-27',
        type: 'HOMEWORK',
        status: AssignmentStatus.COMPLETED,
        submissionStatus: SubmissionStatus.REVIEWED,
        grade: 'A'
    },
    {
        id: 'sa-05',
        title: 'History Map Activity',
        subjectName: 'History',
        className: '11',
        sectionName: 'A',
        dueDate: '2026-03-01',
        assignedDate: '2026-02-24',
        type: 'PROJECT',
        status: AssignmentStatus.COMPLETED,
        submissionStatus: SubmissionStatus.REVIEWED,
        grade: 'B+'
    }
];

export const STAFF_NOTICES: DashboardNotice[] = [
    { id: 'sn1', title: 'Exam timetable released', content: 'March mid-term timetable published on portal.', categoryType: CategoryType.EXAM_ANNOUNCEMENT, priority: Priority.HIGH, publishedAt: '2026-03-06T09:00:00' },
    { id: 'sn2', title: 'Staff meeting — Friday 3PM', content: 'Conference Room 1 · Agenda: Semester review.', categoryType: CategoryType.MEETING, priority: Priority.MEDIUM, publishedAt: '2026-03-05T10:00:00' },
    { id: 'sn3', title: 'Leave approved — Mar 14', content: 'Your leave request has been approved.', categoryType: CategoryType.GENERAL, priority: Priority.LOW, publishedAt: '2026-03-04T11:00:00' },
    { id: 'sn4', title: 'Syllabus update — Calc I', content: 'Module 4 revised. Review updated curriculum.', categoryType: CategoryType.TIMETABLE, priority: Priority.MEDIUM, publishedAt: '2026-03-03T09:00:00' }
];

export const HOD_NOTICES: DashboardNotice[] = [
    { id: 'hn1', title: 'Syllabus revision — CS 12-A', content: 'Algorithm module updated by academic council.', categoryType: CategoryType.TIMETABLE, priority: Priority.HIGH, publishedAt: '2026-03-06T10:15:00' },
    { id: 'hn2', title: 'Lab inventory approved', content: '5 Raspberry Pi units approved. Collect from store.', categoryType: CategoryType.GENERAL, priority: Priority.MEDIUM, publishedAt: '2026-03-05T14:00:00' },
    { id: 'hn3', title: 'Guest lecture confirmed', content: 'Dr. Nair (IISc) on AI Ethics — March 20.', categoryType: CategoryType.GENERAL, priority: Priority.LOW, publishedAt: '2026-03-04T09:00:00' },
    { id: 'hn4', title: 'Absence alert — Vijay Joshi', content: '3 consecutive absences. Review required.', categoryType: CategoryType.ATTENDANCE, priority: Priority.HIGH, publishedAt: '2026-03-04T08:00:00' }
];

export const STUDENT_NOTICES: DashboardNotice[] = [
    { id: 'nn1', title: 'Exam timetable released', content: 'March mid-terms scheduled. Check portal.', categoryType: CategoryType.EXAM_ANNOUNCEMENT, priority: Priority.HIGH, publishedAt: '2026-03-06T09:00:00' },
    { id: 'nn2', title: 'Holiday — March 14', content: 'School holiday declared for March 14.', categoryType: CategoryType.HOLIDAY, priority: Priority.MEDIUM, publishedAt: '2026-03-05T10:00:00' },
    { id: 'nn3', title: 'Science fair open', content: 'Registrations open till March 10.', categoryType: CategoryType.FEST, priority: Priority.LOW, publishedAt: '2026-03-04T09:00:00' },
    { id: 'nn4', title: 'Fee reminder — Term 2', content: 'Term 2 fees due by March 15.', categoryType: CategoryType.GENERAL, priority: Priority.HIGH, publishedAt: '2026-03-03T09:00:00' },
    { id: 'nn5', title: 'Sports day schedule updated', content: 'Practice schedule updated for all classes.', categoryType: CategoryType.GENERAL, priority: Priority.LOW, publishedAt: '2026-03-01T09:00:00' }
];

export const STAFF_CLASS_ATTENDANCE = {
    classLabel: 'Class 11-A',
    subjectLabel: 'Calculus I',
    totalStudents: 40,
    present: 36,
    absent: 3,
    late: 1,
    isMarked: true
};

export const STUDENT_ATTENDANCE: DashboardAttendanceSummary = {
    totalSessions: 62,
    totalPresent: 54,
    totalAbsent: 8,
    totalLate: 0,
    totalExcused: 0,
    overallAttendancePercentage: 87,
    minRequired: 75,
    isAtRisk: false
};

export const STUDENT_SUBJECT_ATTENDANCE: SubjectAttendanceSummary[] = [
    { subjectCode: 'MATH-101', subjectName: 'Mathematics', totalSessions: 20, totalPresent: 18, attendancePercentage: 90, attendanceStatus: 'GOOD' },
    { subjectCode: 'PHY-101', subjectName: 'Physics', totalSessions: 18, totalPresent: 15, attendancePercentage: 83, attendanceStatus: 'GOOD' },
    { subjectCode: 'CHEM-101', subjectName: 'Chemistry', totalSessions: 16, totalPresent: 12, attendancePercentage: 75, attendanceStatus: 'WARNING' },
    { subjectCode: 'ENG-101', subjectName: 'English', totalSessions: 8, totalPresent: 9, attendancePercentage: 100, attendanceStatus: 'GOOD' }
];

export const STAFF_MONTHLY_ATTENDANCE = {
    presentDays: 18,
    totalDays: 20,
    percentage: 90,
    dailyDots: [true, true, true, true, false, true, true, true, true, true, true, false, true, true, true, true, true, true, null, null] as (boolean | null)[]
};

export const HOD_STAFF_ATTENDANCE: StaffAttendanceRow[] = [
    {
        staffId: 'st-01',
        staffName: 'Sanjana Pillai',
        subjectName: 'Data Structures',
        classes: 'CS-11A, 12B',
        checkInTime: '08:52 AM',
        status: AttendanceStatus.PRESENT,
        attendancePercentage: 96,
        weeklyTrend: [true, true, true, true, false, true, true]
    },
    { staffId: 'st-02', staffName: 'Ravi Kumar', subjectName: 'Algorithms', classes: 'CS-12A, 12C', checkInTime: '09:10 AM', status: AttendanceStatus.LATE, attendancePercentage: 88, weeklyTrend: [true, true, true, true, true, true, true] },
    { staffId: 'st-03', staffName: 'Anita Menon', subjectName: 'DBMS', classes: 'CS-11B, 11C', checkInTime: '08:45 AM', status: AttendanceStatus.PRESENT, attendancePercentage: 100, weeklyTrend: [true, true, true, true, true, true, true] },
    { staffId: 'st-04', staffName: 'Vijay Joshi', subjectName: 'Networks', classes: 'CS-12B', checkInTime: undefined, status: AttendanceStatus.ABSENT, attendancePercentage: 72, weeklyTrend: [true, true, false, true, true, true, false] },
    { staffId: 'st-05', staffName: 'Priya Gupta', subjectName: 'OS', classes: 'CS-11A, 12A', checkInTime: '08:38 AM', status: AttendanceStatus.PRESENT, attendancePercentage: 100, weeklyTrend: [true, true, true, true, true, true, true] }
];

// ═══════════════════════════════════════════
// SERVICE: inventory-service
// ═══════════════════════════════════════════

export const HOD_INVENTORY: DashboardInventoryTransaction[] = [
    { id: 'inv-041', itemName: 'Raspberry Pi 4B', issuedTo: 'Anita Menon', action: TransactionType.ISSUE, date: '2026-03-05', quantity: 5, status: ItemStatus.ASSIGNED },
    { id: 'inv-040', itemName: 'Arduino Uno Kit', issuedTo: 'Priya Gupta', action: TransactionType.ISSUE, date: '2026-03-04', quantity: 10, status: ItemStatus.ASSIGNED },
    { id: 'inv-039', itemName: 'HDMI Cables (1.8m)', issuedTo: 'Lab 2 General', action: TransactionType.ISSUE, date: '2026-03-03', quantity: 8, status: ItemStatus.IN_USE },
    { id: 'inv-038', itemName: 'USB Keyboards', issuedTo: 'Ravi Kumar', action: TransactionType.ISSUE, date: '2026-03-01', quantity: 3, status: ItemStatus.IN_USE },
    { id: 'inv-037', itemName: 'Projector Remote', issuedTo: 'Sanjana Pillai', action: TransactionType.RETURN, date: '2026-02-28', quantity: 1, status: ItemStatus.AVAILABLE }
];

// ═══════════════════════════════════════════
// SERVICE: profile-config-service / uaa-service
// ═══════════════════════════════════════════

export const STAFF_PROFILE: DashboardProfile = {
    userId: 'usr-1042',
    fullName: 'Sanjana Pillai',
    email: 's.pillai@edumanage.edu',
    contactNumber: '+91 98765 43210',
    profileType: 'STAFF',
    academicYear: '2025-26',
    employeeId: 'EMP-1042',
    departmentName: 'Mathematics & Sciences',
    joinedDate: '2019-08-01',
    experience: '6 Years 7 Months',
    qualification: 'M.Sc Mathematics',
    subjects: ['Calculus I', 'Algebra II', 'Statistics', 'Trigonometry']
};

export const HOD_PROFILE: DashboardProfile = {
    userId: 'usr-0021',
    fullName: 'Dr. Kavita Iyer',
    email: 'k.iyer@edumanage.edu',
    contactNumber: '+91 99887 76655',
    profileType: 'HOD',
    academicYear: '2025-26',
    employeeId: 'EMP-0021',
    departmentName: 'Computer Science & Engineering',
    joinedDate: '2012-06-01',
    experience: '14 Years',
    qualification: 'PhD, IIT Bombay',
    subjects: ['Data Structures', 'Algorithms', 'DBMS', 'Networks', 'OS', 'AI & ML'],
    responsibilities: 'Research Lead · Faculty Mentor'
};

export const STUDENT_PROFILE: DashboardProfile = {
    userId: 'usr-9007',
    fullName: 'Arjun Kapoor',
    email: 'arjun.k@student.edu',
    contactNumber: '+91 98765 11223',
    profileType: 'STUDENT',
    academicYear: '2025-26',
    employeeId: 'STU-007',
    departmentName: 'Science (PCM)',
    rollNumber: '07',
    className: '11',
    sectionName: 'A',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science']
};

export const HOD_DEPT_STATS: DeptSummaryStats = {
    totalStaff: 8,
    presentToday: 7,
    totalStudents: 312,
    activeClasses: 6,
    inventoryItems: 148,
    upcomingExams: 2,
    staffAttendancePercent: 87.5,
    avgStudentScore: 74,
    syllabusCoverage: 68
};

export const STUDENT_SEMESTER_STATS = {
    attendancePercent: 87,
    assignmentsDone: 10,
    assignmentsTotal: 12,
    avgScore: 82,
    syllabusCoverage: 71,
    overallGrade: 'A–'
};
