import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Optional, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DheeConfirmationService } from '../../core/services/dhee-confirmation.service';
import { ConfirmationConfig } from '../../pages/models/common.model';
@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    imports: [DialogModule, CommonModule, ButtonModule]
})
export class ConfirmationDialogComponent {
    @Input() visible = false;
    @Input() config: ConfirmationConfig = {
        header: 'Confirmation',
        message: 'Are you sure you want to proceed?'
    };

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onConfirm = new EventEmitter<void>();
    @Output() onCancel = new EventEmitter<void>();

    constructor(@Optional() private dheeConfirm: DheeConfirmationService) {
        if (this.dheeConfirm) {
            this.dheeConfirm.visible$.subscribe((v) => (this.visible = v));
            this.dheeConfirm.config$.subscribe((c) => (this.config = c));
        }
    }

    onAccept() {
        this.visible = false;
        this.visibleChange.emit(false);
        this.onConfirm.emit();
        this.dheeConfirm?.accept();
    }

    onReject() {
        this.visible = false;
        this.visibleChange.emit(false);
        this.onCancel.emit();
        this.dheeConfirm?.reject();
    }
}
