import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AssignmentService } from '../../service/assignment.service';
import { Assignment, AssignmentSubmission, SubmissionStatus } from '../../models/assignment.model';
import { Store } from '@ngrx/store';
import { TreeNode } from 'primeng/api';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments } from '../../../core/store/user-profile/user-profile.selectors';
import { IExaminationSubject } from '../../models/examination.model';
import { IDepartmentConfig } from '../../models/org.model';
import { CommonService } from '../../../core/services/common.service';
import { AddAssignmentDialogComponent } from './add-assignment-dialog/add-assignment-dialog.component';
import { SubmitAssignmentDialogComponent } from './submit-assignment-dialog/submit-assignment-dialog.component';
import { TooltipModule } from 'primeng/tooltip';
import { ApiLoaderService } from '../../../core/services/loaderService';

@Component({
    selector: 'app-assignment-management',
    standalone: true,
    imports: [CommonModule, ButtonModule, TableModule, CardModule, TagModule, AddAssignmentDialogComponent, SubmitAssignmentDialogComponent,TooltipModule],
    templateUrl: './assignment-management.component.html'
})
export class AssignmentManagementComponent implements OnInit {
    currentView: 'cards' | 'submissions' = 'cards';
    showAddDialog = false;
    treeNodes: TreeNode[] = [];
    selectedStatus: string = '';
    selectedType: string = '';
    selectedCategory: string = '';
    typeOptions = [
        { label: 'HOMEWORK', value: 'HOMEWORK' },
        { label: 'PROJECT', value: 'PROJECT' },
        { label: 'QUIZ', value: 'QUIZ' }
    ];

    assignmentSubmissions = [
    ];
    assignments: Assignment[] = [];
    newAssignment: Partial<Assignment> = {};
    calendarDates: number[] = [];
    assignmentService = inject(AssignmentService);
    selectedDepartment: IDepartmentConfig;
    private store = inject(Store<{ userProfile: UserProfileState }>);
    associatedDepartments: any[] = [];
    selectedSubject: TreeNode;
    showSubmitDialog = false;
    commonService = inject(CommonService);
    selectedAssignment: any = null;
    assignmentSubmission: AssignmentSubmission = null;
    isStudentView = true;
    loader = inject(ApiLoaderService); 
    ngOnInit(): void {
        this.apiCall();
        this.store.select(getAssociatedDepartments).subscribe((departments) => {
            this.associatedDepartments = departments;
        });
    }

