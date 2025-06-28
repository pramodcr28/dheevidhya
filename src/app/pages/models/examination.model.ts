export interface IExaminationSubject {
  name: string;
  id:string;
  departmentName:string;
  sectionName:string;
  className:string;
}


export enum ExamType {
  UNIT_TEST = 'UNIT_TEST',
  SEMISTER_EXAM = 'SEMISTER_EXAM',
  MID_TERM = 'MID_TERM',
  PRE_FINAL = 'PRE_FINAL',
  FINAL = 'FINAL',
  PRACTICAL = 'PRACTICAL',
  INTERNAL = 'INTERNAL',
  SUPPLEMENTARY = 'SUPPLEMENTARY',
  RE_EXAM = 'RE_EXAM'
}

export enum ExamStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RESCHEDULED = 'RESCHEDULED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  RESULT_DECLARED = 'RESULT_DECLARED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED'
}

export interface ExaminationDTO {
  examId?: string;
  status: ExamStatus;
  departmentId: string;
  branchId: string;
  examType: ExamType;
  resultDeclarationDate?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  subjects: IExaminationSubject[];
}

// Label mappings
export const ExamTypeLabels: Record<ExamType, string> = {
  [ExamType.UNIT_TEST]: 'Unit Test',
  [ExamType.SEMISTER_EXAM]: 'Semester Exam',
  [ExamType.MID_TERM]: 'Mid Term',
  [ExamType.PRE_FINAL]: 'Pre Final',
  [ExamType.FINAL]: 'Final Exam',
  [ExamType.PRACTICAL]: 'Practical Exam',
  [ExamType.INTERNAL]: 'Internal Assessment',
  [ExamType.SUPPLEMENTARY]: 'Supplementary Exam',
  [ExamType.RE_EXAM]: 'Re-exam'
};

export const ExamStatusLabels: Record<ExamStatus, string> = {
  [ExamStatus.DRAFT]: 'Draft',
  [ExamStatus.SCHEDULED]: 'Scheduled',
  [ExamStatus.RESCHEDULED]: 'Rescheduled',
  [ExamStatus.ONGOING]: 'Ongoing',
  [ExamStatus.COMPLETED]: 'Completed',
  [ExamStatus.RESULT_DECLARED]: 'Results Declared',
  [ExamStatus.CANCELLED]: 'Cancelled',
  [ExamStatus.POSTPONED]: 'Postponed'
};

// import { IMasterSubject } from "./org.model";

// export interface IExaminationSection {
//   name: string;
//   subjects: IMasterSubject[];
// }

// export interface IExaminationClass {
//   name: string;
//   sections: IExaminationSection[];
// }

// // export interface IExamStructure {
  
// // }
// export enum ExamType {
//   UNIT_TEST = 'UNIT_TEST',
//   SEMISTER_EXAM = 'SEMISTER_EXAM',
//   MID_TERM = 'MID_TERM',
//   PRE_FINAL = 'PRE_FINAL',
//   FINAL = 'FINAL',
//   PRACTICAL = 'PRACTICAL',
//   INTERNAL = 'INTERNAL',
//   SUPPLEMENTARY = 'SUPPLEMENTARY',
//   RE_EXAM = 'RE_EXAM'
// }
// export enum ExamStatus {
//   DRAFT = 'DRAFT',
//   SCHEDULED = 'SCHEDULED',
//   RESCHEDULED = 'RESCHEDULED',
//   ONGOING = 'ONGOING',
//   COMPLETED = 'COMPLETED',
//   RESULT_DECLARED = 'RESULT_DECLARED',
//   CANCELLED = 'CANCELLED',
//   POSTPONED = 'POSTPONED'
// }


// export interface ExaminationDTO {
//   examId?: string; // Optional if it's generated later

//   status: ExamStatus;

//   departmentId: string;

//   branchId: string;

//   examType: ExamType;

//   resultDeclarationDate?: string; // ISO format date

//   createdBy?: string;

//   createdAt?: string;

//   updatedAt?: string;

//   classes: IExaminationClass[];
// }
