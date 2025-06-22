import { Component } from '@angular/core';
import { MenuItem, SharedModule } from 'primeng/api';
import { TimeTableService } from '../service/time-table.service';
import { CommonModule } from '@angular/common';
import { CreateStepComponent } from './create-step/create-step.component';
import { ReviewStepComponent } from './review-step/review-step.component';
import { SetupStepComponent } from './setup-step/setup-step.component';
import { StepsModule } from 'primeng/steps';
@Component({
  selector: 'app-smart-timetable-component',
  imports: [CommonModule,CreateStepComponent,ReviewStepComponent,SetupStepComponent,StepsModule],
  templateUrl: './smart-timetable-component.component.html',
  styles: ``
})
export class SmartTimetableComponentComponent {
activeIndex = 0;
  items: MenuItem[] = [];

  constructor(private timeTableService: TimeTableService) {}

  ngOnInit() {
    this.items = [
      {
        label: 'Setup',
        icon: 'pi pi-cog'
      },
      {
        label: 'Create',
        icon: 'pi pi-plus'
      },
      {
        label: 'Review',
        icon: 'pi pi-check'
      }
    ];

    this.timeTableService.loadTimeTable();
  }

  nextStep() {
    if (this.activeIndex < 2) {
      this.activeIndex++;
    }
  }

  previousStep() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  saveTimeTable() {
    this.timeTableService.saveTimeTable();
    // Add toast notification here
  }

  publishTimeTable() {
    this.timeTableService.generateSchedule();
    this.timeTableService.saveTimeTable();
    // Add publish logic here
  }
}
