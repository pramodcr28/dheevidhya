import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { MessageService, TreeNode } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments } from '../../../core/store/user-profile/user-profile.selectors';
import { Assignment, AssignmentSubmission, SubmissionStatus } from '../../models/assignment.model';
import { IExaminationSubject } from '../../models/examination.model';
import { IDepartmentConfig } from '../../models/org.model';
import { AssignmentService } from '../../service/assignment.service';
import { CommonService } from './../../../core/services/common.service';
import { AddAssignmentDialogComponent } from './add-assignment-dialog/add-assignment-dialog.component';
import { SubmitAssignmentDialogComponent } from './submit-assignment-dialog/submit-assignment-dialog.component';

@Component({
    selector: 'app-assignment-management',
    standalone: true,
    imports: [CommonModule, ButtonModule, TableModule, CardModule, TagModule, AddAssignmentDialogComponent, SubmitAssignmentDialogComponent, TooltipModule, BadgeModule],
    templateUrl: './assignment-management.component.html'
})
export class AssignmentManagementComponent implements OnInit {
    // currentView: 'cards' | 'submissions' = 'cards';
    showAddDialog = false;
    treeNodes: TreeNode[] = [];
    selectedStatus: string = '';
    selectedType: string = '';
    selectedCategory: string = '';
    typeOptions = [
        { label: 'HOMEWORK', value: 'HOMEWORK' },
        { label: 'PROJECT', value: 'PROJECT' },
        { label: 'ASSIGNMENT', value: 'ASSIGNMENT' }
    ];

    studentColors = {
        PUBLISHED: { bg: 'bg-yellow-400', text: 'text-yellow-800' },
        DRAFT: { bg: 'bg-gray-400', text: 'text-gray-800' },
        SUBMITTED: { bg: 'bg-purple-400', text: 'text-purple-800' },
        REOPENED: { bg: 'bg-orange-500', text: 'text-orange-800' },
        REVIEWED: { bg: 'bg-green-800', text: 'text-white' } // dark bg, light text
    };

    staffColors = {
        DRAFT: { bg: 'bg-gray-400', text: 'text-gray-800' },
        PUBLISHED: { bg: 'bg-yellow-400', text: 'text-yellow-800' },
        ONGOING: { bg: 'bg-blue-700', text: 'text-blue-100' },
        Completed: { bg: 'bg-green-400', text: 'text-green-800' }
    };

    assignmentSubmissions = [];
    assignments: Assignment[] = [];
    // newAssignment: Partial<Assignment> = {};
    calendarDates: number[] = [];
    assignmentService = inject(AssignmentService);
    selectedDepartment: IDepartmentConfig;
    private store = inject(Store<{ userProfile: UserProfileState }>);
    associatedDepartments: any[] = [];
    selectedSubject: TreeNode;
    showSubmitDialog = false;
    commonService = inject(CommonService);
    selectedAssignment: Partial<Assignment> = {};
    subjectInfo: any = {};
    assignmentSubmission: AssignmentSubmission = null;
    isStudentView = true;
    loader = inject(ApiLoaderService);
    groupedAssignments: any[] = [];
    currentView: 'cards' | 'submissions' | 'group' = 'group';
    selectedGroup = null;
    messageService = inject(MessageService);
    objectKeys = Object.keys;

    ngOnInit(): void {
        // this.apiCall();
        this.store.select(getAssociatedDepartments).subscribe((departments) => {
            this.associatedDepartments = departments;
        });
        this.getGroupedAssignments();
        if (this.commonService.getStudentInfo) {
            this.isStudentView = true;
        } else {
            this.isStudentView = false;
        }
    }

