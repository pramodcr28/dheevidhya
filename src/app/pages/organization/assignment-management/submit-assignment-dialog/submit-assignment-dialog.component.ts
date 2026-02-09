import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { EditorModule } from 'primeng/editor';
import { CommonService } from '../../../../core/services/common.service';
import { AssignmentSubmission, SubmissionStatus } from '../../../models/assignment.model';

@Component({
    selector: 'app-submit-assignment-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, EditorModule],
    templateUrl: './submit-assignment-dialog.component.html'
})
export class SubmitAssignmentDialogComponent {
    /** visibility */
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    /** the assignment to display on top */
    @Input() selectedAssignment: any;
    /** two-way bound studentResponse (parent already creates it) */
    @Input() studentResponse: AssignmentSubmission;
    @Output() studentResponseChange = new EventEmitter<any>();
    commonService = inject(CommonService);
    /** events */
    @Output() submit = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
    SubmissionStatus = SubmissionStatus;

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
