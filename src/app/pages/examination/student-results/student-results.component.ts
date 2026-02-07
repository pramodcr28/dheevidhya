import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

import { CommonService } from '../../../core/services/common.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getDepartmentById, getStudentSectionByIds } from '../../../core/store/user-profile/user-profile.selectors';
import { ExaminationDTO, ResultData } from '../../models/examination.model';
import { IDepartmentConfig, Section } from '../../models/org.model';
import { ExaminationService } from '../../service/examination.service';

@Component({
    selector: 'app-student-results',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule, TagModule, ToastModule],
    templateUrl: './student-results.component.html',
    providers: [MessageService]
})
export class StudentResultsComponent implements OnInit {
    private store = inject(Store<{ userProfile: UserProfileState }>);
    private commonService = inject(CommonService);
    private loader = inject(ApiLoaderService);
    private messageService = inject(MessageService);
    private examinationService = inject(ExaminationService);

    selectedExam: ExaminationDTO | null = null;
    exams: ExaminationDTO[] = [];
    selectedSection: Section | null = null;
    sections: Section[] = [];
    examinationSubjects: any[] = [];
    isLoading: boolean = false;

    studentId: string = '';
    studentName: string = '';
    studentResult: ResultData | null = null;
    examinationIds = [];

    ngOnInit() {
        this.loadStudentInfo();
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
            this.loadExams();
        });
    }

    private loadStudentInfo() {
        this.studentId = this.commonService.currentUser.userId;
        this.studentName = this.commonService.currentUser.fullName || 'Student';
    }

    loadExams() {
        this.isLoading = true;

        const filters = {
            'branchId.eq': this.commonService.branch?.id?.toString(),
            'status.eq': 'RESULT_DECLARED',
            'examId.in': this.examinationIds.map((e) => e.examId)
        };

        this.examinationService.search(0, 100, 'id', 'DESC', filters).subscribe({
            next: (res) => {
                this.exams = res.content;
                this.isLoading = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load exams'
                });
                this.isLoading = false;
            }
        });
    }

    onExamChange() {
        if (!this.selectedExam) {
            this.studentResult = null;
            return;
        }
        this.loadSectionsAndSubjects();
    }

    private loadSectionsAndSubjects() {
        this.store.select(getDepartmentById(this.selectedExam!.departmentId)).subscribe({
            next: (dept: IDepartmentConfig) => {
                this.sections = [];
                this.examinationSubjects = [];

                dept.department.classes.forEach((clss) => {
                    clss.sections.forEach((sec: any) => {
                        const sectionSubjects: any[] = [];
                        let hasExam = false;

                        sec.subjects.forEach((sub: any) => {
                            if (sub.exams?.some((exam: any) => exam.examId === this.selectedExam!.examId)) {
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

                if (this.sections.length > 0) {
                    // Find the section that matches the student's section
                    const studentSection = this.sections.find(
                        (s) => s.classId === this.commonService.getStudentInfo.classId && s.sectionId === this.commonService.getStudentInfo.sectionId && s.departmentId === this.commonService.getStudentInfo.departmentId
                    );

                    this.selectedSection = studentSection || this.sections[0];
                    this.loadStudentResult();
                }
            }
        });
    }

    loadStudentResult() {
        if (!this.selectedExam || !this.selectedSection) return;

        this.isLoading = true;

        const filters = {
            departmentId: this.selectedSection.departmentId,
            classId: this.selectedSection.classId,
            sectionId: this.selectedSection.sectionId,
            examId: this.selectedExam.examId,
            studentId: this.studentId
        };

        const searchRequest = {
            page: 0,
            size: 100,
            sortBy: 'id',
            sortDirection: 'ASC',
            filters
        };

        this.examinationService.getResults(searchRequest).subscribe({
            next: (response: any) => {
                if (response && response.length > 0) {
                    const studentData = response[0];

                    if (studentData.examResults && studentData.examResults.length > 0) {
                        let totalObtainedMarks = 0;
                        let totalMaxMarks = 0;

                        const subjects = studentData.examResults.map((result: any) => {
                            const examSub = this.examinationSubjects?.find((examSub) => examSub.id == result.subjectId);

                            totalObtainedMarks += result.obtainedMarks || 0;
                            totalMaxMarks += result.totalMarks || 0;
                            let subPercentage = (result.obtainedMarks / result.totalMarks) * 100;

                            return {
                                subjectId: result.subjectId,
                                subjectName: examSub?.name || 'Unknown Subject',
                                obtainedMarks: result.obtainedMarks,
                                maxMarks: result.totalMarks,
                                notes: result.notes,
                                grade: this.calculateGrade((result.obtainedMarks / result.totalMarks) * 100),
                                status: subPercentage >= 35 ? 'PASS' : 'FAIL'
                            };
                        });

                        const percentage = totalMaxMarks > 0 ? (totalObtainedMarks / totalMaxMarks) * 100 : 0;

                        const grade = this.calculateGrade(percentage);

                        const status = subjects.filter((s) => s.status == 'FAIL').length ? 'FAIL' : 'PASS';

                        this.studentResult = {
                            studentId: studentData.userId,
                            studentName: studentData.fullName,
                            className: '',
                            section: '',
                            subjects: subjects,
                            obtainedMarks: totalObtainedMarks,
                            totalMarks: totalMaxMarks,
                            percentage: percentage,
                            grade: grade,
                            status: status
                        };
                    } else {
                        this.studentResult = null;
                        this.messageService.add({
                            severity: 'info',
                            summary: 'No Results',
                            detail: 'No results found for this exam'
                        });
                    }
                } else {
                    this.studentResult = null;
                    this.messageService.add({
                        severity: 'info',
                        summary: 'No Results',
                        detail: 'No results found for this exam'
                    });
                }

                this.isLoading = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load results'
                });
                this.studentResult = null;
                this.isLoading = false;
            }
        });
    }

    private calculateGrade(percentage: number): string {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C';
        if (percentage >= 40) return 'D';
        return 'F';
    }

    getGradeSeverity(grade: string | null): any {
        if (!grade) return 'secondary';

        switch (grade.toUpperCase()) {
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
}
