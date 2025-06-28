import { ExamSlotsComponent } from './exam-slots/exam-slots.component';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TabsModule } from 'primeng/tabs';
import { AddExamComponent } from './add-exam/add-exam.component';
import { QuessionPaperComponent } from './quession-paper/quession-paper.component';
import { ReportsComponent } from './reports/reports.component';
import { ResultComponent } from './result/result.component';

@Component({
  selector: 'app-examination',
  imports: [CommonModule, TabsModule, BadgeModule, AvatarModule,AddExamComponent,QuessionPaperComponent,ReportsComponent,ResultComponent,ExamSlotsComponent],
  templateUrl: './examination.component.html',
  styles: ``
})
export class ExaminationComponent {
 
  activeTab: 'attendance' | 'reports' | 'detailed' = 'attendance';
  

}
