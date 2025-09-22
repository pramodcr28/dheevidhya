import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, formatDate } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';

import { InventoryItem, InventoryTransaction, TransactionType, AssignedToType } from '../../models/inventory.model';
import { InventoryService } from '../../service/inventory.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TabsModule } from 'primeng/tabs';
import { Login } from "../../../core/auth/login/login";
import { ApiLoaderComponent } from '../../../core/layout/loaderComponent';
import { CommonService } from '../../../core/services/common.service';
import { EditorModule } from 'primeng/editor';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    TextareaModule,
    MessageModule,
    DividerModule,
    TagModule,
    TableModule,
    TabViewModule,
    TabsModule,
    ApiLoaderComponent,
    FormsModule,
    EditorModule
],
  templateUrl: './add-transaction.component.html',
  styles: []
})
export class AddTransactionComponent implements OnInit {
  transactionForm: FormGroup;
  @Input()  selectedItem: InventoryItem | null = null;
  formSubmitted = false;
  isSubmitting = false;

  // Holds the transactions for selected item
  itemTransactions: InventoryTransaction[] = [];

  // Service injections
  inventoryService = inject(InventoryService);
  loader = inject(ApiLoaderService);
  showAssignedToType = false;
  showAssignedToId = false;
  commonService = inject(CommonService);

  // onTransactionTypeChange(type: string) {
  //   // Example: show assign fields only when issuing or transferring
  //   this.showAssignedToType = ['ISSUE', 'TRANSFER'].includes(type);
  //   if (!this.showAssignedToType) {
  //     this.transactionForm.patchValue({ assignedToType: null, assignedToId: null });
  //     this.showAssignedToId = false;
  //   }
  // }

  // onAssignedToTypeChange(value: string) {
  //   // show input when user selects an assign type
  //   this.showAssignedToId = !!value;
  // }
  transactionTypeOptions = [
    { label: 'Issue Item', value: 'ISSUE', description: 'Issue item to someone' },
    { label: 'Return Item', value: 'RETURN', description: 'Return item back' },
    { label: 'Transfer Item', value: 'TRANSFER', description: 'Transfer to another location' },
    { label: 'Send for Maintenance', value: 'MAINTENANCE', description: 'Send item for maintenance' },
    { label: 'Inventory Adjustment', value: 'ADJUSTMENT', description: 'Adjust inventory records' },
    { label: 'Dispose Item', value: 'DISPOSE', description: 'Dispose or retire item' },
    { label: 'Purchase Record', value: 'PURCHASE', description: 'Record new purchase' },
    { label: 'Report Lost', value: 'LOST', description: 'Report item as lost' }
  ];

  assignedToTypeOptions = [
    { label: 'Student', value: 'STUDENT' },
    { label: 'Teacher', value: 'TEACHER' },
    { label: 'Classroom', value: 'CLASSROOM' },
    { label: 'Department', value: 'DEPARTMENT' },
    { label: 'Vendor', value: 'VENDOR' },
    { label: 'Storage Location', value: 'STORAGE_LOCATION' },
    { label: 'Other', value: 'OTHER' }
  ];

