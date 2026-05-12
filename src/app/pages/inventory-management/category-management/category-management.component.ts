
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { FieldType, InventoryCategory, Option, PropertyDefinition } from '../../models/inventory.model';
import { InventoryService } from '../../service/inventory.service';

@Component({
    selector: 'app-category-management',
    standalone: true,
    imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, InputSwitchModule, MenuModule, SelectModule, ToggleButtonModule],
    templateUrl: './category-management.component.html',
    styles: `
        .p-select-panel {
            transform-origin: bottom center !important;
        }
    `
})
export class CategoryManagementComponent implements OnInit {
    categories: InventoryCategory[] = [];
    showDialog = false;
    showPropertiesDialog = false;
    dialogMode: 'add' | 'edit' = 'add';
    selectedCategory: InventoryCategory | null = null;
    messageService = inject(MessageService);
    categoryForm: InventoryCategory = {
        id: null,
        name: '',
        academicYearDependent: false,
        propertyDefinitions: []
    };

    fieldTypeOptions: Option[] = [
        { title: 'Text', value: FieldType.TEXT },
        { title: 'Number', value: FieldType.NUMBER },
        { title: 'Date', value: FieldType.DATE },
        { title: 'Dropdown', value: FieldType.DROPDOWN },
        { title: 'Checkbox', value: FieldType.CHECKBOX },
        { title: 'Radio Button', value: FieldType.RADIO },
        { title: 'Text Area', value: FieldType.TEXTAREA }
    ];

    inventoryService = inject(InventoryService);
    loader = inject(ApiLoaderService);

    ngOnInit() {
        this.fetchCategories();
    }

    fetchCategories() {
        this.loader.show('Fetching Categories');
        this.inventoryService.searchCategory(0, 100, 'id', 'ASC', {}).subscribe({
            next: (res: any) => {
                this.categories = res.content;
                this.loader.hide();
            },
            error: (error) => {
                console.error('Error fetching categories:', error);
                this.loader.hide();
            }
        });
    }

    refreshData() {
        this.fetchCategories();
    }

    getAcademicYearDependentCount(): number {
        return this.categories.filter((cat) => cat.academicYearDependent).length;
    }

    getTotalPropertiesCount(): number {
        return this.categories.reduce((sum, cat) => sum + (cat.propertyDefinitions?.length || 0), 0);
    }

    getCategoryIcon(categoryName: string): string {
        const iconMap: { [key: string]: string } = {
            Books: 'pi pi-book',
            Electronics: 'pi pi-desktop',
            Computers: 'pi pi-desktop',
            Laptops: 'pi pi-mobile',
            'Sports Equipment': 'pi pi-heart',
            Sports: 'pi pi-heart',
            Vehicles: 'pi pi-car',
            Consumables: 'pi pi-shopping-bag',
            Furniture: 'pi pi-home',
            Tools: 'pi pi-wrench',
            Medical: 'pi pi-plus-circle',
            Stationery: 'pi pi-pencil',
            Laboratory: 'pi pi-flask'
        };
        return iconMap[categoryName] || 'pi pi-box';
    }

    getCategoryColor(categoryName: string): string {
        const colorMap: { [key: string]: string } = {
            Books: '#3b82f6',
            Electronics: '#8b5cf6',
            Computers: '#8b5cf6',
            Laptops: '#6366f1',
            'Sports Equipment': '#10b981',
            Sports: '#10b981',
            Vehicles: '#f59e0b',
            Consumables: '#ec4899',
            Furniture: '#84cc16',
            Tools: '#ef4444',
            Medical: '#06b6d4',
            Stationery: '#f97316',
            Laboratory: '#8b5cf6'
        };
        return colorMap[categoryName] || '#6b7280';
    }

    getFieldTypeLabel(fieldType: FieldType): string {
        const labelMap: { [key in FieldType]: string } = {
            [FieldType.TEXT]: 'Text',
            [FieldType.NUMBER]: 'Number',
            [FieldType.DATE]: 'Date',
            [FieldType.DROPDOWN]: 'Dropdown',
            [FieldType.CHECKBOX]: 'Checkbox',
            [FieldType.RADIO]: 'Radio',
            [FieldType.TEXTAREA]: 'Text Area'
        };
        return labelMap[fieldType] || fieldType;
    }

