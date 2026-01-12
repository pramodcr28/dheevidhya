import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TabsModule } from 'primeng/tabs';
import { CommonService } from '../../core/services/common.service';
import { ApiLoaderService } from '../../core/services/loaderService';
import { ExaminationService } from '../service/examination.service';
import { AddExamComponent } from './add-exam/add-exam.component';
import { ReportsComponent } from './reports/reports.component';
import { UploadResultComponent } from './upload-result/upload-result.component';

@Component({
    selector: 'app-examination',
    imports: [CommonModule, TabsModule, BadgeModule, AvatarModule, AddExamComponent, ReportsComponent, UploadResultComponent],
    templateUrl: './examination.component.html',
    styles: ``
})
export class ExaminationComponent implements OnInit {
    activeTab: 'attendance' | 'reports' | 'detailed' = 'attendance';
    commonService: CommonService = inject(CommonService);
    loader = inject(ApiLoaderService);
    messageService = inject(MessageService);
    examinationService = inject(ExaminationService);
    exams: any[] = [];
    ngOnInit(): void {
        this.getExams();
    }

    refresh() {
        this.getExams();
    }

    getExams() {
        this.loader.show('Fetching Exams List');
        this.examinationService.search(0, 100, 'id', 'ASC', { 'branchId.eq': this.commonService.branch?.id?.toString() }).subscribe((res) => {
            this.exams = res.content;
            this.loader.hide();
        });
    }
}
