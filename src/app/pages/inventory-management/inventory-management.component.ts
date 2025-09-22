import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { InventoryCategory, InventoryItem, ItemStatus } from '../models/inventory.model';
import { InventoryService } from '../service/inventory.service';
import { ApiLoaderService } from '../../core/services/loaderService';
import { AddInventoryItemComponent } from './add-inventory-item/add-inventory-item.component';
import { AddTransactionComponent } from './add-transaction/add-transaction.component';

@Component({
  selector: 'app-assets-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    TagModule,
    DialogModule,
    TooltipModule,
    TableModule,
    TabViewModule,
    AddInventoryItemComponent,
    AddTransactionComponent
  ],
  templateUrl: './inventory-management.component.html',
  styles: []
})
export class AssetsManagementComponent implements OnInit {
  categories: InventoryCategory[] = [];
  inventoryItems: InventoryItem[] = [];
  showAddItemDialog = false;
  showTransactionsDialog = false;
  
  // Form handling moved to parent
  addItemForm: FormGroup;
  selectedCategoryForForm: InventoryCategory | null = null;
  formSubmitted = false;
  isSubmitting = false;
  isEditMode = false;
  editingItemId: any = null;
  
  selectedItem: InventoryItem | null = null;
  inventoryService = inject(InventoryService);
  loader = inject(ApiLoaderService);

  // Options for dropdowns
  statusOptions = [
    { label: 'Available', value: 'AVAILABLE' },
    { label: 'Reserved', value: 'RESERVED' },
    { label: 'Under Maintenance', value: 'UNDER_MAINTENANCE' },
    { label: 'Assigned', value: 'ASSIGNED' },
    { label: 'In Use', value: 'IN_USE' },
    { label: 'Damaged', value: 'DAMAGED' },
    { label: 'Retired', value: 'RETIRED' },
    { label: 'Disposed', value: 'DISPOSED' }
  ];

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  ngOnInit() {
    this.fetchInventoryItem();
    this.fetchCategories();
  }

