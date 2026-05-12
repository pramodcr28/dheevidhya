import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ITEMS_PER_PAGE } from '../../../core/model/pagination.constants';
import { CommonService } from '../../../core/services/common.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getStudentSectionByIds } from '../../../core/store/user-profile/user-profile.selectors';
import { ExamStatusLabels, ExamTypeLabels } from '../../models/examination.model';
import { ExaminationService } from '../../service/examination.service';

interface FilterTab {
    label: string;
    value: 'Scheduled' | 'Ongoing' | 'Completed';
    icon: string;
}

@Component({
    selector: 'app-student-exams',
    standalone: true,
    imports: [NgClass],
    templateUrl: './student-exams.component.html'
})
export class StudentExamsComponent implements OnInit {
    exams: any[] = [];
    filteredExams: any[] = [];
    selectedFilter: 'Scheduled' | 'Ongoing' | 'Completed' = 'Scheduled';

    filterTabs: FilterTab[] = [
        { label: 'Scheduled', value: 'Scheduled', icon: 'pi pi-clock' },
        { label: 'Ongoing', value: 'Ongoing', icon: 'pi pi-play-circle' },
        { label: 'Completed', value: 'Completed', icon: 'pi pi-check-circle' }
    ];

    private examTypeLabels: { [key: string]: string } = ExamTypeLabels as any;
    private examStatusLabels: { [key: string]: string } = ExamStatusLabels as any;

    commonService: CommonService = inject(CommonService);
    examinationService = inject(ExaminationService);
    store = inject(Store<{ userProfile: UserProfileState }>);
    loader = inject(ApiLoaderService);

    examinationIds: any[] = [];
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 0;
    sortField = 'createdDate';
    sortOrder: 'ASC' | 'DESC' = 'DESC';

    // ── Dot colour palette for subject rows ──────────────────────────────────────
    private readonly dotColors: string[] = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-teal-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-pink-500'];

    ngOnInit(): void {
        this.store.select(getStudentSectionByIds(this.commonService.getStudentInfo.departmentId, this.commonService.getStudentInfo.classId, this.commonService.getStudentInfo.sectionId)).subscribe((s) => {
            const examMap = new Map<string, any>();
            s?.subjects?.forEach((subject: any) => {
                subject?.exams?.forEach((exam: any) => {
                    if (!examMap.has(exam.examId)) examMap.set(exam.examId, exam);
                });
            });
            this.examinationIds = Array.from(examMap.values());
            this.getExams();
        });
    }

    getExams(): void {
        this.loader.show('Fetching Exams List');
        const filterParams: any = this.commonService.isStudent ? { 'examId.in': this.examinationIds.map((e) => e.examId) } : { 'branchId.eq': this.commonService.branch?.id?.toString() };

        this.examinationService.search(this.page, this.itemsPerPage, this.sortField, this.sortOrder, filterParams).subscribe((res) => {
            this.exams = res.content;
            this.totalItems = res.totalElements;
            this.loader.hide();
            this.filterExams();
        });
    }

