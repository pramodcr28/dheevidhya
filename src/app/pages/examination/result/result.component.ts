import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
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
import { Store } from '@ngrx/store';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getBranch } from '../../../core/store/user-profile/user-profile.selectors';
import { ExaminationDTO, ResultData, ExamStats, ExamTypeLabels, ExamStatusLabels, ExamStatus } from '../../models/examination.model';
import { ExaminationService } from '../../service/examination.service';

@Component({
  selector: 'app-result',
  imports: [
      CommonModule,
        ReactiveFormsModule,
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
        FormsModule
  ],
  templateUrl: './result.component.html',
  styles: ``,
  providers: [MessageService, ConfirmationService],
})
export class ResultComponent {
 private store = inject(Store<{ userProfile: UserProfileState }>);
  private examinationService = inject(ExaminationService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  exams: ExaminationDTO[] = [];
  selectedExam: ExaminationDTO | null = null;
  results: ResultData[] = [];
  examStats: ExamStats | null = null;
  showImportDialog = false;
  showStudentDetail = false;
  selectedStudentResult: ResultData | null = null;

  // Chart data
  chartData: any;
  chartOptions: any;
  gradeChartData: any;
  barChartOptions: any;

  ExamTypeLabels = ExamTypeLabels;
  ExamStatusLabels = ExamStatusLabels;

  ngOnInit() {
    this.loadExams();
    this.initializeCharts();
  }

  loadExams() {
    this.store.select(getBranch).subscribe(branch => {
      if (branch?.id) {
        this.examinationService.search(0, 100, 'id', 'DESC', {
          'branchId.equals': branch.id.toString()
        }).subscribe(res => {
          this.exams = res.content || [];
        });
      }
    });
  }

  onExamChange() {
    if (this.selectedExam) {
      this.loadResultsForExam();
    }
  }

  loadResultsForExam() {
    // Mock data - replace with actual API call
    this.results = this.generateMockResults();
    this.calculateStats();
    this.updateCharts();
  }

  generateResults() {
    if (!this.selectedExam) return;
    
    // Generate results logic here
    this.messageService.add({
      severity: 'info',
      summary: 'Generating Results',
      detail: 'Please wait while we generate the results...'
    });
    
    setTimeout(() => {
      this.loadResultsForExam();
      this.messageService.add({
        severity: 'success',
        summary: 'Results Generated',
        detail: 'Results have been generated successfully!'
      });
    }, 2000);
  }

  publishResults() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to publish these results? This action cannot be undone.',
      header: 'Confirm Publication',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Publish results logic
        if (this.selectedExam) {
          this.selectedExam.status = ExamStatus.RESULT_DECLARED;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Published',
          detail: 'Results have been published successfully!'
        });
      }
    });
  }

  viewStudentResult(result: ResultData) {
    this.selectedStudentResult = result;
    this.showStudentDetail = true;
  }

  exportResults() {
    // Export logic here
    this.messageService.add({
      severity: 'info',
      summary: 'Export Started',
      detail: 'Results are being exported...'
    });
  }

  importResults() {
    // Import logic here
    this.showImportDialog = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Import Successful',
      detail: 'Results have been imported successfully!'
    });
  }

  private generateMockResults(): ResultData[] {
    const students = [
      'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown',
      'Lisa Davis', 'Tom Miller', 'Emma Garcia', 'James Rodriguez', 'Maria Martinez'
    ];
    
    const classes = ['10th Grade', '9th Grade', '8th Grade'];
    const sections = ['A', 'B', 'C'];
    const subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography'];
    
    return students.map((name, index) => {
      const totalMarks = 500;
      const obtainedMarks = Math.floor(Math.random() * 200) + 250; // 250-450
      const percentage = Math.round((obtainedMarks / totalMarks) * 100);
      
      return {
        studentId: `STU${index + 1}`,
        studentName: name,
        className: classes[index % classes.length],
        section: sections[index % sections.length],
        subjects: subjects.map(sub => ({
          subjectId: sub.toLowerCase(),
          subjectName: sub,
          maxMarks: 100,
          obtainedMarks: Math.floor(Math.random() * 40) + 50,
          grade: this.calculateGrade(Math.floor(Math.random() * 40) + 50)
        })),
        totalMarks,
        obtainedMarks,
        percentage,
        grade: this.calculateGrade(percentage),
        status: percentage >= 40 ? 'PASS' : 'FAIL'
      };
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

  private calculateStats() {
    if (!this.results.length) return;
    
    const totalStudents = this.results.length;
    const passedStudents = this.results.filter(r => r.status === 'PASS').length;
    const failedStudents = totalStudents - passedStudents;
    const averagePercentage = Math.round(
      this.results.reduce((sum, r) => sum + r.percentage, 0) / totalStudents
    );
    const highestScore = Math.max(...this.results.map(r => r.percentage));
    const lowestScore = Math.min(...this.results.map(r => r.percentage));
    
    this.examStats = {
      totalStudents,
      passedStudents,
      failedStudents,
      averagePercentage,
      highestScore,
      lowestScore
    };
  }

  private initializeCharts() {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    };

    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
  }

  private updateCharts() {
    if (!this.examStats) return;
    
    // Doughnut chart for pass/fail
    this.chartData = {
      labels: ['Passed', 'Failed'],
      datasets: [{
        data: [this.examStats.passedStudents, this.examStats.failedStudents],
        backgroundColor: ['#10B981', '#EF4444'],
        borderWidth: 0
      }]
    };

    // Bar chart for grade distribution
    const gradeCount = {};
    this.results.forEach(r => {
      gradeCount[r.grade] = (gradeCount[r.grade] || 0) + 1;
    });

    this.gradeChartData = {
      labels: Object.keys(gradeCount),
      datasets: [{
        label: 'Students',
        data: Object.values(gradeCount),
        backgroundColor: '#3B82F6',
        borderRadius: 4
      }]
    };
  }

  getStatusSeverity(status: string): any {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'DRAFT': return 'warn';
      case 'COMPLETED': return 'info';
      default: return 'secondary';
    }
  }

  getGradeSeverity(grade: string): any {
    switch (grade) {
      case 'A+':
      case 'A': return 'success';
      case 'B+': return 'info';
      case 'B': return 'info';
      case 'C': return 'warn';
      case 'D': return 'secondary';
      case 'F': return 'danger';
      default: return 'secondary';
    }
  }
}
