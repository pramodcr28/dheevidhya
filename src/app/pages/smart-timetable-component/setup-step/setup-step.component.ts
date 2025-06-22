import { Component, EventEmitter, Output } from '@angular/core';
import { TimeTableSettings, GenericSelectItem } from '../../models/time-table';
import { GenericDataService } from '../../service/generic-data.service';
import { TimeTableService } from '../../service/time-table.service';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-setup-step',
  imports: [DropdownModule,FormsModule,MultiSelectModule,CardModule,InputNumberModule],
  templateUrl: './setup-step.component.html',
  styles: ``
})
export class SetupStepComponent {
@Output() next = new EventEmitter<void>();

  settings: TimeTableSettings = {
    academicYear: '2023-2024',
    semester: 'fall',
    department: 'cs',
    classSection: 'cs101-a',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '08:00',
    endTime: '16:00',
    periodDuration: 60,
    breakDuration: 10
  };

  academicYears: GenericSelectItem[] = [];
  semesters: GenericSelectItem[] = [];
  departments: GenericSelectItem[] = [];
  classSections: GenericSelectItem[] = [];
  workingDays: GenericSelectItem[] = [];

  constructor(
    private timeTableService: TimeTableService,
    private genericDataService: GenericDataService
  ) {}

  ngOnInit() {
    this.loadDropdownOptions();
    this.loadCurrentSettings();
  }

  loadDropdownOptions() {
    this.academicYears = this.genericDataService.getAcademicYears();
    this.semesters = this.genericDataService.getSemesters();
    this.departments = this.genericDataService.getDepartments();
    this.classSections = this.genericDataService.getClassSections();
    this.workingDays = this.genericDataService.getWorkingDays();
  }

  loadCurrentSettings() {
    this.timeTableService.timeTable$.subscribe(timeTable => {
      this.settings = { ...timeTable.settings };
    });
  }

  onNext() {
    this.timeTableService.updateSettings(this.settings);
    this.next.emit();
  }
}
