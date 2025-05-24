import dayjs from "dayjs/esm";
import { IBranch } from "./tenant.model";

export interface IDepartmentConfig {
  id: number;
  academicYear?: string | null;
  academicStart?: dayjs.Dayjs | null;
  academicEnd?: dayjs.Dayjs | null;
  status?: boolean | null;
  branch?: IBranch | null;
  department?:IMasterDepartment | null;
}


export type NewDepartmentConfig = Omit<IDepartmentConfig, 'id'> & { id: null };

export interface IMasterDepartment {
  id: number;
  name?: string | null;
  description?: string | null;
  code?: string | null;
  status?: boolean | null;
  hod?:string | null;
  classes?:IMasterClass[] | null;
}

export type NewMasterDepartment = Omit<IMasterDepartment, 'id'> & { id: null };


export interface IMasterClass {
  id: number;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  status?: boolean | null;
  sections?:IMasterSection[] | []
}

export type NewMasterClass = Omit<IMasterClass, 'id'> & { id: null };

export interface IMasterSection {
  id: number;
  name?: string | null;
  code?: string | null;
  capacity?: number | null;
  description?: string | null;
  sectionTeacher?:string | null;
  status?: boolean | null;
  subjects?: IMasterSubject[] | null;
}

export type NewMasterSection = Omit<IMasterSection, 'id'> & { id: null };


export interface IMasterSubject {
  id: number;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  teacher?:string| null;
  subjectType?: string | null;
  status?: boolean | null;
}

export type NewMasterSubject = Omit<IMasterSubject, 'id'> & { id: null };
