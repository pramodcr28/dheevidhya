import dayjs from "dayjs/esm";
import { IBranch } from "./tenant.model";
import { Gender } from "../../core/model/auth";

export interface ITenantAuthority {
    name: string;
  }
  
  export type NewTenantAuthority = Omit<ITenantAuthority, 'name'> & { name: null };
  

export interface ITenantUser {
    id: number;
    login?: string | null;
    passwordHash?: string | null;
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
    activationKey?: string | null;
    resetKey?: string | null;
    createdBy?: string | null;
    createdDate?: dayjs.Dayjs | null;
    resetDate?: dayjs.Dayjs | null;
    isTenantUser?: boolean | null;
    lastModifiedBy?: string | null;
    lastModifiedDate?: dayjs.Dayjs | null;
    authorities?: ITenantAuthority[] | null;
    branch?: IBranch | null;
    profile?: IProfileConfig | null
  }
  
  export type NewTenantUser = Omit<ITenantUser, 'id'> & { id: null };
  
//  Profile config related models
  
export interface IProfileConfig {
  id: number;
  userId?: String | null;
  academicYear?: string | null;
  username?: string | null;
  email?: string | null;
  fullName?: string | null;
  contactNumber?: string | null;
  reportsTo?: string | null;
  gender?: keyof typeof Gender | null;
  departments?: string[] | null;
  roles?: IRoleConfigs | null;
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
}


export interface IStudentProfile {
  rollNumber?: string | null;
  classId? : number | null;
    sectionId? : number | null;
}

export interface IGuardianProfile {
  childrens?: string | null;
  email?: string | null;
  contactNumber?: string | null;
}


export interface ITeacherProfile {}


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


export interface ILecturerProfile {}

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
