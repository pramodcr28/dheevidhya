import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../../core/services/common.service';
import { DheeConfirmationService } from '../../../core/services/dhee-confirmation.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getDepartmentById } from '../../../core/store/user-profile/user-profile.selectors';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { ExaminationDTO, ExamResult, ExamResultDTO, ExamStatus, StudentResult } from '../../models/examination.model';
import { IDepartmentConfig } from '../../models/org.model';
import { ExaminationService } from '../../service/examination.service';
import { ProfileConfigService } from '../../service/profile-config.service';
import { UserService } from '../../service/user.service';

@Component({
    selector: 'app-upload-result',
    standalone: true,
    imports: [SelectModule, TooltipModule, FormsModule, CommonModule, ButtonModule, InputTextModule, ProgressSpinnerModule, ConfirmDialogModule, ToastModule, TagModule, InputNumberModule, DialogModule, CheckboxModule, ConfirmationDialogComponent],
    templateUrl: './upload-result.component.html',
    providers: [DheeConfirmationService, MessageService]
})
export class UploadResultComponent implements OnInit {
    commonService: CommonService = inject(CommonService);
    loader = inject(ApiLoaderService);
    messageService = inject(MessageService);
    selectedExam: ExaminationDTO;
    exams: any[] = [];
    examinationService = inject(ExaminationService);
    sections: any[] = [];
    selectedSection: any;

    private store = inject(Store<{ userProfile: UserProfileState }>);
    public studentService = inject(UserService);
    public profileService = inject(ProfileConfigService);
    private confirmationService = inject(DheeConfirmationService);

    public students = signal<any[]>([]);
    public selectedSubjects: any[] = [];
    public studentResults: StudentResult[] = [];

    public isLoading = false;
    public isSaving = false;
    today: Date = new Date();
    public showDeclareDialog = false;
    public sendNotification = true;

    ngOnInit(): void {
        this.getExams();
    }

    getExams() {
        this.loader.show('Fetching Exams List');
        this.examinationService.search(0, 100, 'createdDate', 'DESC', { 'branchId.eq': this.commonService.branch?.id?.toString(), 'status.in': ['SCHEDULED', 'RE_SCHEDULED', 'ONGOING'] }).subscribe((res) => {
            this.exams = res.content;
            this.loader.hide();
        });
    }

