import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { ReviewComponent } from './review/review.component';
import { SidePanelComponent } from './side-panel/side-panel.component';
import { SubjectsComponent } from './subjects/subjects.component';
import { TeachersComponent } from './teachers/teachers.component';

export interface Subject {
  id: string;
  name: string;
  teacher: string;
  hoursPerWeek: number;
  color: string;
}

interface Teacher {
  name: string;
  availability: string;
}

interface Department {
  name: string;
  id: string;
}

@Component({
  selector: 'app-timetable-generator',
  standalone: true,
  imports: [CommonModule, TabViewModule, GeneralSettingsComponent,ReviewComponent,SidePanelComponent,SubjectsComponent,TeachersComponent],
  templateUrl: './time-table-setup.component.html'
})
export class TimetableGeneratorComponent {
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