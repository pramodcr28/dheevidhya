import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { ReviewComponent } from './review/review.component';
import { SidePanelComponent } from './side-panel/side-panel.component';
import { SubjectsComponent } from './subjects/subjects.component';
import { TeachersComponent } from './teachers/teachers.component';
import { RouterLink } from '@angular/router';
import { TimeTableService } from '../../service/time-table.service';
@Component({
  selector: 'app-timetable-generator',
  standalone: true,
  imports: [CommonModule, TabViewModule, GeneralSettingsComponent,ReviewComponent,SidePanelComponent,SubjectsComponent,TeachersComponent,RouterLink],
  templateUrl: './time-table-setup.component.html'
})
export class TimetableGeneratorComponent implements OnInit{

  timeTableService = inject(TimeTableService);
  
  ngOnInit(): void {
    this.timeTableService.resetTimeTable(); 
  }
  activeIndex = 0;
  
  nextTab() {
    if (this.activeIndex < 3) {
      this.activeIndex++;
    }
  }

  previousTab() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }
}