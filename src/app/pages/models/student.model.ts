import { IProfileConfig } from './user.model';

export interface IName {
    firstName: string | null;
    middleName?: string | null;
    lastName: string | null;
}

export interface ICasteDetails {
    studentCasteCertificateNo?: string | null;
    fatherCasteCertificateNo?: string | null;
    motherCasteCertificateNo?: string | null;
}

export interface IAddress {
    type?: string | null;
    pinCode?: string | null;
    district?: string | null;
    localBody?: string | null;
    ward?: string | null;
    locality?: string | null;
    addressLine?: string | null;
}

export interface IAdmissionDetails {
    typeOfStudent?: string | null;
    detailDescription?: string | null;
    transferCertificateFileUrl?: string | null;
    admissionClass?: string | null;
    mediumOfInstruction?: string | null;
    section?: string | null;
    motherTongue?: string | null;
    languageGroup?: string | null;
}

export interface IPreviousSchoolDetails {
    affiliation?: string | null;
    transferCertificateNo?: string | null;
    transferCertificateDate?: string | null; // ISO date string
    schoolName?: string | null;
    schoolType?: string | null;
    schoolAddress?: string | null;
    pinCode?: string | null;
    state?: string | null;
}

export interface IStudentDetails {
    studentName?: IName | null;
    studentNameKannada?: IName | null;
    fatherName?: IName | null;
    fatherNameKannada?: IName | null;
    motherName?: IName | null;
    motherNameKannada?: IName | null;
    dateOfBirth?: string | null; // ISO date string
    age?: number | null;
    ageReason?: string | null;
    gender?: string | null;
    religion?: string | null;
    nationality?: string | null;
    aadhaarNumber?: string | null;
    fatherAadhaar?: string | null;
    motherAadhaar?: string | null;
    socialCategory?: string | null;
    casteDetails?: ICasteDetails | null;
    belongsToBPL?: boolean | null;
    bplCardNumber?: string | null;
    bhagyalakshmiBondNo?: string | null;
    childWithSpecialNeed?: string | null;
    specialCategory?: string | null;
}

export interface IContactDetails {
    currentAddress?: IAddress | null;
    permanentAddress?: IAddress | null;
    studentEmail?: string | null;
    fatherMobile?: string | null;
    motherMobile?: string | null;
    admissionDate?: string | null; // ISO date string
}

export interface IBankDetails {
    bankName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
}

export interface IStudent {
    id?: string | null;
    branchId?: number | null;
    latestAcademicYear?: IProfileConfig | null;
    admissionDetails?: IAdmissionDetails | null;
    previousSchoolDetails?: IPreviousSchoolDetails | null;
    studentDetails?: IStudentDetails | null;
    contactDetails?: IContactDetails | null;
    bankDetails?: IBankDetails | null;
}

export type NewStudent = Omit<IStudent, 'id'> & { id: null };

export function createNewStudent(): NewStudent {
    return {
        id: null,
        branchId: null,
        latestAcademicYear: null,
        admissionDetails: {
            typeOfStudent: null,
            admissionClass: null,
            mediumOfInstruction: null,
            section: null,
            motherTongue: null,
            languageGroup: null
        },
        previousSchoolDetails: {
            schoolName: null,
            schoolType: null,
            state: null
        },
        studentDetails: {
            studentName: { firstName: null, middleName: null, lastName: null },
            studentNameKannada: { firstName: null, middleName: null, lastName: null },
            fatherName: { firstName: null, middleName: null, lastName: null },
            motherName: { firstName: null, middleName: null, lastName: null },
            gender: null,
            religion: null,
            nationality: 'Indian',
            socialCategory: null,
            casteDetails: {},
            belongsToBPL: false
        },
        contactDetails: {
            currentAddress: { type: null },
            permanentAddress: { type: null },
            admissionDate: null
        },
        bankDetails: {}
    };
}
