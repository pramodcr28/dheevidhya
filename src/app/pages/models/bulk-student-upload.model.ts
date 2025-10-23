export interface StudentExcelRow {
    // Basic Info
    registrationId: string;
    firstName: string;
    lastName: string;
    gender: string;

    // Address
    houseNumber: string;
    street: string;
    locality: string;
    landmark: string;
    taluk: string;
    district: string;
    state: string;
    country: string;
    postalCode: string;

    // Academic
    // departmentName: string;
    // className: string;
    // sectionName: string;

    // Guardian Info
    guardianFirstName?: string;
    guardianLastName?: string;
    guardianEmail?: string;
    guardianPhone?: string;
    guardianRelation?: string;
    password?: string;
    email?: string;
    studentContactNumber?: string;

    // Validation
    rowNumber?: number;
    isValid?: boolean;
    errors?: string[];
}

export interface ValidationResult {
    student: StudentExcelRow;
    isValid: boolean;
    errors: string[];
}
export interface BulkStudentUploadResult {
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    validationResults: ValidationResult[];
}