    filterExams(): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // DRAFT = 'DRAFT',
        // SCHEDULED = 'SCHEDULED',
        // RESCHEDULED = 'RESCHEDULED',
        // ONGOING = 'ONGOING',
        // RESULT_DECLARED = 'RESULT_DECLARED',
        // CANCELLED = 'CANCELLED',
        // RE_SCHEDULED = 'RE_SCHEDULED'
        switch (this.selectedFilter) {
            case 'Scheduled':
                this.filteredExams = this.exams.filter((exam) => {
                    return exam.status.toUpperCase() === 'SCHEDULED' || exam.status.toUpperCase() === 'RE_SCHEDULED';
                });
                break;
            case 'Ongoing':
                this.filteredExams = this.exams.filter((exam) => {
                    return exam.status.toUpperCase() === 'ONGOING';
                });
                break;
            case 'Completed':
                this.filteredExams = this.exams.filter((exam) => {
                    return exam.status.toUpperCase() === 'COMPLETED' || exam.status.toUpperCase() === 'CANCELLED' || exam.status.toUpperCase() === 'RESULT_DECLARED';
                });
                break;
            default:
                this.filteredExams = [...this.exams];
        }
    }

    setFilter(filter: 'Scheduled' | 'Ongoing' | 'Completed'): void {
        this.selectedFilter = filter;
        this.filterExams();
    }

    getFilterCount(filter: 'Scheduled' | 'Ongoing' | 'Completed'): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        switch (filter) {
            case 'Scheduled':
                return this.exams.filter((e) => e.status === 'SCHEDULED' || e.status === 'RE_SCHEDULED').length;
            case 'Ongoing':
                return this.exams.filter((e) => e.status === 'ONGOING').length;
            case 'Completed':
                return this.exams.filter((e) => e.status === 'COMPLETED' || e.status === 'CANCELLED' || e.status === 'RESULT_DECLARED').length;
            default:
                return this.exams.length;
        }
    }

    // ── Label helpers ─────────────────────────────────────────────────────────────
    getExamTypeLabel(type: string): string {
        return this.examTypeLabels[type] ?? type;
    }

    getExamStatusLabel(status: string): string {
        return this.examStatusLabels[status] ?? status;
    }

    // ── Status accent bar (top coloured line on card) ─────────────────────────────
    getAccentBar(status: string): string {
        const map: { [k: string]: string } = {
            DRAFT: 'bg-gray-300   dark:bg-gray-600',
            SCHEDULED: 'bg-blue-500   dark:bg-blue-500',
            RE_SCHEDULED: 'bg-amber-500  dark:bg-amber-500',
            ONGOING: 'bg-emerald-500 dark:bg-emerald-500',
            COMPLETED: 'bg-indigo-500 dark:bg-indigo-500',
            CANCELLED: 'bg-red-500    dark:bg-red-500',
            NOT_STARTED: 'bg-slate-400  dark:bg-slate-500',
            RESULT_DECLARED: 'bg-purple-500 dark:bg-purple-500'
        };
        return map[status] ?? 'bg-gray-200 dark:bg-gray-700';
    }

    // ── Status badge chip ─────────────────────────────────────────────────────────
    getStatusChipClass(status: string): string {
        const map: { [k: string]: string } = {
            DRAFT: 'bg-gray-100   dark:bg-gray-800   text-gray-600   dark:text-gray-400',
            SCHEDULED: 'bg-blue-50    dark:bg-blue-900/40  text-blue-700   dark:text-blue-300',
            RE_SCHEDULED: 'bg-amber-50   dark:bg-amber-900/40 text-amber-700  dark:text-amber-300',
            ONGOING: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
            COMPLETED: 'bg-indigo-50  dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
            CANCELLED: 'bg-red-50     dark:bg-red-900/40   text-red-700    dark:text-red-300',
            NOT_STARTED: 'bg-slate-100  dark:bg-slate-800   text-slate-600  dark:text-slate-400',
            RESULT_DECLARED: 'bg-purple-50  dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
        };
        return map[status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }

    // ── Status icon ───────────────────────────────────────────────────────────────
    getStatusIcon(status: string): string {
        const map: { [k: string]: string } = {
            DRAFT: 'pi pi-file-edit',
            SCHEDULED: 'pi pi-calendar-plus',
            RE_SCHEDULED: 'pi pi-refresh',
            ONGOING: 'pi pi-play-circle',
            COMPLETED: 'pi pi-check-circle',
            CANCELLED: 'pi pi-times-circle',
            NOT_STARTED: 'pi pi-hourglass',
            RESULT_DECLARED: 'pi pi-trophy'
        };
        return map[status] ?? 'pi pi-info-circle';
    }

    // ── Countdown ─────────────────────────────────────────────────────────────────
    getDaysUntilExam(exam: any): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const examDay = new Date(exam.timeTable.settings.startDate);
        examDay.setHours(0, 0, 0, 0);
        return Math.ceil((examDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    getCountdownMessage(exam: any): string {
        const days = this.getDaysUntilExam(exam);
        if (days < 0) return 'Completed';
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return `${days} days to go`;
    }

    shouldShowCountdown(exam: any): boolean {
        const days = this.getDaysUntilExam(exam);
        return days >= 0 && days <= 30 && exam.status !== 'COMPLETED' && exam.status !== 'CANCELLED';
    }

    getCountdownClass(exam: any): string {
        const days = this.getDaysUntilExam(exam);
        if (days === 0) return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
        if (days <= 3) return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
        return 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
    }

    // ── Schedule helpers ──────────────────────────────────────────────────────────
    isSingleDayExam(exam: any): boolean {
        return exam.timeTable.settings.startDate === exam.timeTable.settings.endDate;
    }

    getScheduledSubjects(exam: any): any[] {
        return exam.timeTable.schedules.filter((s: any) => s.subjectName);
    }

    getSubjectDotColor(index: number): string {
        return this.dotColors[index % this.dotColors.length];
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    formatTime(dateString: string): string {
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
}
