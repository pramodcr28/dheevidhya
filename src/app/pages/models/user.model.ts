import { Gender } from '../../core/model/auth';

export interface ITenantAuthority {
    name: string;
}

export enum ProfileType {
    STUDENT = 'STUDENT',
    GUARDIAN = 'GUARDIAN',
    STAFF = 'STAFF'
}

export type NewTenantAuthority = Omit<ITenantAuthority, 'name'> & { name: null };

export interface ITenantUser {
    id: number;
    login?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    imageUrl?: string | null;
    activated?: boolean | null;
    langKey?: string | null;
    houseNumber?: string | null;
    street?: string | null;
    locality?: string | null;
    landmark?: string | null;
    taluk?: string | null;
    district?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    branchId?: number | null;
    authorities?: ITenantAuthority[] | null;
    latestAcademicYear?: IProfileConfig | null;
    status?: UserStatus | null;
}

export type NewTenantUser = Omit<ITenantUser, 'id'> & { id: null };

export enum UserStatus {
    ACTIVE,
    EXITED,
    PROMOTED,
    INACTIVE
}

export interface IProfileConfig {
    id: number;
    userId?: string | null;
    academicYear?: string | null;
    username?: string | null;
    email?: string | null;
    fullName?: string | null;
    contactNumber?: string | null;
    reportsTo?: string | null;
    gender?: keyof typeof Gender | null;
    profileType?: keyof typeof ProfileType | null;
    departments?: string[] | null;
    departmentNames?: string[];
    roles?: IRoleConfigs | null;
    subjectIds?: string[] | null;
    status: UserStatus | null;
}

export type NewProfileConfig = Omit<IProfileConfig, 'id'> & { id: null };

export interface IRoleConfigs {
    student?: IStudentProfile | null;
    parent?: IGuardianProfile | null;
    teacher?: ITeacherProfile | null;
    lecturer?: ILecturerProfile | null;
    professor?: IProfessorProfile | null;
    headofdepartment?: IHeadOfDepartmentProfile | null;
    headmaster?: IHeadMasterProfile | null;
    principal?: IPrincipalProfile | null;
    viceprincipal?: IVicePrincipalProfile | null;
    sportscoach?: ISportsCoachProfile | null;
    substituteteacher?: ISubstituteTeacherProfile | null;
    itadmin?: IITAdministratorProfile | null;
    admin?: AdministratorProfile | null;
}

export interface IStudentProfile {
    rollNumber?: string | null;
    classId?: number | null;
    sectionId?: number | null;
    className: string | null;
    sectionName: string | null;
    deptId?: number | null;
    deptName: string | null;
    guardianId?: number | null;
}

export interface IGuardianProfile {
    childrens?: string[] | null;
    email?: string | null;
    contactNumber?: string | null;
}

export interface ITeacherProfile {
    subjectIds?: string[] | null;
}

export interface ISubstituteTeacherProfile {}

export interface ISportsCoachProfile {
    sportsManaged?: string | null;
}

export interface IProfessorProfile {
    researchAreas?: string | null;
    publications?: string | null;
}

export interface IPrincipalProfile {
    responsibilities?: string | null;
}

export interface ILecturerProfile {
    subjectIds?: string[] | null;
}

export interface IITAdministratorProfile {
    responsibilities?: string | null;
}

export interface IHeadOfDepartmentProfile {
    responsibilities?: string | null;
}

export interface IHeadMasterProfile {
    responsibilities?: string | null;
}

export interface IVicePrincipalProfile {
    responsibilities?: string | null;
}

export interface AdministratorProfile {}
