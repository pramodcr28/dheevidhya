import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { InventoryCategory } from '../../models/inventory.model';
import { InventoryService } from '../../service/inventory.service';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-add-inventory-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    CheckboxModule,
    TextareaModule,
    MessageModule
  ],
  templateUrl: './add-inventory-item.component.html',
  styles: []
})
export class AddInventoryItemComponent implements OnInit {
  @Input() categories: InventoryCategory[] = [];
  @Input() itemFormModel: any = {};
  @Input() isEditMode = false;
  @Output() itemSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  selectedCategory: InventoryCategory | null = null;
  isSubmitting = false;
  inventoryService = inject(InventoryService);

  constructor() {}

  ngOnInit() {
    // Initialize selectedCategory if editing
    if (this.isEditMode && this.itemFormModel.category) {
      this.selectedCategory = this.categories.find(c => c.id === this.itemFormModel.category) || null;
      this.initializeDynamicProperties();
    }
  }

  onCategoryChange(): void {
    this.selectedCategory = this.categories.find(c => c.id === this.itemFormModel.category) || null;
    this.initializeDynamicProperties();
    
    // Auto-populate academic year if category is academic year dependent and not in edit mode
    if (this.selectedCategory?.academicYearDependent && !this.isEditMode) {
      const currentYear = new Date().getFullYear();
      this.itemFormModel.academicYear = `${currentYear}-${(currentYear + 1).toString().substr(-2)}`;
    }
  }

  private initializeDynamicProperties(): void {
    if (!this.selectedCategory) {
      this.itemFormModel.properties = {};
      return;
    }

    // Initialize properties if they don't exist
    if (!this.itemFormModel.properties) {
      this.itemFormModel.properties = {};
    }

    // Initialize default values for new properties
    this.selectedCategory.propertyDefinitions.forEach(prop => {
      if (!(prop.fieldName in this.itemFormModel.properties)) {
        let defaultValue: any = '';
        
        switch (prop.fieldType) {
          case 'NUMBER':
            defaultValue = null;
            break;
          case 'CHECKBOX':
            defaultValue = false;
            break;
          case 'DATE':
            defaultValue = null;
            break;
          default:
            defaultValue = '';
        }
        
        this.itemFormModel.properties[prop.fieldName] = defaultValue;
      }
    });
  }

  isFieldRequired(fieldName: string): boolean {
    if (!this.selectedCategory) return false;
    const prop = this.selectedCategory.propertyDefinitions.find(p => p.fieldName === fieldName);
    return prop?.required || false;
  }

  onSave(form: NgForm): void {
    if (form.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    
    const itemData: any = {
      ...this.itemFormModel,
      id: this.isEditMode ? this.itemFormModel.id : null,
      category: this.selectedCategory,
      availableQuantity: this.isEditMode ? this.itemFormModel.availableQuantity : this.itemFormModel.totalQuantity,
    };

    if (this.isEditMode) {
      this.updateItem(itemData);
    } else {
      this.createItem(itemData);
    }
  }

  private createItem(itemData: any): void {
    this.inventoryService.createInventoryItem(itemData).subscribe({
      next: (savedItem: any) => {
        console.log('Item created successfully:', savedItem);
        this.itemSaved.emit();
        this.isSubmitting = false;
      },
      error: (error: any) => {
        console.error('Error creating item:', error);
        this.isSubmitting = false;
      }
    });
  }

  private updateItem(itemData: any): void {
    this.inventoryService.createInventoryItem(itemData).subscribe({
      next: (updatedItem: any) => {
        console.log('Item updated successfully:', updatedItem);
        this.itemSaved.emit();
        this.isSubmitting = false;
      },
      error: (error: any) => {
        console.error('Error updating item:', error);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}