import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';

import { InventoryCategory } from '../../models/inventory.model';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-add-inventory-item',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    CheckboxModule,
    TextareaModule,
    MessageModule,
    FormsModule,
    SelectModule
  ],
  templateUrl: './add-inventory-item.component.html',
  styles: []
})
export class AddInventoryItemComponent implements OnInit {
  @Input() categories: InventoryCategory[] = [];
  @Input() addItemForm!: FormGroup;
  @Input() selectedCategoryForAdd: InventoryCategory | null = null;
  @Input() formSubmitted = false;
  @Input() isSubmitting = false;
  @Input() isEditMode = false;
  
  @Output() saveItem = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  statusOptions = [
    { label: 'Available', value: 'AVAILABLE' },
    { label: 'Reserved', value: 'RESERVED' },
    { label: 'Under Maintenance', value: 'UNDER_MAINTENANCE' }
  ];

  constructor() {}

  ngOnInit() {
    // No form initialization needed as it's handled by parent
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.addItemForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  onSave(): void {
    this.saveItem.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}