    selectGroup(group) {
        this.currentView = 'cards';
        this.selectedGroup = group;
        let reqBody: any = {};
        let user = this.commonService.currentUser;
        if (user?.roles?.student) {
            reqBody = { subjectName: group.name, className: group.className, sectionName: group.sectionName, departmentId: group.departmentName, 'status.ne': 'DRAFT' };
        } else {
            reqBody = { subjectName: group.subjectName, className: group.className, sectionName: group.sectionName, departmentId: group.departmentId };
        }
        this.subjectInfo = { departmentId: group.departmentId, className: group.className, sectionName: group.sectionName, subjectName: group.subjectName };

        this.assignmentService.search(0, 100, 'id', 'ASC', reqBody).subscribe((result) => {
            this.assignments = result.content;
            this.loader.hide();
        });
    }

    getGroupedAssignments() {
        let reqBody: any = {};
        let user = this.commonService.currentUser;
        if (user?.roles?.student) {
            reqBody = { departmentIds: [this.commonService.getStudentInfo.departmentId], classNames: [this.commonService.getStudentInfo.className], sectionNames: [this.commonService.getStudentInfo.sectionName] };
        } else {
            reqBody = { departmentIds: this.associatedDepartments.map((dept) => dept.id) };
        }
        this.loader.show('Fetching Assignments');
        this.assignmentService.getGroupedAssignments(0, 100, 'id', 'ASC', reqBody).subscribe((result) => {
            this.groupedAssignments = result.content;
            this.loader.hide();
        });
    }

    onDepartmentChange() {
        if (this.selectedDepartment) {
            this.selectedAssignment.departmentId = this.selectedDepartment?.id;
            this.treeNodes = this.selectedDepartment?.department.classes?.map((cls) => ({
                label: 'Class: ' + cls.name,
                key: cls.name,
                data: cls,
                children: cls.sections.map((sec) => ({
                    label: 'Section: ' + sec.name,
                    key: cls.name + ':' + sec.name,
                    data: sec,
                    children: sec.subjects.map((sub) => {
                        let subject: IExaminationSubject = { id: sub.id, name: sub.name, className: cls.name, sectionName: sec.name, departmentName: this.selectedDepartment.department.name, sectionId: sec.id, classId: cls.id?.toString() };
                        return {
                            label: `${sub.name}`,
                            key: cls.name + ':' + sec.name + ':' + sub.name + ':' + sub.id,
                            data: subject
                        };
                    })
                }))
            }));
        }
    }

    get filteredAssignments() {
        return this.assignments.filter((assignment) => {
            const statusMatch = !this.selectedStatus || assignment.status === this.selectedStatus;
            const typeMatch = !this.selectedType || assignment.type === this.selectedType;
            return statusMatch && typeMatch;
        });
    }

