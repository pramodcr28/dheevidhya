import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DheeConfirmationService } from '../../core/services/dhee-confirmation.service';
import { ApiLoaderService } from '../../core/services/loaderService';
import { InventoryCategory, InventoryItem } from '../models/inventory.model';
import { InventoryService } from '../service/inventory.service';
import { AddInventoryItemComponent } from './add-inventory-item/add-inventory-item.component';
import { AddTransactionComponent } from './add-transaction/add-transaction.component';

@Component({
    selector: 'app-assets-management',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, InputTextModule, InputNumberModule, CalendarModule, TagModule, DialogModule, TooltipModule, TableModule, TabViewModule, AddInventoryItemComponent, AddTransactionComponent],
    templateUrl: './inventory-management.component.html',
    styles: []
})
export class AssetsManagementComponent implements OnInit {
    categories: InventoryCategory[] = [];
    inventoryItems: InventoryItem[] = [];
    showAddItemDialog = false;
    showTransactionsDialog = false;

    // Form model for template-driven forms
    itemFormModel: any = {
        id: null,
        name: '',
        category: null,
        status: 'AVAILABLE',
        academicYear: '',
        totalQuantity: 0,
        notes: '',
        properties: {},
        availableQuantity: 0,
        totalTransactions: 0,
        totalSpend: 0
    };

    isEditMode = false;
    editingItemId: any = null;
    selectedItem: InventoryItem | null = null;
    totalItems = 0;
    totalCategories = 0;
    inventoryService = inject(InventoryService);
    loader = inject(ApiLoaderService);
    messageService = inject(MessageService);
    confirmationService = inject(DheeConfirmationService);
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

    constructor() {}

    ngOnInit() {
        this.fetchInventoryItem();
        this.fetchCategories();
    }

    fetchCategories() {
        this.inventoryService.searchCategory(0, 100, 'id', 'ASC', {}).subscribe({
            next: (res: any) => {
                this.categories = res.content;
                this.totalCategories = res.totalElements;
            }
        });
    }

    fetchInventoryItem() {
        this.selectedItem = null;
        this.loader.show('Fetching Items');
        this.inventoryService.searchInventoryItem(0, 100, 'id', 'ASC', {}).subscribe({
            next: (res: any) => {
                this.inventoryItems = res.content;
                this.totalItems = res.totalElements;
                this.loader.hide();
            }
        });
    }

    openAddDialog() {
        this.isEditMode = false;
        this.editingItemId = null;
        this.resetForm();
        this.showAddItemDialog = true;
    }

    editItem(item: InventoryItem): void {
        this.isEditMode = true;
        this.editingItemId = item.id;
        this.populateFormForEdit(item);
        this.showAddItemDialog = true;
    }

    private populateFormForEdit(item: InventoryItem): void {
        this.itemFormModel = {
            id: item.id,
            name: item.name,
            category: item.category?.id || null,
            status: item.status,
            academicYear: item.academicYear || '',
            totalQuantity: item.totalQuantity,
            availableQuantity: item.availableQuantity || 0,
            totalTransactions: item.totalTransactions || 0,
            totalSpend: item.totalSpend || 0,
            properties: { ...item.properties }
        };
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

    onItemSaved(): void {
        this.fetchInventoryItem();
        this.closeDialog();
    }

    closeDialog(): void {
        this.showAddItemDialog = false;
        this.resetForm();
    }

    private resetForm(): void {
        this.itemFormModel = {
            id: null,
            name: '',
            category: null,
            status: 'AVAILABLE',
            academicYear: '',
            totalQuantity: 0,
            notes: '',
            properties: {},
            availableQuantity: 0,
            totalTransactions: 0,
            totalSpend: 0
        };
        this.isEditMode = false;
        this.editingItemId = null;
    }

    getTotalItems(): number {
        return this.inventoryItems.length;
    }

    getItemsByStatus(status: string): InventoryItem[] {
        return this.inventoryItems.filter((item) => item.status === status);
    }

    viewItemTransactions(item: InventoryItem): void {
        this.selectedItem = item;
        this.showTransactionsDialog = true;
    }

    deleteItem(item: InventoryItem) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${item.name}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-question-circle',
            accept: () => {
                this.loader.show('Deleting Item');
                this.inventoryService.delete(item.id).subscribe({
                    next: () => {
                        this.fetchInventoryItem();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Item deleted successfully'
                        });
                    },
                    error: () => {
                        this.loader.hide();
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete item'
                        });
                    }
                });
            }
        });
        // Implement delete functionality
        // console.log('Delete item:', item);
        // this.inventoryService.delete(item.id).subscribe({
        //     next: () => {
        //         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Item deleted successfully' });
        //         // console.log('Item deleted successfully');
        //         this.fetchInventoryItem();
        //     },
        //     error: (error) => {
        //         console.error('Error deleting item:', error);
        //     }
        // });
    }
}
