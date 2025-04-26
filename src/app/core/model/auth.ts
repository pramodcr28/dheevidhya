import { IGuardianProfile, IHeadMasterProfile, IHeadOfDepartmentProfile, IITAdministratorProfile, ILecturerProfile, IPrincipalProfile, IProfessorProfile, ISportsCoachProfile, IStudentProfile, ISubstituteTeacherProfile, ITeacherProfile } from "./roles-profile";

export class Login {
    constructor(
      public username: string,
      public password: string,
      public rememberMe: boolean,
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
      public imageUrl: string | null,
    ) {}
  }
  
  export enum Gender {
    MALE = 'MALE',
  
    FEMALE = 'FEMALE',
  
    OTHER = 'OTHER',
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

  export interface IProfileConfig {
    id: number;
    userId?: number | null;
    academicYear?: string | null;
    username?: string | null;
    email?: string | null;
    fullName?: string | null;
    contactNumber?: string | null;
    reportsTo?: string | null;
    gender?: keyof typeof Gender | null;
    departments?: Number[] | null;
    roles?: IRoleConfigs | null;
  }
  