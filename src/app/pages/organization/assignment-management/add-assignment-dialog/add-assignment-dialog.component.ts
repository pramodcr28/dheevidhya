import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { EditorModule } from 'primeng/editor';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TreeSelectModule } from 'primeng/treeselect';
import { CommonService } from '../../../../core/services/common.service';
import { DheeConfirmationService } from '../../../../core/services/dhee-confirmation.service';

@Component({
    selector: 'app-add-assignment-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, EditorModule, SelectModule, DatePickerModule, TreeSelectModule, SelectModule],
    templateUrl: './add-assignment-dialog.component.html'
})
export class AddAssignmentDialogComponent {
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    @Input() typeOptions: any[] = [];
    @Input() associatedDepartments: any[] = [];

    @Input() selectedDepartment: any;
    @Output() selectedDepartmentChange = new EventEmitter<any>();

    @Input() treeNodes: TreeNode[] = [];
    @Input() selectedSubject: TreeNode | null = null;
    @Output() selectedSubjectChange = new EventEmitter<TreeNode | null>();

    @Input() newAssignment: any = {};
    today: Date = new Date();
    @Output() departmentChange = new EventEmitter<void>(); // to call onDepartmentChange() in parent
    @Output() submit = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
    commonService = inject(CommonService);
    messageService = inject(MessageService);
    confirmationService = inject(DheeConfirmationService);
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

    onSaveClick(status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED') {
        if (!this.validateAssignment(status)) {
            return;
        }
        if (status === 'PUBLISHED' || status === 'COMPLETED') {
            this.confirmationService.confirm({
                message: 'Are you sure you want to ' + (status === 'PUBLISHED' ? 'publish' : 'mark as completed') + ' this assignment?',
                header: 'Confirm Action',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.newAssignment.status = status;
                    this.save();
                }
            });
        } else {
            this.newAssignment.status = status;
            this.save();
        }
    }

    private validateAssignment(status: string): boolean {
        const a = this.newAssignment;

        if (!a?.title || a.title.trim().length < 3) {
            this.showError('Title must be at least 3 characters long');
            return false;
        }

        const plainText = a?.description?.replace(/<[^>]*>/g, '').trim();
        if (!plainText || plainText.length < 5) {
            this.showError('Description must be at least 5 characters');
            return false;
        }

        if (!a?.type) {
            this.showError('Please select assignment type (Homework / Project / Exam / Quiz)');
            return false;
        }

        if (status !== 'DRAFT' && !a?.dueDate) {
            this.showError('Due date is required to publish');
            return false;
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
