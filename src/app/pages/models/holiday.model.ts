export type HolidayType = 'EMERGENCY' | 'GOVERNMENT' | 'WEATHER' | 'WEEK_OFF' | 'FESTIVAL';

export type WeekDay = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export type ApprovalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface Target {
    type: string;
    targetIds?: string[];
}

export type WeekOccurrence = 'ALL' | 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'FIFTH';

export interface Holiday {
    id?: string;
    title: string;
    description?: string;
    holidayType: HolidayType;
    startDate?: string;
    endDate?: string;
    weekOffDay?: WeekDay;
    targetAudience?: Target;
    approvalStatus: ApprovalStatus;
    rejectionReason?: string;
    appliestoWeek: WeekOccurrence[];
    approvedBy?: string;
    approvedAt?: string;
    branchId?: number;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
}

export interface HolidayDTO {
    id?: string;
    title: string;
    description?: string;
    holidayType: HolidayType;
    startDate?: string;
    endDate?: string;
    weekOffDay?: WeekDay;
    appliestoWeek: WeekOccurrence[];
    targetAudience?: Target;
}

export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
    EMERGENCY: 'Emergency',
    GOVERNMENT: 'Government',
    WEATHER: 'Weather',
    WEEK_OFF: 'Weekly Off',
    FESTIVAL: 'Festival'
};

export const HOLIDAY_TYPE_COLORS: Record<HolidayType, string> = {
    EMERGENCY: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    GOVERNMENT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    WEATHER: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    WEEK_OFF: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    FESTIVAL: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
};

export const HOLIDAY_TYPE_ICONS: Record<HolidayType, string> = {
    EMERGENCY: 'pi pi-exclamation-triangle',
    GOVERNMENT: 'pi pi-flag-fill',
    WEATHER: 'pi pi-cloud',
    WEEK_OFF: 'pi pi-calendar-clock',
    FESTIVAL: 'pi pi-star-fill'
};

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
    PENDING_APPROVAL: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    REJECTED: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
};

export const APPROVAL_DOT_COLORS: Record<ApprovalStatus, string> = {
    DRAFT: 'bg-gray-400',
    PENDING_APPROVAL: 'bg-amber-500',
    APPROVED: 'bg-emerald-500',
    REJECTED: 'bg-red-500'
};