  private initializeForm() {
    this.addItemForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      categoryId: [null, Validators.required],
      status: ['AVAILABLE'],
      academicYear: [''],
      totalQuantity: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });

    // Subscribe to category changes
    this.addItemForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      this.selectedCategoryForForm = this.categories.find(c => c.id === categoryId) || null;
      
      this.removeDynamicFormControls();
      this.addDynamicFormControls();

      if (this.selectedCategoryForForm?.academicYearDependent && !this.isEditMode) {
        const currentYear = new Date().getFullYear();
        this.addItemForm.patchValue({
          academicYear: `${currentYear}-${(currentYear + 1).toString().substr(-2)}`
        });
      }
    });
  }

  private removeDynamicFormControls(): void {
    // Remove all dynamic property controls
    const controlsToRemove = Object.keys(this.addItemForm.controls).filter(key => 
      !['id', 'name', 'categoryId', 'status', 'academicYear', 'totalQuantity', 'notes'].includes(key)
    );
    
    controlsToRemove.forEach(controlName => {
      this.addItemForm.removeControl(controlName);
    });
  }

  private addDynamicFormControls(): void {
    if (!this.selectedCategoryForForm) return;

    this.selectedCategoryForForm.propertyDefinitions.forEach(prop => {
      const validators = prop.required ? [Validators.required] : [];
      let defaultValue: any = '';

      // Set appropriate default values based on field type
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

      this.addItemForm.addControl(prop.fieldName, this.fb.control(defaultValue, validators));
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.addItemForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  fetchCategories() {
    this.inventoryService.searchCategory(0, 100, 'id', 'ASC', {}).subscribe({
      next: (res: any) => {
        this.categories = res.content;
      },
    });
  }

  fetchInventoryItem() {
    this.loader.show("Fetching Items");
    this.inventoryService.searchInventoryItem(0, 100, 'id', 'ASC', {}).subscribe({
      next: (res: any) => {
        this.inventoryItems = res.content;
        this.loader.hide();
        this.selectedItem = this.inventoryItems[0];
      },
    });
  }

  // Open dialog for adding new item
  openAddDialog() {
    this.isEditMode = false;
    this.editingItemId = null;
    this.resetForm();
    this.showAddItemDialog = true;
  }

  // Open dialog for editing existing item
  editItem(item: InventoryItem): void {
    this.isEditMode = true;
    this.editingItemId = item.id;
    this.populateFormForEdit(item);
    this.showAddItemDialog = true;
  }

    /** ✅ Status Tag Colors */
  getStatusSeverity(status: string): any {
    const severityMap: { [key: string]: string } = {
      AVAILABLE: 'success',
      ASSIGNED: 'info',
      IN_USE: 'warn',
      UNDER_MAINTENANCE: 'warn',
      DAMAGED: 'danger',
      RETIRED: 'secondary',
      DISPOSED: 'secondary',
      RESERVED: 'info'
    };
    return severityMap[status] || 'secondary';
  }

  private populateFormForEdit(item: InventoryItem): void {
    // First set the category to trigger dynamic controls creation
    this.addItemForm.patchValue({
      id: item.id,
      categoryId: item.category.id,
      name: item.name,
      status: item.status,
      academicYear: item.academicYear || '',
      totalQuantity: item.totalQuantity,
      notes: ''
    });

    // Wait for dynamic controls to be created, then populate them
    setTimeout(() => {
      if (item.properties && this.selectedCategoryForForm) {
        const propertyUpdates: any = {};
        this.selectedCategoryForForm.propertyDefinitions.forEach(prop => {
          if (item.properties.hasOwnProperty(prop.fieldName)) {
            propertyUpdates[prop.fieldName] = item.properties[prop.fieldName];
          }
        });
        this.addItemForm.patchValue(propertyUpdates);
      }
    }, 100);
  }

  saveItem(): void {
    this.formSubmitted = true;
    
    if (this.addItemForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.addItemForm.value;
    
    const properties: any = {};
    if (this.selectedCategoryForForm) {
      this.selectedCategoryForForm.propertyDefinitions.forEach(prop => {
        if (formValue[prop.fieldName] !== undefined && formValue[prop.fieldName] !== '') {
          properties[prop.fieldName] = formValue[prop.fieldName];
        }
      });
    }

    const itemData: InventoryItem = {
      id: this.isEditMode ? this.editingItemId : null,
      name: formValue.name.trim(),
      category: this.selectedCategoryForForm!,
      academicYear: formValue.academicYear || undefined,
      properties: properties,
      status: formValue.status as ItemStatus,
      totalQuantity: formValue.totalQuantity,
      availableQuantity: this.isEditMode ? formValue.availableQuantity : formValue.totalQuantity
    };

      // Create new item
    this.inventoryService.createInventoryItem(itemData).subscribe({
        next: (savedItem: any) => {
          this.fetchInventoryItem();
          this.closeDialog();
          this.isSubmitting = false;
        },
        error: (error: any) => {
          console.error('Error creating item:', error);
          this.isSubmitting = false;
        }
    });
    
  }

  closeDialog(): void {
    this.showAddItemDialog = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.addItemForm.reset({
      status: 'AVAILABLE',
      totalQuantity: 0
    });
    this.selectedCategoryForForm = null;
    this.formSubmitted = false;
    this.isSubmitting = false;
    this.isEditMode = false;
    this.editingItemId = null;
  }

  getTotalItems(): number {
    return this.inventoryItems.length;
  }

  getItemsByStatus(status: string): InventoryItem[] {
    return this.inventoryItems.filter(item => item.status === status);
  }

  viewItemTransactions(item: InventoryItem): void {
    this.selectedItem = item;
    this.showTransactionsDialog = true;
  }

  deleteItem(item: InventoryItem) {
    // Implement delete functionality
    console.log('Delete item:', item);
  }
}