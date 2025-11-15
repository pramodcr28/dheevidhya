import { ExamType } from './examination.model';

// ========================= Enums =========================
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

export enum Status {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED'
}

// ========================= Notice Model =========================
export interface Notice {
    id: string;

    academicYear: string;
    categoryType: CategoryType;
    title: string;
    content: string;

    // createdBy: string;
    // createdAt: string;  // ISO string for Instant
    // updatedBy: string;
    // updatedAt: string;

    priority: Priority;
    status: Status;
    publishedAt: string; // ISO string

    targetAudience: Target; // You’ll define Target separately
    attachments?: Array<Record<string, any>>; // JSON style

    // Type-specific details
    timetable?: TimetableDetails;
    attendance?: AttendanceDetails;
    examAnnouncement?: ExamAnnouncementDetails;
    examResult?: ExamResultDetails;
    fest?: FestDetails;
    holiday?: HolidayDetails;
    meeting?: MeetingDetails;
    appreciation?: AppreciationDetails;
    schoolAchievement?: SchoolAchievementDetails;
    branchId?: number;
}

// ========================= Detail Models =========================
export interface TimetableDetails {
    effectiveDate: string; // LocalDate as ISO string
}

export interface SchoolAchievementDetails {
    achievementCategory: 'Academic' | 'Infrastructure' | 'Awards' | 'Recognition';
    achievementDate: string;
    recipientIds: string[];
}

export interface MeetingDetails {
    meetingType: 'PTM' | 'Individual' | 'Emergency' | 'Progress' | 'Staff';
    meetingDate: string;
    meetingTime: string;
    venue: string;
}

export interface HolidayDetails {
    holidayType: 'Emergency' | 'Government' | 'Weather' | 'Week_off' | 'Festival';
    holidayStartDate: string;
    holidayEndDate: string;
    weekOffDay?: string; // e.g., "Saturday", "Sunday"
}

export interface FestDetails {
    festName: string;
    festType: 'Cultural' | 'Sports' | 'Science' | 'Literary';
    eventStartDate: string;
    eventEndDate: string;
    venue: string;
}

export interface ExamResultDetails {
    examTitle: string;
    examType: string;
    resultDeclarationDate: string;
}

export interface ExamAnnouncementDetails {
    examTitle: string;
    examType: ExamType;
    examStartDate: string;
    examEndDate: string;
}

export interface AttendanceDetails {
    attendancePercentage: number;
    attendanceType: 'Low' | 'Absent' | 'Improvement';
    parentMeetingRequired: boolean;
}

export interface AppreciationDetails {
    recipientIds: string[];
    achievementCategory: 'Academic' | 'Sports' | 'Cultural' | 'Social';
    recognitionLevel: 'School' | 'District' | 'State' | 'National';
}

// ========================= Example Target Audience =========================
// Assuming targetAudience has type + targetIds
export interface Target {
    type: TargetType;
    targetIds: string[];
}
export enum TargetType {
    ALL = 'ALL',
    DEPARTMENT = 'DEPARTMENT',
    CLASS = 'CLASS',
    SECTION = 'SECTION',
    STUDENT = 'STUDENT',
    STAFF = 'STAFF',
    PARENT = 'PARENT',
    ROLE = 'ROLE'
}

// ========================= Attachment Model =========================
export interface Attachment {
    name: any;
    url: any;
    id?: string; // Optional unique ID (UUID or DB ID)
    fileName: string; // Name of the file
    fileType: string; // MIME type (e.g., "application/pdf", "image/png")
    fileSize: number; // File size in bytes
    uploadedAt: string; // ISO date-time string when uploaded
    uploadedBy: string; // User ID or name who uploaded
    downloadUrl?: string; // Pre-signed URL or API path to download
    previewUrl?: string; // Optional preview link (for images/docs)
    metadata?: Record<string, any>; // Additional metadata (tags, custom info)
}
