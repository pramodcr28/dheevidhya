import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { EditorModule } from 'primeng/editor';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TimelineModule } from 'primeng/timeline';
import { ApiLoaderComponent } from '../../../core/layout/loaderComponent';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { InventoryItem, InventoryTransaction } from '../../models/inventory.model';
import { ITenantUser } from '../../models/user.model';
import { InventoryService } from '../../service/inventory.service';
import { UserService } from '../../service/user.service';

@Component({
    selector: 'app-add-transaction',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        SelectModule,
        InputTextModule,
        InputNumberModule,
        DatePickerModule,
        TextareaModule,
        MessageModule,
        DividerModule,
        TagModule,
        TableModule,
        TabViewModule,
        ApiLoaderComponent,
        FormsModule,
        EditorModule,
        TimelineModule,
        TabsModule
    ],
    templateUrl: './add-transaction.component.html',
    styles: []
})
export class AddTransactionComponent implements OnInit {
    transactionForm: FormGroup;
    @Input() selectedItem: InventoryItem | null = null;
    formSubmitted = false;
    isSubmitting = false;
    isLoadingTargets = false;
    activeTabIndex = 0;
    itemTransactions: InventoryTransaction[] = [];
    inventoryService = inject(InventoryService);
    loader = inject(ApiLoaderService);
    commonService = inject(CommonService);
    userService = inject(UserService);
    departmentConfigService = inject(DepartmentConfigService);
    textInputAssignTypeValues = ['VENDOR', 'STORAGE_LOCATION', 'OTHER'];
    actionTypeValuesForAssignTo = ['REMOVED', 'PURCHASE', 'LOST', 'FOUND'];
    targets = [];
    transactionTypeOptions = [
        { label: 'Issue Item', value: 'ISSUE', description: 'Issue item to someone' },
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
            action: [null, Validators.required],
            item: [null],
            assignedToType: ['OTHER'],
            assignedToId: [null],
            assignedToName: [null],
            returnFromId: [null],
            returnFromName: [null],
            quantity: [1, [Validators.min(1)]],
            date: [new Date(), Validators.required],
            notes: [''],
            totalPrice: [0],
            unitPrice: [0]
        });
    }

    ngOnInit() {
        if (this.selectedItem) {
            this.loadItemTransactions(this.selectedItem.id);

            if (this.selectedItem.availableQuantity < this.selectedItem.totalQuantity && !this.transactionTypeOptions.some((type) => type.value == 'RETURN')) {
                this.transactionTypeOptions.unshift({ label: 'Return Item', value: 'RETURN', description: 'Return item back' });
                this.transactionTypeOptions.unshift({ label: 'Transfer Item', value: 'TRANSFER', description: 'Transfer to another location' });
            }
        }
    }

    setMaxQuantityCount(): number {
        let actions = ['ISSUE', 'TRANSFER', 'LOST'];
        let action = this.transactionForm.get('action').value;
        if (actions.includes(action)) return this.selectedItem?.availableQuantity;
        if (action == 'RETURN') return this.selectedItem?.totalQuantity - this.selectedItem?.availableQuantity;
        return null;
    }

    onActionTypeChange(event: any) {
        this.transactionForm.get('quantity')?.setValue(1);
    }

    private loadItemTransactions(itemId: string): void {
        this.loader.show('Fetching transactions');
        this.inventoryService.searchInventoryTransaction(0, 100, 'id', 'DESC', { 'item_id.equals': itemId }).subscribe({
            next: (response) => {
                this.itemTransactions = response.content || [];
                this.loader.hide();
                if (this.itemTransactions.some((tras) => tras.action == 'LOST') && !this.transactionTypeOptions.some((type) => type.value == 'FOUND')) {
                    this.transactionTypeOptions.push({ label: 'Found Item', value: 'FOUND', description: 'Found item' });
                }
            },
            error: (err) => {
                console.error('Error loading transactions', err);
                this.itemTransactions = [];
                this.loader.hide();
            }
        });
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.transactionForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
    }

    getItemProperties(item: InventoryItem | any): Array<{ key: string; value: any }> {
        try {
            const properties = JSON.parse(item.properties);
            return Object.entries(properties).map(([key, value]) => ({ key, value }));
        } catch {
            return [];
        }
    }

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

    getActionSeverity(action: string): any {
        const actionMap: { [key: string]: string } = {
            ISSUE: 'success',
            RETURN: 'info',
            TRANSFER: 'primary',
            ADJUSTMENT: 'secondary',
            DISPOSE: 'danger',
            PURCHASE: 'success',
            LOST: 'danger'
        };
        return actionMap[action] || 'secondary';
    }

    getTransactionsByAction(action: string): number {
        return this.itemTransactions?.filter((t) => t.action === action).length;
    }

    getAssignedToLabel(): string {
        const type = this.transactionForm.get('assignedToType')?.value;
        const labelMap: { [key: string]: string } = {
            STUDENT: 'Student',
            TEACHER: 'Teacher',
            CLASSROOM: 'Room Number',
            DEPARTMENT: 'Department Code',
            VENDOR: 'Vendor Name',
            STORAGE_LOCATION: 'Storage',
            OTHER: 'Identifier'
        };
        return labelMap[type] || 'Assigned To';
    }

    getAssignedToPlaceholder(): string {
        const type = this.transactionForm.get('assignedToType')?.value;
        const placeholderMap: { [key: string]: string } = {
            STUDENT: 'Add student',
            TEACHER: 'Add teacher',
            CLASSROOM: 'Add classroom',
            DEPARTMENT: 'Add department',
            VENDOR: 'Enter vendor name or ID',
            STORAGE_LOCATION: 'Enter storage location ID',
            OTHER: 'Enter target'
        };
        return placeholderMap[type] || 'Enter target';
    }

    onAssignmentTypeChange(event: any) {
        this.targets = [];
        this.isLoadingTargets = true;

        switch (event.value) {
            case 'STUDENT':
                this.userService
                    .userSearch(0, 1000, 'id', 'ASC', {
                        'branch_id.eq': this.commonService.branch?.id,
                        'authorities.name.equals': 'STUDENT',
                        'status.equals': 'ACTIVE'
                    })
                    .subscribe({
                        next: (res: any) => {
                            this.targets = (res.content || []).map((user: ITenantUser) => ({
                                label: `${user.firstName} ${user.lastName} (${user.login})`,
                                value: user.id
                            }));
                            this.isLoadingTargets = false;
                        },
                        error: (err) => {
                            console.error('Failed to load students', err);
                            this.isLoadingTargets = false;
                        }
                    });
                break;

            case 'TEACHER':
                this.userService
                    .userSearch(0, 1000, 'id', 'ASC', {
                        'branch_id.eq': this.commonService.branch?.id,
                        'authorities.name.equals': 'TEACHER',
                        'status.equals': 'ACTIVE'
                    })
                    .subscribe({
                        next: (res: any) => {
                            this.targets = (res.content || []).map((user: ITenantUser) => ({
                                label: `${user.firstName} ${user.lastName} (${user.login})`,
                                value: user.id
                            }));
                            this.isLoadingTargets = false;
                        },
                        error: (err) => {
                            console.error('Failed to load teachers', err);
                            this.isLoadingTargets = false;
                        }
                    });
                break;

            case 'CLASSROOM':
                const departments = this.commonService.associatedDepartments || [];
                departments.forEach((dept: any) => {
                    (dept.department?.classes || []).forEach((cls: any) => {
                        this.targets.push({
                            label: `${cls.name} (${dept.department?.name || ''})`,
                            value: cls.id
                        });
                    });
                });
                this.isLoadingTargets = false;
                break;

            case 'DEPARTMENT':
                const depts = this.commonService.associatedDepartments || [];
                this.targets = depts.map((dept: any) => ({
                    label: dept.department?.name || dept.name || 'Unknown',
                    value: dept.department?.id || dept.id
                }));
                this.isLoadingTargets = false;
                break;

            default:
                this.isLoadingTargets = false;
                break;
        }
    }

    getTransactionImpactMessage(): string {
        const action = this.transactionForm.get('action')?.value;
        const messageMap: { [key: string]: string } = {
            ISSUE: 'This will mark the item as assigned and track its usage.',
            RETURN: 'This will mark the item as available for future assignments.',
            TRANSFER: "This will update the item's location and assignment.",
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
            ADJUSTMENT: 'Adjust Inventory',
            DISPOSE: 'Dispose Item',
            PURCHASE: 'Record Purchase',
            LOST: 'Report Lost'
        };
        return labelMap[action] || 'Create Transaction';
    }

    validateTranaction(): void {
        const action = this.transactionForm.get('action')?.value;
        const quantity = this.transactionForm.get('quantity')?.value;
        if (action === 'ISSUE' || action === 'TRANSFER' || action === 'LOST') {
            const availableQty = this.selectedItem?.availableQuantity || 0;
            if (quantity > availableQty) {
                this.transactionForm.get('quantity')?.setErrors({ max: true });
            } else {
                this.transactionForm.get('quantity')?.setErrors(null);
            }
        } else if (action === 'RETURN') {
            const returnableQty = (this.selectedItem?.totalQuantity || 0) - (this.selectedItem?.availableQuantity || 0);
            if (quantity > returnableQty) {
                this.transactionForm.get('quantity')?.setErrors({ max: true });
            } else {
                this.transactionForm.get('quantity')?.setErrors(null);
            }
        }
    }

    saveTransaction(): void {
        this.validateTranaction();
        this.formSubmitted = true;
        if (this.transactionForm.invalid) {
            return;
        }
        this.isSubmitting = true;

        const newTransaction: InventoryTransaction = {
            ...this.transactionForm.value,
            item: this.selectedItem,
            date: this.commonService.formatDateForApi(this.transactionForm.value['date'])
        };

        this.inventoryService.addTransaction(newTransaction).subscribe({
            next: (saved) => {
                this.selectedItem = saved.body;
                this.resetForm();
                this.isSubmitting = false;
                this.activeTabIndex = 0;
                this.loadItemTransactions(this.selectedItem!.id);
                if (this.selectedItem.availableQuantity < this.selectedItem.totalQuantity && !this.transactionTypeOptions.some((type) => type.value == 'RETURN')) {
                    this.transactionTypeOptions.unshift({ label: 'Return Item', value: 'RETURN', description: 'Return item back' });
                    this.transactionTypeOptions.unshift({ label: 'Transfer Item', value: 'TRANSFER', description: 'Transfer to another location' });
                }
            },
            error: (error: any) => {
                console.error('Error creating transaction:', error);
                this.isSubmitting = false;
            }
        });
    }

    onCancel(): void {
        this.resetForm();
    }

    private resetForm(): void {
        this.transactionForm.reset({
            quantity: 1,
            date: new Date(),
            assignedToType: 'OTHER'
        });
        this.targets = [];
        this.formSubmitted = false;
        this.isSubmitting = false;
        this.activeTabIndex = 0;
    }
}
