import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { CommonService } from '../../core/services/common.service';
import { AddExamComponent } from './add-exam/add-exam.component';
import { ReportsComponent } from './reports/reports.component';
import { StudentExamsComponent } from './student-exams/student-exams.component';
import { StudentResultsComponent } from './student-results/student-results.component';
import { UploadResultComponent } from './upload-result/upload-result.component';

@Component({
    selector: 'app-examination',
    standalone: true,
    imports: [CommonModule, TabsModule, AddExamComponent, UploadResultComponent, ReportsComponent, StudentResultsComponent, StudentExamsComponent],
    templateUrl: './examination.component.html'
})
export class ExaminationComponent {
    activeTab = '0';
    commonService = inject(CommonService);
}
