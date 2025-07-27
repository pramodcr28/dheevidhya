import { Component, inject, OnInit, signal } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { ExaminationDTO, ExamResult, StudentResult} from '../../models/examination.model';
import { ExaminationService } from '../../service/examination.service';
import { FormsModule } from '@angular/forms';
import { IBranch } from '../../models/tenant.model';
import { getBranch, getDepartmentById } from '../../../core/store/user-profile/user-profile.selectors';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../../core/services/common.service';
import { IDepartmentConfig, Section } from '../../models/org.model';
import { UserService } from '../../service/user.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';


@Component({
  selector: 'app-upload-result',
  standalone: true,
  imports: [
    SelectModule,
    FormsModule,
    CommonModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule
  ],
  templateUrl: './upload-result.component.html',
  providers: [ConfirmationService, MessageService]
})
export class UploadResultComponent implements OnInit {
  currentBranch: IBranch;
  exams: any[] = [];
  selectedExam: ExaminationDTO;
  sections: Section[] = [];
  selectedSection: Section;

  private store = inject(Store<{ userProfile: UserProfileState }>);
  private examinationService = inject(ExaminationService);
  public commonService = inject(CommonService);
  public studentService = inject(UserService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  public students = signal<any[]>([]);
  public examinationSubjects: any[] = [];
  public selectedSubjects: any[] = [];
  public studentResults: StudentResult[] = [];

  public isLoading = false;
  public isSaving = false;

  ngOnInit(): void {
    this.store.select(getBranch).subscribe(branch => {
      this.currentBranch = branch;
      this.getExams();
    });
  }

  getExams() {
    this.isLoading = true;
    this.examinationService.search(0, 100, 'id', 'ASC', {
      'branchId.equals': this.currentBranch.id?.toString()
    }).subscribe({
      next: (res) => {
        this.exams = res.content;
        this.isLoading = false;
      },
      error: () => {
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
    this.selectedSection = null;
    this.selectedSubjects = [];
    this.students.set([]);
    this.studentResults = [];

    this.store.select(getDepartmentById(this.selectedExam.departmentId)).subscribe((dept: IDepartmentConfig) => {
      this.sections = [];
      this.examinationSubjects = [];

      dept.department.classes.forEach(clss => {
        clss.sections.forEach((sec:any) => {
          const sectionSubjects = [];
          let hasExam = false;
          sec.subjects.forEach(sub => {
            if (sub.exams?.some(exam => exam.examId === this.selectedExam.examId)) {
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

            sectionSubjects.forEach(sub => {
              if (!this.examinationSubjects.some(existing => existing.id === sub.id)) {
                this.examinationSubjects.push(sub);
              }
            });
          }
        });
      });
    });
  }

  onSectionChange() {
    this.selectedSubjects = [...this.examinationSubjects]; // auto-select all subjects
    this.students.set([]);
    this.studentResults = [];
    this.loadStudents();
  }

  loadStudents() {
    if (!this.selectedSection) return;

    this.isLoading = true;
    this.studentService
      .search(0, 100, 'id', 'ASC', {
        'profileType.equals': 'STUDENT',
        'departments.in': [this.selectedSection.departmentId],
        'roles.student.class_id.equals': this.selectedSection.classId,
        'roles.student.section_id.equals': this.selectedSection.sectionId,
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
    this.examinationService.getResults(searchRequest)
  .subscribe({
    next: (result: any[]) => {
      this.studentResults = this.students().map(student => {
        const existingStudentResult = result.find(s => s.userId === student.userId);
        const examResults: ExamResult[] = this.selectedSubjects.map(subject => {
          const existingResult = existingStudentResult?.examResults
            ?.find(er => er.subjectId === subject.id);
          return {
            id: existingResult?.id || null,
            examId: this.selectedExam.examId,
            studentId: student.userId,
            subjectId: subject.id,
            subjectName: subject.name,
            obtainedMarks: existingResult?.obtainedMarks ?? null,
            totalMarks: existingResult?.totalMarks || subject.maxMarks || 100,
            notes: existingResult?.notes || '',
            resultDeclaredAt: existingResult?.resultDeclaredAt || null,
          };
        });
        return {
          userId: student.userId,
          fullName: student.fullName,
          academicYear: student.academicYear,
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
    this.confirmationService.confirm({
      message: 'Are you sure you want to save the results?',
      header: 'Confirm Save',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.performSave()
    });
  }

  performSave() {
    this.isSaving = true;
    const payload = this.prepareSavePayload();
    this.examinationService.saveResults(payload)
  .subscribe({
    next: () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Results saved successfully!'
      });
      this.isSaving = false;
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
    return this.studentResults.map(student => ({
      fullName: student.fullName,
      examResults: student.examResults
        .filter(result => result.obtainedMarks !== null && result.obtainedMarks !== undefined)
        .map(result => ({
          id: result.id,
          examId: result.examId,
          studentId: result.studentId,
          academicYear: "2025-2026",
          subjectId: result.subjectId,
          subjectName: result.subjectName,
          obtainedMarks: result.obtainedMarks,
          totalMarks: result.totalMarks,
          notes: result.notes,
          resultDeclaredAt: result.resultDeclaredAt
        }))
    })).filter(student => student.examResults.length > 0);
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
  return student.examResults.every(r => r.obtainedMarks !== null && r.obtainedMarks !== undefined);
}

getStudentPercentage(student: StudentResult): number {
  const totalObtained = student.examResults.reduce((sum, r) => sum + (r.obtainedMarks || 0), 0);
  const totalMax = student.examResults.reduce((sum, r) => sum + (r.totalMarks || 100), 0);
  return totalMax ? Math.round((totalObtained / totalMax) * 100) : 0;
}

isStudentPass(student: StudentResult): boolean {

  const hasFailedSubject = student.examResults.some(r => {
    if (r.obtainedMarks === null || r.obtainedMarks === undefined) {
      return false;
    }
    const percentage = (r.obtainedMarks / (r.totalMarks || 100)) * 100;
    return percentage < 35;
  });

  if (hasFailedSubject) {
    return false;
  }

  return this.getStudentPercentage(student) >= 40;
}


}
