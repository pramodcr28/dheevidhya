import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-timetable-view',
  imports: [CommonModule,DropdownModule,FormsModule],
  templateUrl: './timetable-view-component.component.html',
  styles: ``
})
export class TimetableViewComponentComponent {
  @Input() generatedTimetables: any[] = [];

  sectionOptions: any[] = [];
  selectedSection: any = null;
  days: string[] = [];
  uniqueTimeSlots: string[] = [];

  ngOnInit(): void {
    if (this.generatedTimetables?.length > 0) {
      this.sectionOptions = this.generatedTimetables.map(tt => ({
        label: `${tt.department} - ${tt.section}`,
        value: tt
      }));

      // Auto-select first section
      this.selectedSection = this.sectionOptions[0].value;
      this.extractViewData();
    }
  }

  onSectionChange(): void {
    this.extractViewData();
  }

  extractViewData(): void {
    if (!this.selectedSection) return;

    this.days = this.selectedSection.schedule.map((d: any) => d.day);

    const timeSet = new Set<string>();
    this.selectedSection.schedule.forEach((day: any) => {
      day.periods.forEach((period: any) => {
        timeSet.add(`${period.startTime}-${period.endTime}`);
      });
    });

    this.uniqueTimeSlots = Array.from(timeSet).sort();
  }

  getPeriod(day: string, timeSlot: string): any {
    const daySchedule = this.selectedSection.schedule.find((d: any) => d.day === day);
    return daySchedule?.periods.find(
      (p: any) => `${p.startTime}-${p.endTime}` === timeSlot
    );
  }

}
