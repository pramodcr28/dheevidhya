import { CommonModule, formatDate } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AccordionModule } from 'primeng/accordion';
import { MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TreeSelectModule } from 'primeng/treeselect';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments, getBranch } from '../../../core/store/user-profile/user-profile.selectors';
import { ExaminationDTO, ExamStatusLabels, ExamTypeLabels } from '../../models/examination.model';
import { IDepartmentConfig } from '../../models/org.model';
import { IBranch } from '../../models/tenant.model';
import { Subject } from '../../models/time-table';
import { ExaminationService } from '../../service/examination.service';
import { ExamSlotsComponent } from '../exam-slots/exam-slots.component';
import { CommonService } from './../../../core/services/common.service';
import { ExaminationTimeTable, IExaminationSubject } from './../../models/examination.model';
@Component({
    selector: 'app-add-exam',
    standalone: true,
    imports: [
        TableModule,
        DialogModule,
        DropdownModule,
        InputTextModule,
        ButtonModule,
        ReactiveFormsModule,
        MultiSelectModule,
        FormsModule,
        ChipModule,
        AccordionModule,
        CheckboxModule,
        TreeSelectModule,
        CommonModule,
        SelectModule,
        InputNumberModule,
        ExamSlotsComponent,
        ToastModule
    ],
    templateUrl: './add-exam.component.html',
    styles: ``,
    providers: [MessageService]
})
export class AddExamComponent {
    private store = inject(Store<{ userProfile: UserProfileState }>);
    associatedDepartments: any[] = [];
    selectedDepartment: IDepartmentConfig;
    currentBranch: IBranch;
    treeNodes: TreeNode[] = [];
    selectedSubjects: TreeNode[] = [];
    submitted = false;
    examForm!: FormGroup;
    exams: any[] = [];
    displayDialog = false;
    slotDailog = false;
    selectedExam: ExaminationDTO;
    private examinationService = inject(ExaminationService);
    examTypes = Object.entries(ExamTypeLabels).map(([value, label]) => ({ label, value }));
    examStatuses = Object.entries(ExamStatusLabels).map(([value, label]) => ({ label, value }));
    selectedSubjectsForTimeTable: Subject[] = [];
    constructor(private fb: FormBuilder) {}
    //  timeSlots: ExaminationTimeSlot[] = [];
    timeTable: ExaminationTimeTable = null;
    commonService: CommonService = inject(CommonService);
    loader = inject(ApiLoaderService);
    messageService = inject(MessageService);
    ngOnInit(): void {
        this.store.select(getAssociatedDepartments).subscribe((departments) => {
            this.associatedDepartments = departments;
        });

        this.store.select(getBranch).subscribe((branch) => {
            this.currentBranch = branch;
        });

        this.examForm = this.fb.group({
            totalMarks: [null, Validators.required],
            departmentId: [null, Validators.required],
            branchId: [null, Validators.required],
            examType: [null, Validators.required],
            resultDeclarationDate: [null]
        });
        this.getExams();
    }

    getExams() {
        this.loader.show('Fetching Exams List');
        this.examinationService.search(0, 100, 'id', 'ASC', { 'branchId.equals': this.currentBranch.id?.toString() }).subscribe((res) => {
            this.exams = res.content;
            this.loader.hide();
        });
    }

    clearDailogCache() {
        this.displayDialog = false;
        this.selectedSubjectsForTimeTable = [];
        this.timeTable = null;
        this.selectedSubjects = [];
        this.selectedExam = null;
        this.examForm.reset();
        this.selectedDepartment = null;
        this.getExams();
    }

