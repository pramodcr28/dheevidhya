export interface Assignment {
    id: string;
    departmentId: string;
    className: string;
    sectionName: string;
    subjectName: string;
    title: string;
    description: string;
    assignedDate: string;
    dueDate: string | Date;
    type: 'HOMEWORK' | 'PROJECT' | 'EXAM' | 'QUIZ';
    visibilityType: 'GROUP' | 'INDIVIDUAL';
    assignedStudentIds: string[];
    status?: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'OVERDUE';
    submission?: AssignmentSubmission;
}

// submission.model.ts
export enum SubmissionStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    REVIEWED = 'REVIEWED',
    REOPENED = 'REOPENED'
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
    feedback?: string;
}
