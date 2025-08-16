export interface Assignment {
  id: string;
  departmentId: string;
  className: string;
  sectionName: string;
  subjectName: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  type: 'HOMEWORK' | 'PROJECT' | 'EXAM' | 'QUIZ';
  visibilityType: 'GROUP' | 'INDIVIDUAL';
  assignedStudentIds: string[];
  status?: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'OVERDUE';
}


// submission.model.ts
export enum SubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  LATE = 'LATE',
  REVIEWED = 'REVIEWED',
  REJECTED = 'REJECTED'
}

export interface AssignmentSubmission {
  id: string;
  departmentId: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  status: SubmissionStatus;
  submissionDate: string;
  attachments: string[];
  response: string;
  grade?: string;
  detailedComments?: string;
  evaluatedBy?: string;
  evaluatedOn?: string;
  totalMarks?: number;
  feedback?: string
} 