    // Dialog Management
    showAddCategoryDialog() {
        this.dialogMode = 'add';
        this.categoryForm = {
            id: null,
            name: '',
            academicYearDependent: false,
            propertyDefinitions: []
        };
        this.showDialog = true;
    }

    editCategory(category: InventoryCategory) {
        this.dialogMode = 'edit';
        this.categoryForm = {
            id: category.id,
            name: category.name,
            academicYearDependent: category.academicYearDependent,
            propertyDefinitions: JSON.parse(JSON.stringify(category.propertyDefinitions || []))
        };
        this.showDialog = true;
    }

    closeDialog() {
        this.showDialog = false;
        this.categoryForm = {
            id: null,
            name: '',
            academicYearDependent: false,
            propertyDefinitions: []
        };
    }

    manageProperties(category: InventoryCategory) {
        this.selectedCategory = JSON.parse(JSON.stringify(category));
        this.showPropertiesDialog = true;
    }

    closePropertiesDialog() {
        this.showPropertiesDialog = false;
        this.selectedCategory = null;
    }

    addProperty() {
        const newProperty: PropertyDefinition = {
            fieldName: '',
            label: '',
            fieldType: FieldType.TEXT,
            options: [],
            required: false,
            _new: true
        };
        this.categoryForm.propertyDefinitions.unshift(newProperty);
    }

    removeProperty(index: number) {
        this.categoryForm.propertyDefinitions.splice(index, 1);
    }

    addOption(property: PropertyDefinition) {
        if (!property.options) {
            property.options = [];
        }
        property.options.push({
            title: '',
            value: ''
        });
    }

    removeOption(property: PropertyDefinition, optionIndex: number) {
        if (property.options) {
            property.options.splice(optionIndex, 1);
        }
    }

    onFieldTypeChange(property: PropertyDefinition, index: number) {
        if (property.fieldType === FieldType.DROPDOWN || property.fieldType === FieldType.RADIO) {
            if (!property.options || property.options.length === 0) {
                property.options = [{ title: '', value: '' }];
            }
        } else {
            property.options = [];
        }
    }

    isFormValid(): boolean {
        if (!this.categoryForm.name.trim()) {
            return false;
        }

        // Validate properties
        for (const prop of this.categoryForm.propertyDefinitions) {
            if (!prop.fieldName?.trim() || !prop.label?.trim() || !prop.fieldType) {
                return false;
            }

            if ((prop.fieldType === FieldType.DROPDOWN || prop.fieldType === FieldType.RADIO) && (!prop.options || prop.options.length === 0)) {
                return false;
            }

            if (prop.options) {
                for (const option of prop.options) {
                    if (!option.title?.trim() || !option.value?.trim()) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    private hasDuplicateProperties(): boolean {
        const fieldNames = new Set<string>();
        const labels = new Set<string>();

        for (const prop of this.categoryForm.propertyDefinitions || []) {
            const fieldName = prop.fieldName?.trim().toLowerCase();
            const label = prop.label?.trim().toLowerCase();
            delete prop._new;
            // Check duplicate fieldName
            if (fieldName) {
                if (fieldNames.has(fieldName)) {
                    return true;
                }
                fieldNames.add(fieldName);
            }

            // Check duplicate label (display name)
            if (label) {
                if (labels.has(label)) {
                    return true;
                }
                labels.add(label);
            }
        }

        return false;
    }

    saveCategory() {
        if (!this.isFormValid()) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please fill in all required fields correctly'
            });
            return;
        }

        if (this.hasDuplicateProperties()) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Duplicate Field Name or Display Name found. Please ensure all are unique.'
            });
            return;
        }

        this.loader.show(this.dialogMode === 'add' ? 'Creating Category' : 'Updating Category');

        this.inventoryService.createCategory(this.categoryForm).subscribe({
            next: (response) => {
                this.fetchCategories();
                this.closeDialog();
                this.loader.hide();
            },
            error: (error) => {
                console.error('Error creating category:', error);
                this.loader.hide();
            }
        });
    }

    deleteCategory(category: InventoryCategory) {
        if (confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
            this.loader.show('Deleting Category');

            // Delete category API call
            // this.inventoryService.deleteCategory(category.id).subscribe({
            //   next: () => {
            //     this.fetchCategories();
            //     this.loader.hide();
            //   },
            //   error: (error) => {
            //     console.error('Error deleting category:', error);
            //     this.loader.hide();
            //   }
            // });
        }
    }
}