    onExamChange() {
        this.selectedSection = null;
        this.selectedSubjects = [];
        this.students.set([]);
        this.studentResults = [];

        this.store.select(getDepartmentById(this.selectedExam.departmentId)).subscribe((dept: IDepartmentConfig) => {
            this.sections = [];

            dept.department.classes.forEach((clss) => {
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
                            departmentName: dept.department.name,
                            _subjects: [...sectionSubjects]
                        });
                    }
                });
            });
        });
    }

    onSectionChange() {
        this.selectedSubjects = [];
        this.selectedSection._subjects.forEach((sub) => {
            if (this.selectedExam.timeTable.schedules.some((sc) => sc.subjectName == sub.name)) {
                this.selectedSubjects.push(sub);
            }
        });
        this.students.set([]);
        this.studentResults = [];
        this.loadStudents();
    }

    loadStudents() {
        if (!this.selectedSection) return;

        this.isLoading = true;
        this.profileService
            .search(0, 100, 'id', 'ASC', {
                'profileType.equals': 'STUDENT',
                'departments.in': [this.selectedSection.departmentId],
                'roles.student.class_id.equals': this.selectedSection.classId,
                'roles.student.section_id.equals': this.selectedSection.sectionId
            })
            .subscribe({
                next: (res: any) => {
                    this.students.set(res.content);
                    this.loadStudentResults();
                    this.isLoading = false;
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load students'
                    });
                    this.isLoading = false;
                }
            });
    }

    loadStudentResults() {
        if (!this.selectedSection || !this.selectedExam || this.selectedSubjects.length === 0) return;

        const filters = {
            departmentId: this.selectedSection.departmentId,
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

        this.isLoading = true;
        this.examinationService.getResults(searchRequest).subscribe({
            next: (result: any[]) => {
                this.studentResults = this.students().map((student) => {
                    const existingStudentResult = result.find((s) => s.userId === student.userId);
                    const examResults: ExamResult[] = this.selectedSubjects.map((subject) => {
                        const existingResult = existingStudentResult?.examResults?.find((er) => er.subjectId === subject.id);
                        return {
                            id: existingResult?.id || null,
                            examId: this.selectedExam.examId,
                            studentId: student.userId,
                            subjectId: subject.id,
                            subjectName: subject.name,
                            obtainedMarks: existingResult?.obtainedMarks ?? null,
                            totalMarks: existingResult?.id ? existingResult?.totalMarks : this.selectedExam.totalMarks,
                            notes: existingResult?.notes || '',
                            resultDeclaredAt: existingResult?.resultDeclaredAt || null
                        };
                    });
                    return {
                        userId: student.userId,
                        fullName: student.fullName,
                        academicYear: student.academicYear,
                        status: student.status,
                        examResults
                    };
                });
                this.isLoading = false;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load student results'
                });
                this.isLoading = false;
            }
        });
    }

    getUserStatusStyle(status: string): { banner: string; badge: string; icon: string; label: string } {
        switch (status) {
            case 'EXITED':
                return {
                    banner: 'bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400',
                    badge: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
                    icon: 'pi pi-sign-out',
                    label: 'Exited'
                };
            case 'PROMOTED':
                return {
                    banner: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400',
                    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                    icon: 'pi pi-arrow-up',
                    label: 'Promoted'
                };
            case 'INACTIVE':
                return {
                    banner: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400',
                    badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
                    icon: 'pi pi-pause-circle',
                    label: 'Inactive'
                };
            default:
                return {
                    banner: 'bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-500',
                    badge: 'bg-gray-200 dark:bg-gray-700 text-gray-500',
                    icon: 'pi pi-info-circle',
                    label: 'Unknown'
                };
        }
    }

    onMarksChange(studentIndex: number, subjectIndex: number) {
        const result = this.studentResults[studentIndex].examResults[subjectIndex];
        if (typeof result.obtainedMarks === 'string') {
            result.obtainedMarks = parseFloat(result.obtainedMarks) || null;
        }
        if (result.obtainedMarks !== null && result.obtainedMarks > result.totalMarks) {
            result.obtainedMarks = result.totalMarks;
        }
        if (result.obtainedMarks !== null && result.obtainedMarks < 0) {
            result.obtainedMarks = 0;
        }
    }

    saveResults() {
        if (new Date(this.selectedExam.timeTable.settings.startDate).getTime() > new Date(this.today).getTime()) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Cannot save  results before the exam start date. Please wait until the exam start.'
            });
            return;
        }

        this.confirmationService.confirm({
            message: 'Are you sure you want to save the results?',
            header: 'Confirm Save',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.performSave(ExamStatus.ONGOING)
        });
    }

    declareResults() {
        const validation = this.validateAllResults();
        if (!validation.isValid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: validation.message
            });
            return;
        }

        this.showDeclareDialog = true;
        this.sendNotification = true;
    }

    validateAllResults(): { isValid: boolean; message: string } {
        if (!this.studentResults || this.studentResults.length === 0) {
            return {
                isValid: false,
                message: 'No student results found to declare.'
            };
        }

        const studentsWithMissingMarks: string[] = [];
        const studentsWithInvalidMarks: string[] = [];

        for (const student of this.studentResults) {
            const missingSubjects: string[] = [];
            const invalidSubjects: string[] = [];
            if (student.status == 'ACTIVE') {
                for (const result of student.examResults) {
                    if (result.obtainedMarks === null || result.obtainedMarks === undefined) {
                        missingSubjects.push(result.subjectName);
                    } else {
                        const totalMarks = result.totalMarks || this.selectedExam?.totalMarks;
                        if (result.obtainedMarks < 0 || result.obtainedMarks > totalMarks) {
                            invalidSubjects.push(result.subjectName);
                        }
                    }
                }
            }

            if (missingSubjects.length > 0) {
                studentsWithMissingMarks.push(`${student.fullName}: ${missingSubjects.join(', ')}`);
            }
            if (invalidSubjects.length > 0) {
                studentsWithInvalidMarks.push(`${student.fullName}: ${invalidSubjects.join(', ')}`);
            }
        }

        if (studentsWithMissingMarks.length > 0) {
            return {
                isValid: false,
                message: `Missing marks for the following students: ${studentsWithMissingMarks.join(' | ')}`
            };
        }

        if (studentsWithInvalidMarks.length > 0) {
            return {
                isValid: false,
                message: `Invalid marks (out of range) for the following students: ${studentsWithInvalidMarks.join(' | ')}`
            };
        }

        if (new Date(this.selectedExam.timeTable.settings.endDate).getTime() > new Date(this.today).getTime()) {
            return {
                isValid: false,
                message: 'Cannot declare results before the exam end date. Please wait until the exam is completed.'
            };
        }

        return {
            isValid: true,
            message: 'All validations passed'
        };
    }

    confirmDeclareResults() {
        this.showDeclareDialog = false;
        this.performSave(ExamStatus.RESULT_DECLARED);
    }

    cancelDeclareResults() {
        this.showDeclareDialog = false;
        this.sendNotification = true;
    }

    performSave(status: ExamStatus) {
        this.isSaving = true;
        const payload: ExamResultDTO = {
            examId: this.selectedExam.examId,
            status: status,
            sendNotification: status === ExamStatus.RESULT_DECLARED ? this.sendNotification : false,
            students: this.prepareSavePayload() as any
        };
        this.examinationService.saveResults(payload).subscribe({
            next: (response) => {
                if (response.status == 201 || response.status == 200) {
                    this.selectedExam.status = status;
                    const message = status === ExamStatus.RESULT_DECLARED ? 'Results declared successfully!' : 'Results saved successfully!';
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: message
                    });
                    this.isSaving = false;
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Cannot declare results. Following students in Class',
                        detail: response.message
                    });
                    this.isSaving = false;
                }

                console.log(response);
                this.loadStudentResults();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save results'
                });
                this.isSaving = false;
            }
        });
    }

    prepareSavePayload() {
        return this.studentResults
            .map((student) => ({
                fullName: student.fullName,
                status: student.status,
                userId: student.userId,
                examResults: student.examResults
                    .filter((result) => result.obtainedMarks !== null && result.obtainedMarks !== undefined)
                    .map((result) => ({
                        id: result.id,
                        examId: result.examId,
                        studentId: result.studentId,
                        academicYear: this.selectedExam.academicYear,
                        subjectId: result.subjectId,
                        subjectName: result.subjectName,
                        obtainedMarks: result.obtainedMarks,
                        totalMarks: result.totalMarks,
                        notes: result.notes,
                        resultDeclaredAt: result.resultDeclaredAt
                    }))
            }))
            .filter((student) => student.examResults.length > 0);
    }

    getGrade(percentage: number): string {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C+';
        if (percentage >= 35) return 'C';
        return 'F';
    }

    isResultAvailable(student: StudentResult): boolean {
        return student.examResults.every((r) => r.obtainedMarks !== null && r.obtainedMarks !== undefined);
    }

    getStudentPercentage(student: StudentResult): number {
        const totalObtained = student.examResults.reduce((sum, r) => sum + (r.obtainedMarks || 0), 0);
        const totalMax = student.examResults.reduce((sum, r) => sum + (r.totalMarks || this.selectedExam?.totalMarks), 0);
        return totalMax ? Math.round((totalObtained / totalMax) * 100) : 0;
    }

    isStudentPass(student: StudentResult): boolean {
        const hasFailedSubject = student.examResults.some((r) => {
            if (r.obtainedMarks === null || r.obtainedMarks === undefined) {
                return false;
            }
            const percentage = (r.obtainedMarks / (r.totalMarks || this.selectedExam?.totalMarks)) * 100;
            return percentage < 35;
        });

        if (hasFailedSubject) {
            return false;
        }

        return this.getStudentPercentage(student) >= 40;
    }

    get canDeclareResults(): boolean {
        return this.selectedExam?.status !== ExamStatus.RESULT_DECLARED && this.studentResults.length > 0 && !this.isLoading && !this.isSaving;
    }
}
