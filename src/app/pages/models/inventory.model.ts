export interface InventoryCategory {
    id: string;
    name: string;
    academicYearDependent: boolean;
    propertyDefinitions: PropertyDefinition[];
}

export interface PropertyDefinition {
    fieldName?: string;
    label?: string;
    fieldType?: FieldType;
    options?: Option[];
    required?: boolean;
}

export interface InventoryItem {
    id: string;
    category?: InventoryCategory;
    academicYear?: string;
    properties?: Map<String, any>;
    status?: ItemStatus;
    name?: string;
    totalQuantity?: number;
    availableQuantity?: number;
    totalTransactions: number;
    totalSpend: number;
}

export interface InventoryTransaction {
    notes?: any;
    id: string;
    item?: InventoryItem;
    action: TransactionType;
    assignedToType: AssignedToType;
    assignedToId: string;
    assignedToName: string;
    returnFromId: string;
    returnFromName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    date: Date;
}

export interface Option {
    title: string;
    value: string;
}

export enum FieldType {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DATE = 'DATE',
    DROPDOWN = 'DROPDOWN',
    CHECKBOX = 'CHECKBOX',
    RADIO = 'RADIO',
    TEXTAREA = 'TEXTAREA'
}

export enum ItemStatus {
    AVAILABLE = 'AVAILABLE',
    ASSIGNED = 'ASSIGNED',
    IN_USE = 'IN_USE',
    UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
    DAMAGED = 'DAMAGED',
    RETIRED = 'RETIRED',
    DISPOSED = 'DISPOSED',
    RESERVED = 'RESERVED',
    EMPTY = 'EMPTY'
}

export enum TransactionType {
    ISSUE = 'ISSUE',
    RETURN = 'RETURN',
    TRANSFER = 'TRANSFER',
    MAINTENANCE = 'MAINTENANCE',
    REMOVED = 'REMOVED',
    PURCHASE = 'PURCHASE',
    LOST = 'LOST',
    FOUND = 'FOUND'
}

export enum AssignedToType {
    STUDENT = 'STUDENT',
    TEACHER = 'TEACHER',
    CLASS = 'CLASS',
    SECTION = 'SECTION',
    DEPARTMENT = 'DEPARTMENT',
    VENDOR = 'VENDOR',
    STORAGE_LOCATION = 'STORAGE_LOCATION',
    OTHER = 'OTHER'
}
