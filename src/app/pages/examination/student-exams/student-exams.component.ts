import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ITEMS_PER_PAGE } from '../../../core/model/pagination.constants';
import { CommonService } from '../../../core/services/common.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getStudentSectionByIds } from '../../../core/store/user-profile/user-profile.selectors';
import { ExamStatusLabels, ExamTypeLabels } from '../../models/examination.model';
import { ExaminationService } from '../../service/examination.service';

@Component({
    selector: 'app-student-exams',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './student-exams.component.html'
})
export class StudentExamsComponent implements OnInit {
    exams: any[] = [];
    filteredExams: any[] = [];
    selectedFilter: 'all' | 'upcoming' | 'ongoing' | 'completed' = 'all';
    examTypes = Object.entries(ExamTypeLabels).map(([value, label]) => ({ label, value }));
    examStatuses = Object.entries(ExamStatusLabels).map(([value, label]) => ({ label, value }));

    // ExamTypeLabels: { [key: string]: string } = {
    //     MID_TERM: 'Mid Term',
    //     FINAL: 'Final',
    //     UNIT_TEST: 'Unit Test',
    //     QUARTERLY: 'Quarterly',
    //     HALF_YEARLY: 'Half Yearly',
    //     ANNUAL: 'Annual'
    // };

    // ExamStatusLabels: { [key: string]: string } = {
    //     DRAFT: 'Draft',
    //     SCHEDULED: 'Scheduled',
    //     RE_SCHEDULED: 'Rescheduled',
    //     ONGOING: 'Ongoing',
    //     COMPLETED: 'Completed',
    //     CANCELLED: 'Cancelled'
    // };
    commonService: CommonService = inject(CommonService);
    examinationService = inject(ExaminationService);
    store = inject(Store<{ userProfile: UserProfileState }>);
    examinationIds = [];
    loader = inject(ApiLoaderService);
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 0;
    sortField = 'createdDate';
    sortOrder: 'ASC' | 'DESC' = 'DESC';
    ngOnInit(): void {
        this.store.select(getStudentSectionByIds(this.commonService.getStudentInfo.departmentId, this.commonService.getStudentInfo.classId, this.commonService.getStudentInfo.sectionId)).subscribe((s) => {
            const examMap = new Map<string, any>();

            s?.subjects?.forEach((subject: any) => {
                subject?.exams?.forEach((exam: any) => {
                    if (!examMap.has(exam.examId)) {
                        examMap.set(exam.examId, exam);
                    }
                });
            });

            this.examinationIds = Array.from(examMap.values());

            this.getExams();
        });
    }

    getExams() {
        this.loader.show('Fetching Exams List');
        if (!this.commonService.isStudent) {
            var filterParams: any = { 'branchId.eq': this.commonService.branch?.id?.toString() };
        } else {
            var filterParams: any = { 'examId.in': this.examinationIds.map((e) => e.examId) };
        }
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

        switch (this.selectedFilter) {
            case 'upcoming':
                this.filteredExams = this.exams.filter((exam) => {
                    const startDate = new Date(exam.timeTable.settings.startDate);
                    return startDate > today && exam.status !== 'COMPLETED' && exam.status !== 'CANCELLED';
                });
                break;
            case 'ongoing':
                this.filteredExams = this.exams.filter((exam) => {
                    const startDate = new Date(exam.timeTable.settings.startDate);
                    const endDate = new Date(exam.timeTable.settings.endDate);
                    return startDate <= today && endDate >= today && exam.status !== 'COMPLETED' && exam.status !== 'CANCELLED';
                });
                break;
            case 'completed':
                this.filteredExams = this.exams.filter((exam) => exam.status === 'COMPLETED' || new Date(exam.timeTable.settings.endDate) < today);
                break;
            default:
                this.filteredExams = [...this.exams];
        }
    }

    setFilter(filter: 'all' | 'upcoming' | 'ongoing' | 'completed'): void {
        this.selectedFilter = filter;
        this.filterExams();
    }

    getStatusBadgeClass(status: string): string {
        const classes: { [key: string]: string } = {
            DRAFT: 'bg-gray-100 text-gray-700',
            SCHEDULED: 'bg-blue-100 text-blue-700',
            RE_SCHEDULED: 'bg-yellow-100 text-yellow-700',
            ONGOING: 'bg-green-100 text-green-700',
            COMPLETED: 'bg-purple-100 text-purple-700',
            CANCELLED: 'bg-red-100 text-red-700'
        };
        return classes[status] || 'bg-gray-100 text-gray-700';
    }

    getStatusIcon(status: string): string {
        const icons: { [key: string]: string } = {
            DRAFT: 'pi pi-file-edit',
            SCHEDULED: 'pi pi-calendar-plus',
            RE_SCHEDULED: 'pi pi-refresh',
            ONGOING: 'pi pi-play-circle',
            COMPLETED: 'pi pi-check-circle',
            CANCELLED: 'pi pi-times-circle'
        };
        return icons[status] || 'pi pi-info-circle';
    }

    isSingleDayExam(exam: any): boolean {
        return exam.timeTable.settings.startDate === exam.timeTable.settings.endDate;
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    formatTime(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    getScheduledSubjects(exam: any): any[] {
        return exam.timeTable.schedules.filter((schedule) => schedule.subjectName);
    }

    getDaysUntilExam(exam: any): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const examDate = new Date(exam.timeTable.settings.startDate);
        examDate.setHours(0, 0, 0, 0);
        const diffTime = examDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
}
