export interface StudentBasicExcelRow {
    // Identity
    satsNumber: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: string; // MALE | FEMALE | OTHER
    dateOfBirth?: string; // YYYY-MM-DD
    email?: string;
    studentContactNumber?: string;
    password?: string;

    // Current address (flat, matches old template)
    addressLine?: string;
    locality?: string;
    district?: string;
    state?: string;
    pinCode?: string;
    country?: string;

    // Guardian / parent contacts
    fatherFirstName?: string;
    fatherLastName?: string;
    fatherMobile?: string;
    motherFirstName?: string;
    motherLastName?: string;
    motherMobile?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SATS-extended fields – only present in "Full SATS" template
// ─────────────────────────────────────────────────────────────────────────────
export interface StudentSatsExcelRow extends StudentBasicExcelRow {
    // Student name in Kannada
    stdFirstNameKn?: string;
    stdLastNameKn?: string;

    // Father details (Kannada + Aadhaar)
    fatherFirstNameKn?: string;
    fatherLastNameKn?: string;
    fatherAadhaar?: string;

    // Mother details (Kannada + Aadhaar)
    motherFirstNameKn?: string;
    motherLastNameKn?: string;
    motherAadhaar?: string;

    // Personal details
    aadhaarNumber?: string;
    religion?: string; // HINDU | MUSLIM | CHRISTIAN | JAIN | SIKH | BUDDHIST | OTHER
    nationality?: string; // INDIAN | OTHER
    socialCategory?: string; // GENERAL | OBC | SC | ST | OTHER_MINORITY
    belongsToBPL?: boolean;
    bplCardNumber?: string;
    bhagyalakshmiBondNo?: string;
    childWithSpecialNeed?: string; // NONE | VISUAL | HEARING | LOCOMOTOR | OTHER
    specialCategory?: string;

    // Caste certificates
    studentCasteCertNo?: string;
    fatherCasteCertNo?: string;
    motherCasteCertNo?: string;

    // Admission details
    typeOfStudent?: string; // SAME_STATE | OTHER_STATE
    mediumOfInstruction?: string;
    motherTongue?: string;
    languageGroup?: string;
    admissionDate?: string; // YYYY-MM-DD

    // Previous school
    affiliation?: string; // KSEEB | CBSE | ICSE | OTHER
    tcNo?: string;
    tcDate?: string; // YYYY-MM-DD
    prevSchoolName?: string;
    prevSchoolType?: string; // GOVERNMENT | GOVERNMENT_AIDED | PRIVATE | CENTRAL_GOVERNMENT | OTHER
    prevSchoolAddress?: string;
    prevPinCode?: string;
    prevState?: string;

    // Permanent address (separate from current)
    perAddressLine?: string;
    perLocality?: string;
    perDistrict?: string;
    perState?: string;
    perPinCode?: string;

    // Bank details
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Union row used at runtime – always carries validation metadata
// ─────────────────────────────────────────────────────────────────────────────
export type StudentExcelRow = (StudentBasicExcelRow | StudentSatsExcelRow) & {
    rowNumber?: number;
    isValid?: boolean;
    errors?: string[];
    errorMessage?: string; // server-side error after save
};

// ─────────────────────────────────────────────────────────────────────────────
// Upload mode
// ─────────────────────────────────────────────────────────────────────────────
export type UploadMode = 'basic' | 'sats';

// ─────────────────────────────────────────────────────────────────────────────
// Validation & result types
// ─────────────────────────────────────────────────────────────────────────────
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