    apiCall() {
        this.loader.show("Fetching Assignments");
        this.assignmentService.search().subscribe((result) => {
            this.assignments = result.content;
            this.loader.hide();
        });
    }
    onDepartmentChange() {
        if (this.selectedDepartment) {
            this.newAssignment.departmentId = this.selectedDepartment?.id;
            this.treeNodes = this.selectedDepartment?.department.classes?.map((cls) => ({
                label: 'Class: ' + cls.name,
                key: cls.name,
                data: cls,
                children: cls.sections.map((sec) => ({
                    label: 'Section: ' + sec.name,
                    key: cls.name + ':' + sec.name,
                    data: sec,
                    children: sec.subjects.map((sub) => {
                        let subject: IExaminationSubject = { id: sub.id, name: sub.name, className: cls.name, sectionName: sec.name, departmentName: this.selectedDepartment.department.name };
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

    getStatusColor(status: string): string {
        const colors = {
            PUBLISHED: 'bg-yellow-400',
            ONGOING: 'bg-blue-400',
            Completed: 'bg-green-400',
            Overdue: 'bg-red-400'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-400';
    }

    getStatusBorderColor(status: string): string {
        const colors = {
            Pending: 'border-yellow-400',
            Completed: 'border-green-400',
            Overdue: 'border-red-400'
        };
        return colors[status as keyof typeof colors] || 'border-gray-400';
    }

    getTypeSeverity(type: string): any {
        const severities = {
            HOMEWORK: 'info',
            PROJECT: 'success',
            EXAM: 'danger',
            QUIZ: 'warn'
        };
        return severities[type as keyof typeof severities] || 'secondary';
    }

    getAssignmentsForDate(date: number): Assignment[] {
        const dateStr = `2025-02-${date.toString().padStart(2, '0')}`;
        return this.assignments.filter((assignment) => assignment.dueDate === dateStr);
    }

    getAssignmentColorClass(assignment: Assignment): string {
        const typeColors = {
            HOMEWORK: 'bg-blue-100 text-blue-800',
            PROJECT: 'bg-green-100 text-green-800',
            EXAM: 'bg-red-100 text-red-800',
            QUIZ: 'bg-yellow-100 text-yellow-800'
        };
        return typeColors[assignment.type] || 'bg-gray-100 text-gray-800';
    }

    viewAssignment(assignment: Assignment) {
        this.selectedAssignment = assignment;
             const searchRequest = {
                    page: 0,
                    size: 100,
                    sortBy: 'status',
                    sortDirection: 'DESC',
                    filters: {}
                    };

          this.commonService.currentUser.subscribe((user) => {
            searchRequest.filters['assignmentId'] = this.selectedAssignment.id;
            if (user.roles?.student) {
              searchRequest.filters['studentId.like'] = user.userId;
               this.isStudentView = true;
            }else{
              this.isStudentView = false;
            }
            this.loader.show("Fetching Assignments");
         this.assignmentService.searchSubmission(searchRequest).subscribe(response=>{
             this.loader.hide();
           if (user.roles?.student) {
               if(response?.content.length){
                  this.assignmentSubmission = response?.content[0];
                  this.showSubmitDialog = true;
               }else{
                  this.newAssignmentSubmission(user);
               }
            }else{
               this.currentView = 'submissions';  
               this.assignmentSubmissions = response?.content;
            }
        })
        });
         
    }

    viewAssignmentSubmition(submission :AssignmentSubmission){
       this.assignmentSubmission = submission;
       this.showSubmitDialog = true;
    }

    backtoAssignmentList(){
      this.currentView = 'cards';  
      this.assignmentSubmissions = [];
      this.assignmentSubmission = null;
    }


    newAssignmentSubmission(user){
          this.showSubmitDialog = true;
           this.assignmentSubmission = {
            id: null,
            departmentId: this.selectedAssignment.departmentId,
            assignmentId: this.selectedAssignment.id,
            studentId: user.userId,
            studentName: user.fullName,
            status: SubmissionStatus.SUBMITTED,
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
        if (this.newAssignment.title && this.newAssignment.dueDate) {
            const assignment: Assignment = {
                id: null,
                departmentId: this.selectedDepartment.id,
                className: this.selectedSubject.data.className,
                sectionName: this.selectedSubject.data.sectionName,
                subjectName: this.selectedSubject.data.name,
                title: this.newAssignment.title,
                description: this.newAssignment.description || '',
                assignedDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(this.newAssignment.dueDate!).toISOString().split('T')[0],
                type: (this.newAssignment.type as any) || 'HOMEWORK',
                visibilityType: 'GROUP',
                assignedStudentIds: [],
                status: 'PUBLISHED'
            };

            this.assignmentService.create(assignment).subscribe((result) => {
                this.apiCall();
                this.showAddDialog = false;
                this.newAssignment = {};
            });
        }
    }

    submitAssignment() {
        this.commonService.currentUser.subscribe((user) => {
            if (user.roles?.student) {
                this.assignmentSubmission.studentName = user.fullName;
                this.assignmentSubmission.studentId = user.userId;
                this.assignmentSubmission.status = SubmissionStatus.SUBMITTED
            } else {
                this.assignmentSubmission.evaluatedBy = user.userId;
                this.assignmentSubmission.evaluatedOn = new Date().toISOString();
                this.assignmentSubmission.status = SubmissionStatus.REVIEWED
            }
            this.assignmentService.createSubmission(this.assignmentSubmission).subscribe((response) => {
                // console.log(response);
            });
            this.showSubmitDialog = false;
        });
    }
}