    openDialog() {
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() + 1); // Tomorrow

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate());

        const dayStartTime = new Date();
        dayStartTime.setHours(10, 0, 0, 0); // 10:00 AM

        const dayEndTime = new Date();
        dayEndTime.setHours(17, 0, 0, 0); // 5:00 PM

        this.timeTable = {
            settings: {
                startDate: startDate,
                endDate: endDate,
                dayStartTime: dayStartTime,
                dayEndTime: dayEndTime,
                breakDuration: 15, // 15 minutes break between slots
                slotDuration: 60, // Each slot is 60 minutes
                slotsPerDay: 1 // 2 slots per day by default
            },
            schedules: []
        };
        this.displayDialog = true;
    }

    openSlotDailog(input: ExaminationDTO) {
        this.examinationService.find(input.examId).subscribe((result) => {
            this.selectedExam = input;
            let exam = result.body;
            this.examForm.patchValue({
                totalMarks: exam.totalMarks,
                departmentId: exam.departmentId,
                branchId: exam.branchId,
                examType: exam.examType,
                resultDeclarationDate: exam.resultDeclarationDate ?? null
            });
            this.timeTable = exam.timeTable;
            this.timeTable.settings.startDate = new Date(this.timeTable.settings.startDate);
            this.timeTable.settings.endDate = new Date(this.timeTable.settings.endDate);
            this.selectedDepartment = this.associatedDepartments.find((dep) => dep.id == exam.departmentId);
            this.onDepartmentChange();
            this.selectedSubjects = this.getSelectedSubjectNodes(exam.subjects, this.treeNodes);
            this.onSubjectChange();
            this.displayDialog = true;
        });
    }

    onDepartmentChange() {
        if (this.selectedDepartment) {
            this.examForm.get('departmentId').setValue(this.selectedDepartment?.id);
            this.examForm.get('branchId').setValue(this.currentBranch.id);
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

    onSubjectChange() {
        const timeTableSubjects: Subject[] = [];

        this.selectedSubjects.forEach((subject, index) => {
            const keyParts = subject.key?.split(':') ?? [];
            if (keyParts.length !== 4) return;

            const [className, sectionName, _subName, _subId] = keyParts;

            const timeTableSubject: Subject = {
                color: this.commonService.themeGradients[index],
                id: _subId,
                teacher: null,
                name: _subName,
                periodsPerWeek: 0
            };

            if (!timeTableSubjects.find((sub) => sub.name === timeTableSubject.name)) {
                timeTableSubjects.push(timeTableSubject);
            }
        });
        this.selectedSubjectsForTimeTable = [...timeTableSubjects];
    }

    get groupedSelectedSubjects() {
        const grouped = new Map();

        for (const node of this.selectedSubjects) {
            const cls = node.data?.className;
            const sec = node.data?.sectionName;
            if (!cls || !sec) continue;

            const key = `${cls}_${sec}`;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    className: cls,
                    key: node.key,
                    sectionName: sec,
                    subjects: []
                });
            }

            grouped.get(key).subjects.push(node);
        }

        return Array.from(grouped.values());
    }

    getColorClass(className: string): string {
        const colors = {
            PRE_KG: 'bg-amber-100',
            LKG: 'bg-lime-100',
            UKG: 'bg-blue-100',
            '1st Grade': 'bg-pink-100',
            '2nd Grade': 'bg-purple-100',
            default: 'bg-gray-100'
        };

        return colors[className] || colors['default'];
    }

    removeSubject(subject: any): void {
        this.selectedSubjects = this.selectedSubjects.filter((s) => s.key !== subject.key);
        this.onSubjectChange();
    }

    groupSubjectsFromTreeNodes(nodes: TreeNode[]): any {
        let subjects = [];
        for (const node of nodes) {
            const keyParts = node.key?.split(':') ?? [];
            if (keyParts.length !== 4) continue;

            const [className, sectionName, _subName, _subId] = keyParts;
            let subject: IExaminationSubject = { id: _subId, name: _subName, className: className, sectionName: sectionName, departmentName: this.selectedDepartment.department.name };
            subjects.push(subject);
        }
        return subjects;
    }

    getSelectedSubjectNodes(subjects: IExaminationSubject[], allTreeNodes: TreeNode[]): TreeNode[] {
        const subjectKeys = new Set(subjects.map((sub) => `${sub.className}:${sub.sectionName}:${sub.name}:${sub.id}`));

        const selected: TreeNode[] = [];

        function collectMatchesWithParentDetection(node: TreeNode): boolean {
            if (!node.children || node.children.length === 0) {
                // Leaf node
                const isMatch = subjectKeys.has(node.key);
                if (isMatch) selected.push(node);
                return isMatch;
            }

            let allChildrenSelected = true;
            for (const child of node.children) {
                const childSelected = collectMatchesWithParentDetection(child);
                if (!childSelected) {
                    allChildrenSelected = false;
                }
            }

            if (allChildrenSelected) {
                selected.push(node);
                return true;
            }

            return false;
        }

        for (const node of allTreeNodes) {
            collectMatchesWithParentDetection(node);
        }

        return selected;
    }

    saveExam() {
        if (this.examForm.valid && this.timeTable.schedules.length >= this.selectedSubjectsForTimeTable.length) {
            this.timeTable.settings.startDate = formatDate(this.timeTable.settings.startDate, this.commonService.dateTimeFormate, 'en-US');
            this.timeTable.settings.endDate = formatDate(this.timeTable.settings.endDate, this.commonService.dateTimeFormate, 'en-US');
            let finalExamData: ExaminationDTO = {
                ...this.examForm.value,
                timeTable: this.timeTable,
                subjects: this.groupSubjectsFromTreeNodes(this.selectedSubjects)
            };

            if (this.selectedExam) {
                finalExamData = {
                    ...this.selectedExam,
                    ...this.examForm.value,
                    timeTable: this.timeTable,
                    subjects: this.groupSubjectsFromTreeNodes(this.selectedSubjects)
                };
            }

            this.examinationService.create(finalExamData).subscribe((result) => {
                this.getExams();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Congrats! exam uplished`
                });
            });
            this.clearDailogCache();
            // this.displayDialog = false;
        }
    }

    ExamTypeLabels = ExamTypeLabels;
    ExamStatusLabels = ExamStatusLabels;
}
