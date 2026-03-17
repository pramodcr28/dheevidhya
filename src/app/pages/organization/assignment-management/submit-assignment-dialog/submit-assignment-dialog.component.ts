import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
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
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Input() selectedAssignment: any;
    @Input() studentResponse: AssignmentSubmission;
    @Output() studentResponseChange = new EventEmitter<any>();
    commonService = inject(CommonService);
    @Output() submit = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
    SubmissionStatus = SubmissionStatus;
    messageService = inject(MessageService);
    onResponseChange(val: any) {
        this.studentResponseChange.emit(this.studentResponse);
    }

    close() {
        this.visibleChange.emit(false);
        this.cancel.emit();
    }

    onSaveClick(status: SubmissionStatus) {
        if (!this.validateSubmission(status)) {
            return;
        }
        this.studentResponse.status = status;
        this.save();
    }

    private validateSubmission(status: SubmissionStatus): boolean {
        const res = this.studentResponse;
        const responseText = res?.response?.replace(/<[^>]*>/g, '').trim();
        const feedbackText = res?.feedback?.replace(/<[^>]*>/g, '').trim();
        if (this.commonService.isStudent) {
            if (!responseText || responseText.length < 5) {
                this.showError('Response must be at least 5 characters before submitting');
                return false;
            }
        } else {
            if (status === SubmissionStatus.REVIEWED) {
                if (!feedbackText || feedbackText.length < 5) {
                    this.showError('Feedback must be at least 5 characters before marking as reviewed');
                    return false;
                }
            }
        }

        return true;
    }

    private showError(msg: string) {
        this.messageService.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: msg,
            life: 3000
        });
    }

    save() {
        this.submit.emit();
    }
}
