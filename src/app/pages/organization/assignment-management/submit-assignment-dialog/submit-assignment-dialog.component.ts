import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { EditorModule } from 'primeng/editor';
import { AssignmentSubmission } from '../../../models/assignment.model';

@Component({
  selector: 'app-submit-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    EditorModule
  ],
  templateUrl: './submit-assignment-dialog.component.html'
})
export class SubmitAssignmentDialogComponent {
  /** visibility */
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** the assignment to display on top */
  @Input() selectedAssignment: any;

  @Input()  isStudentView: boolean;
  /** two-way bound studentResponse (parent already creates it) */
  @Input() studentResponse: AssignmentSubmission;
  @Output() studentResponseChange = new EventEmitter<any>();

  /** events */
  @Output() submit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onResponseChange(val: any) {
    // keep two-way binding working if parent uses [(studentResponse)]
    this.studentResponseChange.emit(this.studentResponse);
  }

  close() {
    this.visibleChange.emit(false);
    this.cancel.emit();
  }

  save() {
    // parent already implements submitAssignment()
    this.submit.emit();
  }
}
