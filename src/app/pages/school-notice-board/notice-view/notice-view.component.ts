import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { CommonService } from '../../../core/services/common.service';
import { Notice } from '../../models/notification.model';

interface KeyDetailItem {
    label: string;
    value: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    badge?: string;
    badgeClass?: string;
}

@Component({
    selector: 'app-notice-view',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule, TagModule],
    templateUrl: './notice-view.component.html',
    styles: []
})
export class NoticeViewComponent {
    @Input() visible = false;
    @Input() notice: Notice | null = null;
    @Output() close = new EventEmitter<void>();

    commonService = inject(CommonService);

    get isStudent(): boolean {
        return this.commonService.getUserAuthorities.includes('STUDENT');
    }

    onClose() {
        this.visible = false;
        this.close.emit();
    }

    /**
     * Returns a list of important key detail rows based on the notice category type.
     * Each row has label, value, icon styling, and optional badge.
     */
    getKeyDetails(notice: Notice): KeyDetailItem[] {
        const items: KeyDetailItem[] = [];

        switch (notice.categoryType) {
            case 'MEETING': {
                const m = notice.meeting;
                if (!m) break;
                if (m.meetingDate) {
                    items.push({
                        label: 'Meeting Date',
                        value: this.formatDate(m.meetingDate),
                        icon: 'pi pi-calendar',
                        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
                        iconColor: 'text-emerald-600 dark:text-emerald-400'
                    });
                }
                if (m.meetingTime) {
                    items.push({
                        label: 'Meeting Time',
                        value: m.meetingTime,
                        icon: 'pi pi-clock',
                        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
                        iconColor: 'text-emerald-600 dark:text-emerald-400'
                    });
                }
                if (m.venue) {
                    items.push({
                        label: 'Venue',
                        value: m.venue,
                        icon: 'pi pi-map-marker',
                        iconBg: 'bg-blue-50 dark:bg-blue-500/10',
                        iconColor: 'text-blue-500 dark:text-blue-400'
                    });
                }
                if (m.meetingType) {
                    items.push({
                        label: 'Meeting Type',
                        value: m.meetingType,
                        icon: 'pi pi-users',
                        iconBg: 'bg-gray-100 dark:bg-gray-700',
                        iconColor: ' ',
                        badge: m.meetingType,
                        badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    });
                }
                break;
            }

            case 'EXAM_ANNOUNCEMENT': {
                const e = notice.examAnnouncement;
                if (!e) break;
                if (e.examTitle) {
                    items.push({
                        label: 'Exam Title',
                        value: e.examTitle,
                        icon: 'pi pi-file-edit',
                        iconBg: 'bg-red-50 dark:bg-red-500/10',
                        iconColor: 'text-red-500 dark:text-red-400'
                    });
                }
                if (e.examStartDate) {
                    items.push({
                        label: 'Exam Start Date',
                        value: this.formatDate(e.examStartDate),
                        icon: 'pi pi-calendar',
                        iconBg: 'bg-red-50 dark:bg-red-500/10',
                        iconColor: 'text-red-500 dark:text-red-400'
                    });
                }
                if (e.examEndDate) {
                    items.push({
                        label: 'Exam End Date',
                        value: this.formatDate(e.examEndDate),
                        icon: 'pi pi-calendar-times',
                        iconBg: 'bg-orange-50 dark:bg-orange-500/10',
                        iconColor: 'text-orange-500 dark:text-orange-400'
                    });
                }
                if (e.examType) {
                    items.push({
                        label: 'Exam Type',
                        value: String(e.examType),
                        icon: 'pi pi-tag',
                        iconBg: 'bg-gray-100 dark:bg-gray-700',
                        iconColor: ' ',
                        badge: String(e.examType),
                        badgeClass: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                    });
                }
                break;
            }

            case 'EXAM_RESULT': {
                const r = notice.examResult;
                if (!r) break;
                if (r.examTitle) {
                    items.push({
                        label: 'Exam Title',
                        value: r.examTitle,
                        icon: 'pi pi-trophy',
                        iconBg: 'bg-green-50 dark:bg-green-500/10',
                        iconColor: 'text-green-600 dark:text-green-400'
                    });
                }
                if (r.resultDeclarationDate) {
                    items.push({
                        label: 'Result Date',
                        value: this.formatDate(r.resultDeclarationDate),
                        icon: 'pi pi-calendar-plus',
                        iconBg: 'bg-green-50 dark:bg-green-500/10',
                        iconColor: 'text-green-600 dark:text-green-400'
                    });
                }
                if (r.examType) {
                    items.push({
                        label: 'Exam Type',
                        value: r.examType,
                        icon: 'pi pi-tag',
                        iconBg: 'bg-gray-100 dark:bg-gray-700',
                        iconColor: ' ',
                        badge: r.examType,
                        badgeClass: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                    });
                }
                break;
            }

            case 'FEST': {
                const f = notice.fest;
                if (!f) break;
                if (f.festName) {
                    items.push({
                        label: 'Fest Name',
                        value: f.festName,
                        icon: 'pi pi-heart',
                        iconBg: 'bg-purple-50 dark:bg-purple-500/10',
                        iconColor: 'text-purple-600 dark:text-purple-400'
                    });
                }
                if (f.eventStartDate) {
                    items.push({
                        label: 'Start Date',
                        value: this.formatDate(f.eventStartDate),
                        icon: 'pi pi-calendar',
                        iconBg: 'bg-purple-50 dark:bg-purple-500/10',
                        iconColor: 'text-purple-600 dark:text-purple-400'
                    });
                }
                if (f.eventEndDate) {
                    items.push({
                        label: 'End Date',
                        value: this.formatDate(f.eventEndDate),
                        icon: 'pi pi-calendar-times',
                        iconBg: 'bg-violet-50 dark:bg-violet-500/10',
                        iconColor: 'text-violet-600 dark:text-violet-400'
                    });
                }
                if (f.venue) {
                    items.push({
                        label: 'Venue',
                        value: f.venue,
                        icon: 'pi pi-map-marker',
                        iconBg: 'bg-blue-50 dark:bg-blue-500/10',
                        iconColor: 'text-blue-500 dark:text-blue-400'
                    });
                }
                if (f.festType) {
                    items.push({
                        label: 'Fest Type',
                        value: f.festType,
                        icon: 'pi pi-tag',
                        iconBg: 'bg-gray-100 dark:bg-gray-700',
                        iconColor: ' ',
                        badge: f.festType,
                        badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                    });
                }
                break;
            }

            case 'TIMETABLE': {
                const t = notice.timetable;
                if (!t) break;
                if (t.effectiveDate) {
                    items.push({
                        label: 'Effective Date',
                        value: this.formatDate(t.effectiveDate),
                        icon: 'pi pi-calendar',
                        iconBg: 'bg-blue-50 dark:bg-blue-500/10',
                        iconColor: 'text-blue-600 dark:text-blue-400'
                    });
                }
                break;
            }

            case 'ATTENDANCE': {
                const a = notice.attendance;
                if (!a) break;
                if (a.attendancePercentage != null) {
                    items.push({
                        label: 'Attendance %',
                        value: `${a.attendancePercentage}%`,
                        icon: 'pi pi-chart-bar',
                        iconBg: 'bg-orange-50 dark:bg-orange-500/10',
                        iconColor: 'text-orange-600 dark:text-orange-400',
                        badge: a.attendancePercentage < 75 ? 'Below 75%' : 'Adequate',
                        badgeClass: a.attendancePercentage < 75 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                    });
                }
                if (a.attendanceType) {
                    items.push({
                        label: 'Attendance Type',
                        value: a.attendanceType,
                        icon: 'pi pi-check-circle',
                        iconBg: 'bg-orange-50 dark:bg-orange-500/10',
                        iconColor: 'text-orange-600 dark:text-orange-400',
                        badge: a.attendanceType,
                        badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
                    });
                }
                if (a.parentMeetingRequired != null) {
                    items.push({
                        label: 'Parent Meeting',
                        value: a.parentMeetingRequired ? 'Required' : 'Not Required',
                        icon: 'pi pi-users',
                        iconBg: a.parentMeetingRequired ? 'bg-red-50 dark:bg-red-500/10' : 'bg-gray-100 dark:bg-gray-700',
                        iconColor: a.parentMeetingRequired ? 'text-red-500 dark:text-red-400' : ' ',
                        badge: a.parentMeetingRequired ? 'Required' : undefined,
                        badgeClass: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                    });
                }
                break;
            }

            case 'APPRECIATION': {
                const ap = notice.appreciation;
                if (!ap) break;
                if (ap.achievementCategory) {
                    items.push({
                        label: 'Achievement Category',
                        value: ap.achievementCategory,
                        icon: 'pi pi-star',
                        iconBg: 'bg-pink-50 dark:bg-pink-500/10',
                        iconColor: 'text-pink-600 dark:text-pink-400',
                        badge: ap.achievementCategory,
                        badgeClass: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300'
                    });
                }
                if (ap.recognitionLevel) {
                    items.push({
                        label: 'Recognition Level',
                        value: ap.recognitionLevel,
                        icon: 'pi pi-trophy',
                        iconBg: 'bg-rose-50 dark:bg-rose-500/10',
                        iconColor: 'text-rose-600 dark:text-rose-400',
                        badge: ap.recognitionLevel,
                        badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                    });
                }
                break;
            }

            case 'SCHOOL_ACHIEVEMENT': {
                const sa = notice.schoolAchievement;
                if (!sa) break;
                if (sa.achievementCategory) {
                    items.push({
                        label: 'Achievement Category',
                        value: sa.achievementCategory,
                        icon: 'pi pi-trophy',
                        iconBg: 'bg-teal-50 dark:bg-teal-500/10',
                        iconColor: 'text-teal-600 dark:text-teal-400',
                        badge: sa.achievementCategory,
                        badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300'
                    });
                }
                if (sa.achievementDate) {
                    items.push({
                        label: 'Achievement Date',
                        value: this.formatDate(sa.achievementDate),
                        icon: 'pi pi-calendar',
                        iconBg: 'bg-teal-50 dark:bg-teal-500/10',
                        iconColor: 'text-teal-600 dark:text-teal-400'
                    });
                }
                break;
            }

            default:
                break;
        }

        return items;
    }

