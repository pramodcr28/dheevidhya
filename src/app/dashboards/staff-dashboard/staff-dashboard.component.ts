import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { Router } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../core/services/common.service';
import { DashboardService, StaffDashboardResponse } from '../../pages/service/dashboard.service';

@Component({
    selector: 'app-staff-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, TagModule, TabViewModule, DividerModule, BadgeModule, TooltipModule, ChartModule, SkeletonModule],
    templateUrl: './staff-dashboard.component.html'
})
export class StaffDashboardComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    data: StaffDashboardResponse | null = null;
    loading = true;
    error: string | null = null;

    attChartData: any;
    attChartOptions: any;

    get upcomingExams() {
        return (this.data?.exams ?? []).filter((e) => e.status === 'SCHEDULED' || e.status === 'DRAFT');
    }
    get ongoingExams() {
        return (this.data?.exams ?? []).filter((e) => e.status === 'ONGOING');
    }
    get pastExams() {
        return (this.data?.exams ?? []).filter((e) => e.status === 'RESULT_DECLARED' || e.status === 'CANCELLED');
    }

    get subjects() {
        return this.commonService?.associatedSubjects?.filter((s) => this.data?.profile?.subjects?.includes(s.id)) ?? [];
    }

    router = inject(Router);
    commonService = inject(CommonService);
    dashboardService = inject(DashboardService);

    ngOnInit(): void {
        const staffId = this.commonService.currentUser?.userId;
        const academicYear = this.commonService.currentUser.academicYear;

        this.dashboardService
            .getStaffDashboard(staffId, this.commonService.associatedDepartments?.[0]?.id, academicYear)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.data = res;
                    this.loading = false;
                    this.buildAttChart();
                },
                error: (err) => {
                    this.error = 'Failed to load dashboard.';
                    this.loading = false;
                    console.error('Staff dashboard error:', err);
                }
            });
    }

    get todayDateLabel(): string {
        return new Date().toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short'
        });
    }

    get currentTimeLabel(): string {
        const now = new Date();
        let h = now.getHours();
        const m = now.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 === 0 ? 12 : h % 12;
        return `${h}:${m} ${ampm}`;
    }

    get currentPeriod() {
        return this.data?.timetableToday?.find((p: any) => p.current);
    }

    formatTime(time: string): string {
        const [hStr, mStr] = time.split(':');
        let h = parseInt(hStr, 10);
        const m = mStr.padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 === 0 ? 12 : h % 12;
        return `${h}:${m} ${ampm}`;
    }

    getPeriodProgress(p: any): number {
        const now = new Date();
        const [sh, sm] = p.startTime.split(':').map(Number);
        const [eh, em] = p.endTime.split(':').map(Number);
        const start = new Date();
        start.setHours(sh, sm, 0, 0);
        const end = new Date();
        end.setHours(eh, em, 0, 0);
        const total = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
    }

    getRemainingTime(p: any): string {
        const now = new Date();
        const [h, m] = p.endTime.split(':').map(Number);
        const end = new Date();
        end.setHours(h, m, 0, 0);
        const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 60000));
        return diff > 0 ? `${diff} min` : 'Ending soon';
    }

    formatClassName(name: string): string {
        const map: Record<string, string> = {
            FIRST_STANDARD: '1st',
            SECOND_STANDARD: '2nd',
            THIRD_STANDARD: '3rd',
            FOURTH_STANDARD: '4th',
            FIFTH_STANDARD: '5th',
            SIXTH_STANDARD: '6th',
            SEVENTH_STANDARD: '7th',
            EIGHTH_STANDARD: '8th',
            NINTH_STANDARD: '9th',
            TENTH_STANDARD: '10th'
        };
        return map[name] ?? name;
    }

    formatSection(name: string): string {
        return name?.replace('SECTION_', '') ?? name;
    }

    getSubjectEmoji(subject: string): string {
        const map: Record<string, string> = {
            KANNADA: '🅺',
            ENGLISH: '📖',
            MATHS: '📐',
            MATH: '📐',
            SCIENCE: '🔬',
            SOCIAL: '🌍',
            HINDI: '🇮🇳',
            PE: '⚽',
            ART: '🎨',
            MUSIC: '🎵',
            COMPUTER: '💻',
            SANSKRIT: '📜',
            PHYSICS: '⚛️',
            CHEMISTRY: '🧪',
            BIOLOGY: '🧬'
        };
        return map[subject?.toUpperCase()] ?? '📚';
    }

    getSubjectColor(subject: any): { bar: string; bg: string; badge: string } {
        const map: Record<string, { bar: string; bg: string; badge: string }> = {
            KANNADA: { bar: 'bg-orange-400', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700' },
            ENGLISH: { bar: 'bg-blue-400', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
            MATHS: { bar: 'bg-violet-400', bg: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700' },
            MATH: { bar: 'bg-violet-400', bg: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700' },
            SCIENCE: { bar: 'bg-emerald-400', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
            SOCIAL: { bar: 'bg-amber-400', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
            HINDI: { bar: 'bg-rose-400', bg: 'bg-rose-50', badge: 'bg-rose-100 text-rose-700' },
            PE: { bar: 'bg-lime-400', bg: 'bg-lime-50', badge: 'bg-lime-100 text-lime-700' },
            COMPUTER: { bar: 'bg-cyan-400', bg: 'bg-cyan-50', badge: 'bg-cyan-100 text-cyan-700' },
            PHYSICS: { bar: 'bg-indigo-400', bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700' },
            CHEMISTRY: { bar: 'bg-pink-400', bg: 'bg-pink-50', badge: 'bg-pink-100 text-pink-700' },
            BIOLOGY: { bar: 'bg-teal-400', bg: 'bg-teal-50', badge: 'bg-teal-100 text-teal-700' },
            SANSKRIT: { bar: 'bg-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700' }
        };

        const key = subject;
        return map[key] ?? { bar: 'bg-gray-300', bg: 'bg-gray-50', badge: 'bg-gray-100 ' };
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    buildAttChart(): void {
        const a = this.data?.classAttendance;
        if (!a) return;
        this.attChartData = {
            datasets: [
                {
                    data: [a.present, a.absent, a.late],
                    backgroundColor: ['#22C55E', '#EF4444', '#F59E0B'],
                    borderWidth: 0,
                    hoverOffset: 4
                }
            ]
        };
        this.attChartOptions = {
            cutout: '72%',
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            responsive: true,
            maintainAspectRatio: false
        };
    }

    getExamDate(d: string) {
        const dt = new Date(d);
        return { day: dt.getDate().toString(), month: dt.toLocaleString('default', { month: 'short' }).toUpperCase() };
    }
    getDaysUntil(d: string) {
        const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
        return diff <= 0 ? 'Today' : `${diff}d`;
    }
    getAttPercent() {
        const a = this.data?.classAttendance;
        return a ? Math.round((a.present / (a.totalStudents || 1)) * 100) : 0;
    }

    getExamStatusClass(s: string) {
        const m: Record<string, string> = {
            SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
            DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
            ONGOING: 'bg-green-50 text-green-700 border-green-200',
            CANCELLED: 'bg-red-50 text-red-700 border-red-200'
        };
        return m[s] ?? 'bg-gray-50  border-gray-200';
    }

    getAssignmentStatusClass(s: string) {
        const m: Record<string, string> = {
            PUBLISHED: 'bg-amber-50 text-amber-700 border-amber-200',
            ONGOING: 'bg-blue-50 text-blue-700 border-blue-200',
            COMPLETED: 'bg-green-50 text-green-700 border-green-200',
            OVERDUE: 'bg-red-50 text-red-700 border-red-200',
            DRAFT: 'bg-gray-50  border-gray-200'
        };
        return m[s] ?? 'bg-gray-50  border-gray-200';
    }

    getNoticeDotClass(p: string) {
        return p === 'HIGH' ? 'bg-red-500' : p === 'MEDIUM' ? 'bg-amber-400' : 'bg-blue-400';
    }

    viewAllAssignments() {
        this.router.navigate(['./assignment']);
    }

    viewAllNotifications() {
        this.router.navigate(['./notice-board']);
    }
    viewAllExams() {
        this.router.navigate(['./examination']);
    }

    getNoticeBadgeClass(priority: string): string {
        const map: Record<string, string> = {
            HIGH: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
            MEDIUM: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
            LOW: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
        };
        return map[priority] ?? 'bg-gray-100  dark:bg-gray-800 ';
    }
}
