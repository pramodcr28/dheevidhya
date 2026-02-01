import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationConfig } from '../../pages/models/common.model';

@Component({
    selector: 'app-confirmation-dialog',
    imports: [CommonModule, DialogModule, ButtonModule],
    templateUrl: './confirmation-dialog.component.html',
    styles: ``
})
export class ConfirmationDialogComponent {
    @Input() visible: boolean = false;
    @Input() config: ConfirmationConfig = {
        header: 'Confirmation',
        message: 'Are you sure you want to proceed?'
    };

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onConfirm = new EventEmitter<void>();
    @Output() onCancel = new EventEmitter<void>();

    onAccept() {
        this.visible = false;
        this.visibleChange.emit(this.visible);
        this.onConfirm.emit();
    }

    onReject() {
        this.visible = false;
        this.visibleChange.emit(this.visible);
        this.onCancel.emit();
    }
}
