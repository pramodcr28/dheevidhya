export interface IExaminationSubject {
    name: string;
    id: string;
    departmentName: string;
    sectionName: string;
    className: string;
}

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
    CANCELLED = 'CANCELLED',
    RE_SCHEDULED = 'RE_SCHEDULED'
}

export interface ExaminationDTO {
    examId?: string;
    status: ExamStatus;
    academicYear: string;
    departmentId: string;
    branchId: string;
    examType: ExamType;
    resultDeclarationDate?: string;
    subjects: IExaminationSubject[];
    timeTable: ExaminationTimeTable;
    totalMarks: number;
}
export interface ExaminationTimeSlot {
    startTime: string;
    endTime: string;
    breakDuration: number;
    subjectName: string;
    day: string;
    color: string;
}
export interface ExaminationTimeSlotSettings {
    startDate: Date | any;
    endDate: Date | any;
    dayStartTime: Date; // New property
    dayEndTime: Date;
    slotDuration: number;
    slotsPerDay: number;
    breakDuration: number;
}
export interface ExaminationTimeTable {
    settings: ExaminationTimeSlotSettings;
    schedules: ExaminationTimeSlot[];
}

// Label mappings
export const ExamTypeLabels: Record<ExamType, string> = {
    [ExamType.UNIT_TEST]: 'Unit Test',
    [ExamType.SEMISTER_EXAM]: 'Semester Exam',
    [ExamType.MID_TERM]: 'Mid Term',
    [ExamType.PRE_FINAL]: 'Pre Final',
    [ExamType.FINAL]: 'Final Exam',
    [ExamType.PRACTICAL]: 'Practical Exam',
    [ExamType.INTERNAL]: 'Internal Assessment',
    [ExamType.SUPPLEMENTARY]: 'Supplementary Exam',
    [ExamType.RE_EXAM]: 'Re-exam'
};

export const ExamStatusLabels: Record<ExamStatus, string> = {
    [ExamStatus.DRAFT]: 'Draft',
    [ExamStatus.SCHEDULED]: 'Scheduled',
    [ExamStatus.RESCHEDULED]: 'Rescheduled',
    [ExamStatus.ONGOING]: 'Ongoing',
    [ExamStatus.RESULT_DECLARED]: 'Results Declared',
    [ExamStatus.CANCELLED]: 'Cancelled',
    [ExamStatus.RE_SCHEDULED]: 'RE_SCHEDULED'
};

// upload result entity

export interface ExamResultDTO {
    examId: string;
    status?: ExamStatus;
    sendNotification: Boolean;
    students?: StudentResult[];
}

export interface StudentResult {
    userId: string;
    fullName: string;
    academicYear: string;
    examResults: ExamResult[];
}

export interface ExamResult {
    id?: string;
    examId: string;
    studentId: string;
    subjectId: string;
    subjectName: string;
    obtainedMarks: number | null;
    totalMarks: number;
    notes?: string;
    resultDeclaredAt?: Date;
}

//  reports related result

export interface ExamReport {
    results: ResultData[];
    stats: ExamStats;
}
export interface ResultData {
    studentId: string;
    studentName: string;
    className: string;
    section: string;
    subjects: SubjectResult[];
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: string;
    status: 'PASS' | 'FAIL';
}

interface SubjectResult {
    subjectId: string;
    subjectName: string;
    maxMarks: number;
    obtainedMarks: number;
    grade: string;
}

interface ExamStats {
    totalStudents: number;
    passedStudents: number;
    failedStudents: number;
    notFoundStudents: number;
    averagePercentage: number;
    highestScore: number;
    lowestScore: number;
}
