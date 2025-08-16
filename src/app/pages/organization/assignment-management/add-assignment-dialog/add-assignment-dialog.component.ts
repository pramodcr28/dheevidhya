import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { DropdownModule } from 'primeng/dropdown';
import { DatePickerModule } from 'primeng/datepicker';
import { TreeSelectModule } from 'primeng/treeselect';
import { SelectModule } from 'primeng/select';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-add-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    EditorModule,
    DropdownModule,
    DatePickerModule,
    TreeSelectModule,
    SelectModule
  ],
  templateUrl: './add-assignment-dialog.component.html'
})
export class AddAssignmentDialogComponent {
  /** visibility */
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** data inputs (all from parent) */
  @Input() typeOptions: any[] = [];
  @Input() associatedDepartments: any[] = [];

  /** two-way bindings for selectedDepartment & selectedSubject */
  @Input() selectedDepartment: any;
  @Output() selectedDepartmentChange = new EventEmitter<any>();

  @Input() treeNodes: TreeNode[] = [];
  @Input() selectedSubject: TreeNode | null = null;
  @Output() selectedSubjectChange = new EventEmitter<TreeNode | null>();

  /** new assignment model (object is mutated by ngModel) */
  @Input() newAssignment: any = {};

  /** events to parent */
  @Output() departmentChange = new EventEmitter<void>(); // to call onDepartmentChange() in parent
  @Output() submit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  // helpers to support [(...)] banana-in-a-box bindings
  onSelectedDepartmentModelChange(val: any) {
    this.selectedDepartmentChange.emit(val);
  }
  onSelectedSubjectModelChange(val: any) {
    this.selectedSubjectChange.emit(val);
  }

  close() {
    this.visibleChange.emit(false);
    this.cancel.emit();
  }

  save() {
    // parent already has addAssignment() which uses parent fields
    this.submit.emit();
  }
}