    private categories = [
        { value: 'GENERAL', label: 'General', icon: 'pi pi-bell', bg: 'bg-yellow-50 dark:bg-yellow-500/10', color: 'text-yellow-600 dark:text-yellow-400', gradient: 'bg-gradient-to-br from-yellow-400 to-amber-600' },
        { value: 'TIMETABLE', label: 'Time Table', icon: 'pi pi-calendar', bg: 'bg-blue-50 dark:bg-blue-500/10', color: 'text-blue-600 dark:text-blue-400', gradient: 'bg-gradient-to-br from-blue-500 to-blue-700' },
        { value: 'MEETING', label: 'Meeting', icon: 'pi pi-users', bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400', gradient: 'bg-gradient-to-br from-emerald-400 to-emerald-700' },
        { value: 'ATTENDANCE', label: 'Attendance', icon: 'pi pi-check-circle', bg: 'bg-orange-50 dark:bg-orange-500/10', color: 'text-orange-600 dark:text-orange-400', gradient: 'bg-gradient-to-br from-orange-400 to-orange-600' },
        { value: 'EXAM_ANNOUNCEMENT', label: 'Exam Announcement', icon: 'pi pi-file-edit', bg: 'bg-red-50 dark:bg-red-500/10', color: 'text-red-600 dark:text-red-400', gradient: 'bg-gradient-to-br from-red-500 to-red-700' },
        { value: 'EXAM_RESULT', label: 'Exam Result', icon: 'pi pi-trophy', bg: 'bg-green-50 dark:bg-green-500/10', color: 'text-green-600 dark:text-green-400', gradient: 'bg-gradient-to-br from-green-500 to-green-700' },
        { value: 'FEST', label: 'Festival', icon: 'pi pi-heart', bg: 'bg-purple-50 dark:bg-purple-500/10', color: 'text-purple-600 dark:text-purple-400', gradient: 'bg-gradient-to-br from-purple-500 to-violet-700' },
        { value: 'APPRECIATION', label: 'Appreciation', icon: 'pi pi-star', bg: 'bg-pink-50 dark:bg-pink-500/10', color: 'text-pink-600 dark:text-pink-400', gradient: 'bg-gradient-to-br from-pink-500 to-rose-600' },
        { value: 'SCHOOL_ACHIEVEMENT', label: 'School Achievement', icon: 'pi pi-trophy', bg: 'bg-teal-50 dark:bg-teal-500/10', color: 'text-teal-600 dark:text-teal-400', gradient: 'bg-gradient-to-br from-teal-400 to-teal-700' }
    ];

    private cat(type: string) {
        return this.categories.find((c) => c.value === type);
    }

    getCategoryLabel(type: string) {
        return this.cat(type)?.label ?? type;
    }
    getCategoryIcon(type: string) {
        return this.cat(type)?.icon ?? 'pi pi-file';
    }
    getCategoryIconBg(type: string) {
        return this.cat(type)?.bg ?? 'bg-gray-100 dark:bg-gray-700';
    }
    getCategoryIconColor(type: string) {
        return this.cat(type)?.color ?? '';
    }
    getCategoryGradient(type: string) {
        return this.cat(type)?.gradient ?? 'bg-gradient-to-br from-indigo-500 to-indigo-700';
    }

    getPrioritySeverity(priority: string): 'success' | 'warn' | 'danger' | 'info' {
        switch (priority?.toUpperCase()) {
            case 'HIGH':
                return 'danger';
            case 'MEDIUM':
                return 'warn';
            case 'LOW':
                return 'success';
            default:
                return 'info';
        }
    }

    getPriorityIconBg(priority: string): string {
        switch (priority?.toUpperCase()) {
            case 'HIGH':
                return 'bg-red-50 dark:bg-red-500/10';
            case 'MEDIUM':
                return 'bg-amber-50 dark:bg-amber-500/10';
            case 'LOW':
                return 'bg-green-50 dark:bg-green-500/10';
            default:
                return 'bg-gray-100 dark:bg-gray-700';
        }
    }

    getPriorityIconColor(priority: string): string {
        switch (priority?.toUpperCase()) {
            case 'HIGH':
                return 'text-red-500 dark:text-red-400';
            case 'MEDIUM':
                return 'text-amber-500 dark:text-amber-400';
            case 'LOW':
                return 'text-green-500 dark:text-green-400';
            default:
                return '';
        }
    }

    formatDate(dateString: string | null | undefined): string {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    formatTime(dateString: string | null | undefined): string {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
}
