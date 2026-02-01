import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { AddExamComponent } from './add-exam/add-exam.component';
import { ReportsComponent } from './reports/reports.component';
import { UploadResultComponent } from './upload-result/upload-result.component';

@Component({
    selector: 'app-examination',
    standalone: true,
    imports: [CommonModule, TabsModule, AddExamComponent, UploadResultComponent, ReportsComponent],
    templateUrl: './examination.component.html'
})
export class ExaminationComponent {
    activeTab = '0';
}
