import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { CommonService } from '../../../core/services/common.service';
import { Notice } from '../../models/notification.model';

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

    // ── Category metadata ─────────────────────────────────────────

    private categories = [
        { value: 'GENERAL', label: 'General', icon: 'pi pi-bell', bg: 'bg-yellow-50 dark:bg-yellow-500/10', color: 'text-yellow-600 dark:text-yellow-400', gradient: 'bg-gradient-to-br from-yellow-400 to-amber-600' },
        { value: 'TIMETABLE', label: 'Time Table', icon: 'pi pi-calendar', bg: 'bg-blue-50 dark:bg-blue-500/10', color: 'text-blue-600 dark:text-blue-400', gradient: 'bg-gradient-to-br from-blue-500 to-blue-700' },
        { value: 'MEETING', label: 'Meeting', icon: 'pi pi-users', bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400', gradient: 'bg-gradient-to-br from-emerald-400 to-emerald-700' },
        { value: 'ATTENDANCE', label: 'Attendance', icon: 'pi pi-check-circle', bg: 'bg-orange-50 dark:bg-orange-500/10', color: 'text-orange-600 dark:text-orange-400', gradient: 'bg-gradient-to-br from-orange-400 to-orange-600' },
        { value: 'EXAM_ANNOUNCEMENT', label: 'Exam Announcement', icon: 'pi pi-file-edit', bg: 'bg-red-50 dark:bg-red-500/10', color: 'text-red-600 dark:text-red-400', gradient: 'bg-gradient-to-br from-red-500 to-red-700' },
        { value: 'EXAM_RESULT', label: 'Exam Result', icon: 'pi pi-trophy', bg: 'bg-green-50 dark:bg-green-500/10', color: 'text-green-600 dark:text-green-400', gradient: 'bg-gradient-to-br from-green-500 to-green-700' },
        { value: 'FEST', label: 'Festival', icon: 'pi pi-heart', bg: 'bg-purple-50 dark:bg-purple-500/10', color: 'text-purple-600 dark:text-purple-400', gradient: 'bg-gradient-to-br from-purple-500 to-violet-700' },
        { value: 'HOLIDAY', label: 'Holiday', icon: 'pi pi-sun', bg: 'bg-amber-50 dark:bg-amber-500/10', color: 'text-amber-600 dark:text-amber-400', gradient: 'bg-gradient-to-br from-amber-400 to-amber-700' },
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
        return this.cat(type)?.color ?? 'text-gray-500';
    }
    getCategoryGradient(type: string) {
        return this.cat(type)?.gradient ?? 'bg-gradient-to-br from-indigo-500 to-indigo-700';
    }

    // ── Priority helpers ──────────────────────────────────────────

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
                return 'text-gray-500';
        }
    }

    // ── Date helpers ──────────────────────────────────────────────

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
