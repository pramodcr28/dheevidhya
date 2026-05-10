export interface StudentBasicExcelRow {
    satsNumber: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: string;
    dateOfBirth?: string;
    email?: string;
    studentContactNumber?: string;
    password?: string;
    addressLine?: string;
    locality?: string;
    district?: string;
    state?: string;
    pinCode?: string;
    country?: string;
    fatherFirstName?: string;
    fatherLastName?: string;
    fatherMobile?: string;
    motherFirstName?: string;
    motherLastName?: string;
    motherMobile?: string;
}

export interface StudentSatsExcelRow extends StudentBasicExcelRow {
    stdFirstNameKn?: string;
    stdLastNameKn?: string;
    fatherFirstNameKn?: string;
    fatherLastNameKn?: string;
    fatherAadhaar?: string;
    motherFirstNameKn?: string;
    motherLastNameKn?: string;
    motherAadhaar?: string;
    aadhaarNumber?: string;
    religion?: string;
    nationality?: string;
    socialCategory?: string;
    belongsToBPL?: boolean;
    bplCardNumber?: string;
    bhagyalakshmiBondNo?: string;
    childWithSpecialNeed?: string;
    specialCategory?: string;
    studentCasteCertNo?: string;
    fatherCasteCertNo?: string;
    motherCasteCertNo?: string;
    typeOfStudent?: string;
    mediumOfInstruction?: string;
    motherTongue?: string;
    languageGroup?: string;
    admissionDate?: string;
    affiliation?: string;
    tcNo?: string;
    tcDate?: string;
    prevSchoolName?: string;
    prevSchoolType?: string;
    prevSchoolAddress?: string;
    prevPinCode?: string;
    prevState?: string;
    perAddressLine?: string;
    perLocality?: string;
    perDistrict?: string;
    perState?: string;
    perPinCode?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
}

export type StudentExcelRow = (StudentBasicExcelRow | StudentSatsExcelRow) & {
    rowNumber?: number;
    isValid?: boolean;
    errors?: string[];
    errorMessage?: string;
};

export type UploadMode = 'basic' | 'sats';

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
