import {
    IGuardianProfile,
    IHeadMasterProfile,
    IHeadOfDepartmentProfile,
    IITAdministratorProfile,
    ILecturerProfile,
    IPrincipalProfile,
    IProfessorProfile,
    ISportsCoachProfile,
    IStudentProfile,
    ISubstituteTeacherProfile,
    ITeacherProfile
} from '../../pages/models/user.model';

export class Login {
    constructor(
        public username: string,
        public password: string,
        public rememberMe: boolean
    ) {}
}

export class Account {
    constructor(
        public activated: boolean,
        public authorities: string[],
        public email: string,
        public firstName: string | null,
        public langKey: string,
        public lastName: string | null,
        public login: string,
        public imageUrl: string | null
    ) {}
}

export enum Gender {
    MALE = 'MALE',

    FEMALE = 'FEMALE',

    OTHER = 'OTHER'
}

export interface IRoleConfigs {
    student?: IStudentProfile | null;
    parent?: IGuardianProfile | null;
    teacher?: ITeacherProfile | null;
    lecturer?: ILecturerProfile | null;
    professor?: IProfessorProfile | null;
    headofdepartment?: IHeadOfDepartmentProfile | null;
    headmaster?: IHeadMasterProfile | null;
    principal?: IPrincipalProfile | null;
    viceprincipal?: IPrincipalProfile | null;
    sportscoach?: ISportsCoachProfile | null;
    substituteteacher?: ISubstituteTeacherProfile | null;
    itadmin?: IITAdministratorProfile | null;
}
export interface PasswordChangeDTO {
    currentPassword: string;
    newPassword: string;
    isTenantUser: boolean;
}
