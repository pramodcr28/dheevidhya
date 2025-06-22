import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { GenericDataService } from '../../service/generic-data.service';
import { TimeTableService } from '../../service/time-table.service';
import { Subject } from '../../models/time-table';

@Component({
  selector: 'app-create-step',
  imports: [
     CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TableModule,
    ColorPickerModule,
    DialogModule
  ],
  templateUrl: './create-step.component.html',
  styles: ``
})
export class CreateStepComponent {
 @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();

  subjects: Subject[] = [];
  displayDialog = false;
  showColorPicker = false;
  dialogMode: 'add' | 'edit' = 'add';
  currentSubject: Partial<Subject> = {};
  editingSubjectId: string | null = null;

  constructor(
    private timeTableService: TimeTableService,
    private genericDataService: GenericDataService
  ) {}

  ngOnInit() {
    this.timeTableService.timeTable$.subscribe(timeTable => {
      this.subjects = timeTable.subjects;
    });
  }

  showAddSubjectDialog() {
    this.dialogMode = 'add';
    this.currentSubject = {
      name: '',
      teacher: '',
      hoursPerWeek: 4,
      color: this.getNextColor()
    };
    this.displayDialog = true;
    this.showColorPicker = false;
  }

  editSubject(subject: Subject) {
    this.dialogMode = 'edit';
    this.currentSubject = { ...subject };
    this.editingSubjectId = subject.id;
    this.displayDialog = true;
    this.showColorPicker = false;
  }

  hideDialog() {
    this.displayDialog = false;
    this.currentSubject = {};
    this.editingSubjectId = null;
  }

  saveSubject() {
    if (!this.isSubjectValid()) return;

    if (this.dialogMode === 'add') {
      this.timeTableService.addSubject(this.currentSubject as Subject);
    } else if (this.editingSubjectId) {
      this.timeTableService.updateSubject(this.editingSubjectId, this.currentSubject);
    }

    this.hideDialog();
  }

  deleteSubject(subjectId: string) {
    this.timeTableService.removeSubject(subjectId);
  }

  isSubjectValid(): boolean {
    return !!(this.currentSubject.name && 
             this.currentSubject.teacher && 
             this.currentSubject.hoursPerWeek && 
             this.currentSubject.color);
  }

  getNextColor(): string {
    const colors = this.genericDataService.getSubjectColors();
    return colors[this.subjects.length % colors.length];
  }

  onNext() {
    this.next.emit();
  }

  onPrevious() {
    this.previous.emit();
  }
}
