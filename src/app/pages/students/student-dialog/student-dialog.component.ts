import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../service/product.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-student-dialog',
  imports: [
    SelectModule,
    RadioButtonModule,
    InputNumberModule,
    FormsModule,
    CommonModule,
    ButtonModule,
    RippleModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule
  ],
  templateUrl: './student-dialog.component.html'
})
export class StudentDialogComponent {
  @Input() visible: boolean = false;
  @Input() product!: Product;
  @Input() statuses: any[] = [];

  @Output() save = new EventEmitter<Product>();
  @Output() cancel = new EventEmitter<void>();

  submitted: boolean = false;

  onSave() {
    this.submitted = true;
    if (this.product.name?.trim()) {
      this.save.emit(this.product);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