    get latestTasks() {
        return this.assignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);
    }

    setView(view: 'cards' | 'submissions') {
        this.currentView = view;
    }

    getActiveColors() {
        return this.isStudentView ? this.studentColors : this.staffColors;
    }

    getStatusColor(assignment: Assignment): string {
        let status: any = assignment.status;

        if (assignment.submission) {
            status = assignment.submission.status;
        }
        const colorMap = { ...this.studentColors, ...this.staffColors };
        const colors = colorMap[status] || { bg: 'bg-gray-400', text: 'text-gray-800' };

        return `${colors.bg} ${colors.text} p-1 rounded-md text-xs`;
    }

    getSubmissionStatusClass(submission: AssignmentSubmission): string {
        const status = submission?.status;
        const colorMap = { ...this.studentColors, ...this.staffColors };
        const colors = colorMap[status] || { bg: 'bg-gray-400', text: 'text-gray-800' };
        return `${colors.bg} ${colors.text} px-2 py-1 rounded-md text-xs`;
    }

    // getAssignmentsForDate(date: number): Assignment[] {
    //     const dateStr = `2025-02-${date.toString().padStart(2, '0')}`;
    //     return this.assignments.filter((assignment) => assignment.dueDate === dateStr);
    // }

    viewAssignment(assignment: Assignment) {
        this.selectedAssignment = assignment;
        const searchRequest = {
            page: 0,
            size: 100,
            sortBy: 'status',
            sortDirection: 'DESC',
            filters: {}
        };

        searchRequest.filters['assignmentId'] = this.selectedAssignment.id;
        if (this.isStudentView) {
            searchRequest.filters['studentId.like'] = this.commonService.currentUser.userId;
        }
        this.loader.show('Fetching Assignments');
        this.assignmentService.searchSubmission(searchRequest).subscribe((response) => {
            this.loader.hide();
            if (this.commonService.currentUser?.roles?.student) {
                if (response?.content.length) {
                    this.assignmentSubmission = response?.content[0];
                    this.showSubmitDialog = true;
                } else {
                    this.newAssignmentSubmission(this.commonService.currentUser);
                }
            } else {
                this.currentView = 'submissions';
                this.assignmentSubmissions = response?.content;
            }
        });
    }

    viewAssignmentSubmition(submission: AssignmentSubmission) {
        this.assignmentSubmission = submission;
        this.showSubmitDialog = true;
    }

    backtoAssignmentList() {
        this.currentView = 'cards';
        this.assignmentSubmissions = [];
        this.assignmentSubmission = null;
    }

    newAssignmentSubmission(user) {
        this.showSubmitDialog = true;
        this.assignmentSubmission = {
            id: null,
            departmentId: this.selectedAssignment.departmentId,
            assignmentId: this.selectedAssignment.id,
            studentId: user.userId,
            studentName: user.fullName,
            status: SubmissionStatus.DRAFT,
            submissionDate: new Date().toISOString(),
            response: '',
            attachments: [],
            grade: null,
            totalMarks: null,
            feedback: null,
            evaluatedBy: null,
            evaluatedOn: null
        };
    }

    addAssignment() {
        // still pending functionality visibilityType assignedStudentIds
        this.loader.show('updating Assignment');

        if (this.selectedAssignment && !this.selectedAssignment.id && this.subjectInfo) {
            this.selectedAssignment = { ...this.selectedAssignment, ...this.subjectInfo, visibilityType: 'GROUP' };
        }
        this.selectedAssignment = { ...this.selectedAssignment, dueDate: this.commonService.formatDateForApi(new Date(this.selectedAssignment.dueDate!)) };
        this.assignmentService.create(this.selectedAssignment).subscribe((result) => {
            this.loader.hide();
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Assignment Added Successfully!',
                life: 3000
            });
            this.getGroupedAssignments();
            this.selectGroup(this.selectedGroup);
            this.selectedAssignment = {};
            this.showAddDialog = false;
        });
    }

    editAssignment(assignment: Assignment) {
        this.selectedAssignment = assignment;
        this.showAddDialog = true;
        // open dialog or navigate to edit page
    }

    deleteAssignment(assignment: Assignment) {
        if (assignment && assignment.id) {
            this.assignmentService.delete(assignment.id).subscribe((result) => {
                this.getGroupedAssignments();
                this.selectGroup(this.selectedGroup);
                this.showAddDialog = false;
                this.selectedAssignment = {};
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Assignment Deleted Successfully!',
                    life: 3000
                });
            });
        }
    }

    submitAssignment() {
        if (this.commonService.getStudentInfo) {
            this.assignmentSubmission.studentName = this.commonService.getStudentInfo.fullName;
            this.assignmentSubmission.studentId = this.commonService.getStudentInfo.userId;
            // this.assignmentSubmission.status = SubmissionStatus.SUBMITTED;
        } else {
            this.assignmentSubmission.evaluatedBy = this.commonService.getUserInfo.userId;
            this.assignmentSubmission.evaluatedOn = new Date().toISOString();
            // this.assignmentSubmission.status = SubmissionStatus.REVIEWED;
        }

        this.assignmentService.createSubmission(this.assignmentSubmission).subscribe((response) => {
            this.getGroupedAssignments();
            this.selectGroup(this.selectedGroup);
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Assignment Submitted Successfully!',
                life: 3000
            });
        });
        this.showSubmitDialog = false;
    }
}
