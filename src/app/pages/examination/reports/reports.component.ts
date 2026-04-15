import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../../core/services/common.service';
import { DheeConfirmationService } from '../../../core/services/dhee-confirmation.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getDepartmentById } from '../../../core/store/user-profile/user-profile.selectors';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { ExaminationDTO, ExamReport, ExamStatusLabels, ExamTypeLabels, ResultData } from '../../models/examination.model';
import { IDepartmentConfig, Section } from '../../models/org.model';
import { ExaminationService } from '../../service/examination.service';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        ButtonModule,
        CardModule,
        ChartModule,
        DialogModule,
        DropdownModule,
        InputTextModule,
        TableModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        ProgressBarModule,
        TabViewModule,
        SelectModule,
        ConfirmationDialogComponent,
        TooltipModule
    ],
    templateUrl: './reports.component.html',
    providers: [MessageService, DheeConfirmationService],
    styles: ``
})
export class ReportsComponent {
    private store = inject(Store<{ userProfile: UserProfileState }>);
    commonService: CommonService = inject(CommonService);
    loader = inject(ApiLoaderService);
    messageService = inject(MessageService);
    selectedExam: ExaminationDTO;
    exams: any[] = [];
    examinationService = inject(ExaminationService);

    report: ExamReport = {
        results: [],
        stats: undefined
    };

    showImportDialog = false;
    showStudentDetail = false;
    selectedStudentResult: ResultData | null = null;

    chartData: any;
    gradeChartData: any;
    chartOptions: any;
    barChartOptions: any;

    ExamTypeLabels = ExamTypeLabels;
    ExamStatusLabels = ExamStatusLabels;
    sections: Section[] = [];
    selectedSection: Section;
    isLoading: Boolean;
    public examinationSubjects: any[] = [];
    ngOnInit() {
        this.initializeCharts();
        this.getExams();
    }

    getExams() {
        this.loader.show('Fetching Exams List');
        this.examinationService.search(0, 100, 'id', 'ASC', { 'branchId.eq': this.commonService.branch?.id?.toString(), 'status.eq': 'RESULT_DECLARED' }).subscribe((res) => {
            this.exams = res.content;
            this.loader.hide();
        });
    }

    onSectionChange() {
        if (this.selectedExam) {
            this.generateResults();
        }
    }

    onExamChange() {
        this.selectedSection = null;

        this.store.select(getDepartmentById(this.selectedExam.departmentId)).subscribe((dept: IDepartmentConfig) => {
            this.sections = [];
            this.examinationSubjects = [];
            debugger;
            dept?.department?.classes.forEach((clss) => {
                clss.sections.forEach((sec: any) => {
                    const sectionSubjects = [];
                    let hasExam = false;
                    sec.subjects.forEach((sub) => {
                        if (sub.exams?.some((exam) => exam.examId === this.selectedExam.examId)) {
                            sectionSubjects.push(sub);
                            hasExam = true;
                        }
                    });

                    if (hasExam) {
                        this.sections.push({
                            classId: clss.id.toString(),
                            sectionId: sec.id.toString(),
                            departmentId: dept.id,
                            sectionName: sec.name,
                            className: clss.name,
                            departmentName: dept.department.name
                        });

                        sectionSubjects.forEach((sub) => {
                            if (!this.examinationSubjects.some((existing) => existing.id === sub.id)) {
                                this.examinationSubjects.push(sub);
                            }
                        });
                    }
                });
            });
        });
    }

    generateResults() {
        if (!this.selectedExam) return;

        const filters = {
            departmentId: this.selectedExam.departmentId,
            classId: this.selectedSection.classId,
            sectionId: this.selectedSection.sectionId,
            examId: this.selectedExam.examId
        };

        const searchRequest = {
            page: 0,
            size: 100,
            sortBy: 'id',
            sortDirection: 'ASC',
            filters
        };

        this.examinationService.getReports(searchRequest).subscribe((report: any) => {
            this.report = report;
            this.report.results.forEach((result) => {
                result.className = this.sections.find((sec) => (sec) => sec.classId == result.className).className;
                result.section = this.sections.find((sec) => (sec) => sec.sectionId == result.section).sectionName;
                result.subjects.forEach((sub) => {
                    sub.subjectName = this.examinationSubjects?.find((examSub) => examSub.id == sub.subjectId)?.name;
                });
            });
            this.updateCharts();
        });
    }

    viewStudentResult(result: ResultData) {
        this.selectedStudentResult = result;
        this.showStudentDetail = true;
    }

    importResults() {
        this.showImportDialog = false;
        this.messageService.add({
            severity: 'success',
            summary: 'Import Successful',
            detail: 'Results have been imported successfully!'
        });
    }

    private initializeCharts() {
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        };

        this.barChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: { y: { beginAtZero: true } }
        };
    }

    private updateCharts() {
        if (!this.report.stats) return;

        this.chartData = {
            labels: ['Passed', 'Failed', 'Not Found'],
            datasets: [
                {
                    data: [this.report.stats.passedStudents || 0, this.report.stats.failedStudents || 0, this.report.stats.notFoundStudents || 0],
                    backgroundColor: ['#10B981', '#EF4444', '#9CA3AF'],
                    borderWidth: 0
                }
            ]
        };

        const gradeCount: { [key: string]: number } = {};
        this.report.results.forEach((r) => {
            if (r.grade) gradeCount[r.grade] = (gradeCount[r.grade] || 0) + 1;
        });

        this.gradeChartData = {
            labels: Object.keys(gradeCount),
            datasets: [
                {
                    label: 'Students',
                    data: Object.values(gradeCount),
                    backgroundColor: '#3B82F6',
                    borderRadius: 4
                }
            ]
        };
    }

    getGradeSeverity(grade: string | null): any {
        switch (grade) {
            case 'A+':
            case 'A':
                return 'success';
            case 'B+':
            case 'B':
                return 'info';
            case 'C':
                return 'warn';
            case 'D':
                return 'secondary';
            case 'F':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    getStatusSeverity(status: string | null): any {
        if (status === 'Pass') return 'success';
        if (status === 'Fail') return 'danger';
        if (status === 'Unknown') return 'info';
        return 'info';
    }
}
