// side-panel.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './side-panel.component.html'
})
export class SidePanelComponent {
  @Input() activeIndex = 0;

  generalTips = [
    "Start with your most important constraints first",
    "Group similar subjects together to minimize transitions",
    "Consider teacher availability when scheduling",
    "Balance workload evenly across the week",
    "Leave some buffer time for unexpected changes"
  ];

  subjectTips = [
    "Add all subjects before assigning teachers",
    "Use colors to visually distinguish subjects",
    "Set realistic hours per week for each subject",
    "Consider prerequisite relationships between subjects",
    "Group related subjects together"
  ];

  teacherTips = [
    "Add all teachers before assigning subjects",
    "Set accurate availability for each teacher",
    "Consider teacher preferences where possible",
    "Balance workload evenly among teachers",
    "Account for part-time teachers' schedules"
  ];

  reviewTips = [
    "Double-check all entered information",
    "Verify teacher-subject assignments",
    "Ensure total hours match curriculum requirements",
    "Preview the timetable before final generation",
    "Save your work before generating"
  ];

  getCurrentTips() {
    switch (this.activeIndex) {
      case 0: return this.generalTips;
      case 1: return this.subjectTips;
      case 2: return this.teacherTips;
      case 3: return this.reviewTips;
      default: return this.generalTips;
    }
  }
}