  constructor(private fb: FormBuilder) {
    this.transactionForm = this.fb.group({
      id: null,
      action: [],
      item: [null],
      assignedToType: ['OTHER'],
      assignedToId: ['', [ Validators.minLength(2)]],
      quantity: [0, [ Validators.min(0)]],
      date: [new Date(), Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    if (this.selectedItem) {
      this.loadItemTransactions(this.selectedItem.id);
    } 
  }

  /** ✅ API Call to fetch transactions of selected item */
  private loadItemTransactions(itemId: string): void {
    this.loader.show( "Fetching transactions");
    this.inventoryService.searchInventoryTransaction(0, 100, 'id', 'ASC', {"item_id.equals": itemId}).subscribe({
      next: (responce) => {
        this.itemTransactions = responce.content || [];
        this.loader.hide();
      },
      error: (err) => {
        console.error('Error loading transactions', err);
        this.itemTransactions = [];
        this.loader.hide();
      }
    });
  }

  /** ✅ Helper: check if field invalid */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.transactionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }


  /** ✅ Helper: extract properties */
  getItemProperties(item: InventoryItem | any): Array<{ key: string; value: any }> {
    try {
      const properties = JSON.parse(item.properties);
      return Object.entries(properties).map(([key, value]) => ({ key, value }));
    } catch {
      return [];
    }
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

  /** ✅ Action Tag Colors */
  getActionSeverity(action: string): any {
    const actionMap: { [key: string]: string } = {
      ISSUE: 'success',
      RETURN: 'info',
      TRANSFER: 'primary',
      MAINTENANCE: 'warn',
      ADJUSTMENT: 'secondary',
      DISPOSE: 'danger',
      PURCHASE: 'success',
      LOST: 'danger'
    };
    return actionMap[action] || 'secondary';
  }

  getTransactionsByAction(action: string): number {
    return this.itemTransactions?.filter(t => t.action === action).length;
  }

  getAssignedToLabel(): string {
    const type = this.transactionForm.get('assignedToType')?.value;
    const labelMap: { [key: string]: string } = {
      STUDENT: 'Student ID',
      TEACHER: 'Teacher ID',
      CLASSROOM: 'Room Number',
      DEPARTMENT: 'Department Code',
      VENDOR: 'Vendor Name',
      STORAGE_LOCATION: 'Storage ID',
      OTHER: 'Identifier'
    };
    return labelMap[type] || 'Assigned To ID';
  }

  getAssignedToPlaceholder(): string {
    const type = this.transactionForm.get('assignedToType')?.value;
    const placeholderMap: { [key: string]: string } = {
      STUDENT: 'Add student',
      TEACHER: 'Add teacher',
      CLASSROOM: 'Add class number',
      DEPARTMENT: 'Add department',
      VENDOR: 'Enter vendor name or ID',
      STORAGE_LOCATION: 'Enter storage location ID',
      OTHER: 'Enter identifier'
    };
    return placeholderMap[type] || 'Enter identifier';
  }

  /** ✅ Transaction preview helpers */
  getTransactionImpactMessage(): string {
    const action = this.transactionForm.get('action')?.value;
    const messageMap: { [key: string]: string } = {
      ISSUE: 'This will mark the item as assigned and track its usage.',
      RETURN: 'This will mark the item as available for future assignments.',
      TRANSFER: "This will update the item's location and assignment.",
      MAINTENANCE: 'This will mark the item as under maintenance.',
      ADJUSTMENT: 'This will update the inventory records.',
      DISPOSE: 'This will permanently mark the item as disposed.',
      PURCHASE: 'This will record a new item acquisition.',
      LOST: 'This will mark the item as lost and update its status.'
    };
    return messageMap[action] || 'This transaction will update the item status.';
  }

  getNewItemStatus(): string | null {
    const action = this.transactionForm.get('action')?.value;
    const statusMap: { [key: string]: string } = {
      ISSUE: 'ASSIGNED',
      RETURN: 'AVAILABLE',
      MAINTENANCE: 'UNDER_MAINTENANCE',
      DISPOSE: 'DISPOSED',
      LOST: 'DAMAGED'
    };
    return statusMap[action] || null;
  }

  getSubmitButtonLabel(): string {
    const action = this.transactionForm.get('action')?.value;
    const labelMap: { [key: string]: string } = {
      ISSUE: 'Issue Item',
      RETURN: 'Return Item',
      TRANSFER: 'Transfer Item',
      MAINTENANCE: 'Send to Maintenance',
      ADJUSTMENT: 'Adjust Inventory',
      DISPOSE: 'Dispose Item',
      PURCHASE: 'Record Purchase',
      LOST: 'Report Lost'
    };
    return labelMap[action] || 'Create Transaction';
  }

  /** ✅ Save Transaction */
  saveTransaction(): void {
    this.formSubmitted = true;
    if (this.transactionForm.invalid) {
      return;
    }
    this.isSubmitting = true;

    const newTransaction: InventoryTransaction = {
      ...this.transactionForm.value,
      item: this.selectedItem, 
      date: this.commonService.formatDate(this.transactionForm.value['date'])
    };

    this.inventoryService.addTransaction(newTransaction).subscribe({
      next: (saved) => {
        this.resetForm();
        this.isSubmitting = false;
        this.loadItemTransactions(this.selectedItem.id);
      },
      error: (error: any) => {
        console.error('Error creating transaction:', error);
        this.isSubmitting = false;
      }
    });
  }

  /** ✅ Cancel action */
  onCancel(): void {
    this.resetForm();
    // this.cancelled.emit();
  }

  /** ✅ Reset form */
  private resetForm(): void {
    this.transactionForm.reset({
      quantity: 1,
      date: new Date()
    });
    this.formSubmitted = false;
    this.isSubmitting = false;
  }
}
