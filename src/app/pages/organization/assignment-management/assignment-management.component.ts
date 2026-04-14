import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { MessageService, TreeNode } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DheeConfirmationService } from '../../../core/services/dhee-confirmation.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments } from '../../../core/store/user-profile/user-profile.selectors';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { Assignment, AssignmentSubmission, SubmissionStatus } from '../../models/assignment.model';
import { IExaminationSubject } from '../../models/examination.model';
import { IDepartmentConfig } from '../../models/org.model';
import { IStudent } from '../../models/student.model';
import { AssignmentService } from '../../service/assignment.service';
import { StudentServiceService } from '../../service/student-service.service';
import { CommonService } from './../../../core/services/common.service';
import { AddAssignmentDialogComponent } from './add-assignment-dialog/add-assignment-dialog.component';
import { SubmitAssignmentDialogComponent } from './submit-assignment-dialog/submit-assignment-dialog.component';

@Component({
    selector: 'app-assignment-management',
    standalone: true,
    imports: [CommonModule, ButtonModule, TableModule, CardModule, TagModule, AddAssignmentDialogComponent, SubmitAssignmentDialogComponent, TooltipModule, BadgeModule, ConfirmationDialogComponent],
    templateUrl: './assignment-management.component.html'
})
export class AssignmentManagementComponent implements OnInit {
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
        DRAFT: { bg: 'bg-gray-400', text: '' },
        SUBMITTED: { bg: 'bg-purple-400', text: 'text-purple-800' },
        REOPENED: { bg: 'bg-orange-500', text: 'text-orange-800' },
        REVIEWED: { bg: 'bg-green-800', text: 'text-white' }, // dark bg, light text,
        PENDING: { bg: 'bg-yellow-400', text: 'text-yellow-800' }
    };

    staffColors = {
        DRAFT: { bg: 'bg-gray-400', text: '' },
        PUBLISHED: { bg: 'bg-yellow-400', text: 'text-yellow-800' },
        ONGOING: { bg: 'bg-blue-700', text: 'text-blue-100' },
        COMPLETED: { bg: 'bg-green-400', text: 'text-green-800' }
    };

    assignmentSubmissions = [];
    assignments: Assignment[] = [];
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
    loader = inject(ApiLoaderService);
    groupedAssignments: any[] = [];
    currentView: 'cards' | 'submissions' | 'group' = 'group';
    selectedGroup = null;
    messageService = inject(MessageService);
    dheeConfirmationService = inject(DheeConfirmationService);
    objectKeys = Object.keys;
    students = signal<IStudent[]>([]);
    studentService = inject(StudentServiceService);
    totalItems = 0;
    page = 0;
    itemsPerPage = 200;
    sortField = 'id';
    sortOrder: 'ASC' | 'DESC' = 'DESC';
    ngOnInit(): void {
        this.store.select(getAssociatedDepartments).subscribe((departments) => {
            this.associatedDepartments = departments;
        });
        this.getGroupedAssignments();
    }

    loadSectionAssociatedStudents(req: any): void {
        this.students.set([]);
        this.studentService
            .search({
                page: this.page,
                size: this.itemsPerPage,
                sortBy: this.sortField,
                sortDirection: this.sortOrder,
                filters: {
                    'branchId.equals': this.commonService.branch?.id,
                    'latestAcademicYear.roles.student.deptId.in': req.departmentId,
                    'latestAcademicYear.roles.student.sectionName.in': req.sectionName,
                    'latestAcademicYear.roles.student.className.in': req.className
                }
            })
            .subscribe({
                next: (res: any) => {
                    this.students.set(res.content || []);
                    this.assignmentService.search(0, 100, 'id', 'ASC', req).subscribe((result) => {
                        this.assignments = result.content;
                        this.loader.hide();
                    });
                },
                error: () => {}
            });
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
        this.loadSectionAssociatedStudents(this.subjectInfo);
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

    // setView(view: 'cards' | 'submissions') {
    //     this.currentView = view;
    // }

    getActiveColors() {
        return this.commonService.isStudent ? this.studentColors : this.staffColors;
    }

    getStatusColor(assignment: Assignment): string {
        let status: any = assignment.status;

        if (assignment.submission) {
            status = assignment.submission.status;
        }
        const colorMap = { ...this.studentColors, ...this.staffColors };
        const colors = colorMap[status] || { bg: 'bg-gray-400', text: '' };

        return `${colors.bg} ${colors.text} p-1 rounded-md text-xs`;
    }

    getSubmissionStatusClass(submission: AssignmentSubmission): string {
        const status = submission?.status;
        const colorMap = { ...this.studentColors, ...this.staffColors };
        const colors = colorMap[status] || { bg: 'bg-gray-400', text: '' };
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
        if (this.commonService.isStudent) {
            searchRequest.filters['studentId.eq'] = this.commonService.currentUser.userId;
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

                this.assignmentSubmissions = [];
                const submissionMap = new Map();

                (response?.content || []).forEach((sub) => {
                    submissionMap.set(sub.studentId, sub);
                });
                this.students().forEach((stu) => {
                    const existing = submissionMap.get(stu.id + '');

                    if (existing) {
                        this.assignmentSubmissions.push(existing);
                    } else {
                        this.assignmentSubmissions.push({
                            studentId: stu.id,
                            studentName: stu.latestAcademicYear?.fullName,
                            status: 'PENDING',
                            submissionDate: null,
                            response: null,
                            attachments: [],
                            feedback: null
                        });
                    }
                });
                // this.assignmentSubmissions = [];
                // console.log(JSON.stringify(this.students()));
                // this.students().forEach((stu) => {
                //     this.assignmentSubmissions.push();
                // });
                // this.assignmentSubmissions = response?.content;
                // console.log(JSON.stringify(this.assignmentSubmissions));
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
        if (!this.selectedAssignment?.title || this.selectedAssignment.title.trim().length < 3) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Title must be at least 3 characters long.',
                life: 3000
            });
            return;
        }

        if (!this.selectedAssignment?.description || this.selectedAssignment.description.trim().length < 5) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Description must be at least 5 characters long.',
                life: 3000
            });
            return;
        }

        if (!this.selectedAssignment?.dueDate) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Please select a due date.',
                life: 3000
            });
            return;
        }

        // ---- API CALL ----
        this.loader.show('Updating Assignment');

        if (this.selectedAssignment && !this.selectedAssignment.id && this.subjectInfo) {
            this.selectedAssignment = {
                ...this.selectedAssignment,
                ...this.subjectInfo,
                visibilityType: 'GROUP'
            };
        }

        this.selectedAssignment = {
            ...this.selectedAssignment,
            dueDate: this.commonService.formatDateForApi(new Date(this.selectedAssignment.dueDate!))
        };

        this.assignmentService.create(this.selectedAssignment).subscribe({
            next: () => {
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
            },
            error: () => {
                this.loader.hide();

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to add assignment.',
                    life: 3000
                });
            }
        });
    }

    addNewAssignment() {
        this.selectedAssignment = {};
        this.showAddDialog = true;
    }

    editAssignment(assignment: Assignment) {
        this.selectedAssignment = { ...assignment, dueDate: new Date(assignment.dueDate) };
        this.showAddDialog = true;
    }

    deleteAssignment(assignment: Assignment) {
        if (assignment && assignment.id) {
            this.dheeConfirmationService.confirm({
                header: 'Confirm Deletion',
                message: 'Are you sure you want to delete this assignment?',
                icon: 'pi pi-exclamation-triangle',
                acceptButtonClass: 'p-button-danger',
                accept: () => {
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
                },
                reject: () => {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Cancelled',
                        detail: 'Assignment deletion cancelled.',
                        life: 3000
                    });
                }
            });
        }
    }

    submitAssignment() {
        let successMessage = 'Assignment Submitted Successfully!';
        if (this.commonService.getStudentInfo) {
            this.assignmentSubmission.studentName = this.commonService.getStudentInfo.fullName;
            this.assignmentSubmission.studentId = this.commonService.getStudentInfo.userId;
            // this.assignmentSubmission.status = SubmissionStatus.SUBMITTED;
        } else {
            this.assignmentSubmission.evaluatedBy = this.commonService.getUserInfo.userId;
            this.assignmentSubmission.evaluatedOn = this.commonService.formatDateTimeForApi(new Date());
            // this.assignmentSubmission.status = SubmissionStatus.REVIEWED;
            successMessage = 'Assignment Reviewed';
        }

        this.assignmentService.createSubmission(this.assignmentSubmission).subscribe((response) => {
            this.getGroupedAssignments();
            this.selectGroup(this.selectedGroup);

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: successMessage,
                life: 3000
            });
        });
        this.showSubmitDialog = false;
    }
}
