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
import { MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TreeSelectModule } from 'primeng/treeselect';
import { ITEMS_PER_PAGE } from '../../../core/model/pagination.constants';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getStudentSectionByIds } from '../../../core/store/user-profile/user-profile.selectors';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationConfig } from '../../models/common.model';
import { ExaminationDTO, ExamStatus, ExamStatusLabels, ExamTypeLabels } from '../../models/examination.model';
import { Subject } from '../../models/time-table';
import { ExamStatusService } from '../../service/exam-status.service';
import { ExaminationService } from '../../service/examination.service';
import { ExamSlotsComponent } from '../exam-slots/exam-slots.component';
import { CommonService } from './../../../core/services/common.service';
import { IExaminationSubject } from './../../models/examination.model';
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
        ToastModule,
        TooltipModule,
        ConfirmationDialogComponent,
        MenuModule
    ],
    templateUrl: './add-exam.component.html',
    styles: ``,
    providers: [MessageService]
})
export class AddExamComponent {
    treeNodes: TreeNode[] = [];
    selectedSubjects: TreeNode[] = [];
    submitted = false;
    fb: FormBuilder = inject(FormBuilder);
    examForm: FormGroup = this.fb.group({});
    displayDialog = false;
    slotDailog = false;
    commonService: CommonService = inject(CommonService);
    loader = inject(ApiLoaderService);
    messageService = inject(MessageService);
    es = inject(ExamStatusService);
    exams: any[] = [];
    examinationService = inject(ExaminationService);
    examTypes = Object.entries(ExamTypeLabels).map(([value, label]) => ({ label, value }));
    examStatuses = Object.entries(ExamStatusLabels).map(([value, label]) => ({ label, value }));

    validationErrors: string[];

    // Confirmation dialog properties
    showConfirmDialog = false;
    confirmConfig: ConfirmationConfig = {
        header: 'Confirmation',
        message: 'Are you sure?'
    };
    pendingAction: (() => void) | null = null;
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 0;
    sortField = 'createdDate';
    sortOrder: 'ASC' | 'DESC' = 'DESC';
    private store = inject(Store<{ userProfile: UserProfileState }>);
    examinationIds = [];
    ngOnInit(): void {
        this.examForm = this.fb.group({
            totalMarks: [null, [Validators.required, Validators.min(1), Validators.max(1000)]],
            departmentId: [null, Validators.required],
            departmentName: [null, Validators.required],
            branchId: [this.commonService.branch?.id?.toString(), Validators.required],
            examType: [null, Validators.required],
            resultDeclarationDate: [null]
        });
        if (this.commonService.isStudent) {
            this.store.select(getStudentSectionByIds(this.commonService.getStudentInfo.departmentId, this.commonService.getStudentInfo.classId, this.commonService.getStudentInfo.sectionId)).subscribe((s) => {
                const examMap = new Map<string, any>();

                s?.subjects?.forEach((subject: any) => {
                    subject?.exams?.forEach((exam: any) => {
                        if (!examMap.has(exam.examId)) {
                            examMap.set(exam.examId, exam);
                        }
                    });
                });

                this.examinationIds = Array.from(examMap.values());

                this.getExams();
            });
        } else {
            this.getExams();
        }
    }

    onPageChange(event: any): void {
        this.itemsPerPage = event.rows;
        this.page = Math.floor(event.first / event.rows);
        this.getExams();
    }

    onSort(event: any): void {
        this.sortField = event.field || 'createdDate';
        this.sortOrder = event.order === 1 ? 'ASC' : 'DESC';
        this.page = 0;
        this.getExams();
    }

    getExams() {
        this.loader.show('Fetching Exams List');
        if (!this.commonService.isStudent) {
            var filterParams: any = { 'branchId.eq': this.commonService.branch?.id?.toString() };
        } else {
            var filterParams: any = { 'examId.in': this.examinationIds.map((e) => e.examId) };
        }
        this.examinationService.search(this.page, this.itemsPerPage, this.sortField, this.sortOrder, filterParams).subscribe((res) => {
            this.exams = res.content;
            this.totalItems = res.totalElements;
            this.loader.hide();
        });
    }

    clearDailogCache() {
        this.displayDialog = false;
        this.es.selectedSubjectsForTimeTable = [];
        this.es.timeTable = null;
        this.selectedSubjects = [];
        this.es.selectedExam = null;
        this.examForm.reset();
        this.es.selectedDepartment = null;
        this.getExams();
    }

    openDialog() {
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() + 1);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate());

        const dayStartTime = new Date();
        dayStartTime.setHours(10, 0, 0, 0);

        const dayEndTime = new Date();
        dayEndTime.setHours(17, 0, 0, 0);

        this.es.timeTable = {
            settings: {
                startDate: startDate,
                endDate: endDate,
                dayStartTime: dayStartTime,
                dayEndTime: dayEndTime,
                breakDuration: 15,
                slotDuration: 60,
                slotsPerDay: 1
            },
            schedules: []
        };
        this.displayDialog = true;
    }

    openSlotDailog(input: ExaminationDTO) {
        this.examinationService.find(input.examId).subscribe((result) => {
            this.es.selectedExam = input;
            let exam = result.body;
            this.examForm?.patchValue({
                totalMarks: exam.totalMarks,
                departmentId: exam.departmentId,
                departmentName: exam.departmentName,
                branchId: exam.branchId,
                examType: exam.examType,
                resultDeclarationDate: exam.resultDeclarationDate ?? null
            });
            this.es.timeTable = exam.timeTable;
            this.es.timeTable.settings.startDate = new Date(this.es.timeTable.settings.startDate);
            this.es.timeTable.settings.endDate = new Date(this.es.timeTable.settings.endDate);
            this.es.timeTable.settings.dayStartTime = new Date(this.es.timeTable.settings.dayStartTime);
            this.es.timeTable.settings.dayEndTime = new Date(this.es.timeTable.settings.dayEndTime);
            this.es.selectedDepartment = this.commonService.associatedDepartments.find((dep) => dep.id == exam.departmentId);
            this.onDepartmentChange();
            this.selectedSubjects = this.getSelectedSubjectNodes(exam.subjects, this.treeNodes);
            this.onSubjectChange();
            this.displayDialog = true;
        });
    }

    onDepartmentChange() {
        if (this.es.selectedDepartment) {
            this.examForm.get('departmentId').setValue(this.es.selectedDepartment?.id);
            this.examForm.get('departmentName').setValue(this.es.selectedDepartment?.department.name);
            this.examForm.get('branchId').setValue(this.commonService.branch?.id?.toString());
            this.treeNodes = this.es.selectedDepartment?.department.classes?.map((cls) => ({
                label: 'Class: ' + cls.name,
                key: cls.name,
                data: cls,
                children: cls.sections.map((sec) => ({
                    label: 'Section: ' + sec.name,
                    key: cls.name + ':' + sec.name,
                    data: sec,
                    children: sec.subjects.map((sub) => {
                        let subject: IExaminationSubject = { id: sub.id, name: sub.name, className: cls.name, sectionName: sec.name, departmentName: this.es.selectedDepartment.department.name, sectionId: sec.id, classId: cls.id?.toString() };
                        return {
                            label: `${sub.name}`,
                            key: cls.name + ':' + sec.name + ':' + sub.name + ':' + sub.id,
                            data: subject
                        };
                    })
                }))
            }));
        }
        this.es.generateTimeTable();
    }

    onSubjectChange() {
        const timeTableSubjects: Subject[] = [];

        this.selectedSubjects.forEach((subject, index) => {
            const keyParts = subject.key?.split(':') ?? [];
            if (keyParts.length !== 4) return;

            const [_subName, _subId] = keyParts.slice(-2);

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

        this.es.selectedSubjectsForTimeTable = [...timeTableSubjects];
        if (!this.es.selectedExam?.examId) {
            if (timeTableSubjects?.length && timeTableSubjects.length < 6) {
                this.es.timeTable.settings.slotsPerDay = 6;
            } else {
                this.es.timeTable.settings.slotDuration = this.es.durationOptions[0].value;
                this.es.timeTable.settings.slotsPerDay = timeTableSubjects.length;
            }
        }

        setTimeout(() => {
            this.es.generateTimeTable();
        });
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

            const [className, sectionName, _subName, _subId, sectionId, classId] = keyParts;
            let subject: IExaminationSubject = { id: _subId, name: _subName, className: className, sectionName: sectionName, departmentName: this.es.selectedDepartment.department.name, sectionId: sectionId, classId: classId };
            subjects.push(subject);
        }
        return subjects;
    }

    getSelectedSubjectNodes(subjects: IExaminationSubject[], allTreeNodes: TreeNode[]): TreeNode[] {
        const subjectKeys = new Set(subjects.map((sub) => `${sub.className}:${sub.sectionName}:${sub.name}:${sub.id}`));

        const selected: TreeNode[] = [];

        function collectMatchesWithParentDetection(node: TreeNode): boolean {
            if (!node.children || node.children.length === 0) {
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

    // validateTimetable(status: String, timeTable): string[] {
    //     this.validationErrors = [];
    //     let isSlotsMissedConfiguration = false;
    //     console.log(this.es.selectedSubjectsForTimeTable);
    //     timeTable?.schedules.forEach((sc) => {
    //         if (!sc.subjectName || sc.subjectName == '') {
    //             isSlotsMissedConfiguration = true;
    //         }
    //     });

    //     if (status != 'DRAFT' && isSlotsMissedConfiguration) {
    //         this.validationErrors.push('Some slots are missing subject assignments.');
    //     }
    //     return this.validationErrors;
    // }

    validateTimetable(status: string, timeTable): string[] {
        this.validationErrors = [];

        if (!timeTable?.schedules?.length) {
            return this.validationErrors;
        }

        const assignedSubjects = new Set<string>();

        timeTable.schedules.forEach((sc) => {
            if (sc.subjectName && sc.subjectName.trim()) {
                assignedSubjects.add(sc.subjectName.trim());
            }
        });

        const missingSubjects = this.es.selectedSubjectsForTimeTable.filter((sub) => sub?.name && !assignedSubjects.has(sub.name.trim()));

        if (status !== 'DRAFT' && missingSubjects.length > 0) {
            this.validationErrors.push(`Selected subjects not added to timetable: ${missingSubjects.map((s) => s.name).join(', ')}`);
        }

        return this.validationErrors;
    }

    saveExam(status: 'DRAFT' | 'SCHEDULED') {
        const errors = this.validateTimetable(status, this.es.timeTable);
        if (errors.length) {
            return;
        }

        this.validationErrors = [];

        if (status === 'DRAFT') {
            this.performSave(status);
            return;
        }

        if (status === 'SCHEDULED') {
            const rule = this.es.getTransitionRule(this.es.selectedExam?.status || ExamStatus.DRAFT, ExamStatus.SCHEDULED);

            this.showConfirmationDialog(
                {
                    header: 'Schedule Exam',
                    message: rule?.confirmationMessage || 'Are you sure you want to schedule this exam?',
                    icon: 'pi pi-question-circle',
                    iconColor: 'text-blue-500',
                    acceptLabel: 'Yes, Schedule',
                    acceptButtonClass: 'p-button-success'
                },
                () => this.performSave(status)
            );
        }
    }

    performSave(status: 'DRAFT' | 'SCHEDULED' | 'RE_SCHEDULED') {
        if (this.examForm.valid && this.es.timeTable.schedules.length >= this.es.selectedSubjectsForTimeTable.length) {
            this.es.timeTable.settings.startDate = formatDate(new Date(this.es.timeTable.settings.startDate), this.commonService.dateTimeFormate, 'en-US');
            this.es.timeTable.settings.endDate = formatDate(new Date(this.es.timeTable.settings.endDate), this.commonService.dateTimeFormate, 'en-US');
            this.es.timeTable.settings.dayStartTime = formatDate(new Date(this.es.timeTable.settings.dayStartTime), this.commonService.dateTimeFormate, 'en-US');
            this.es.timeTable.settings.dayEndTime = formatDate(new Date(this.es.timeTable.settings.dayEndTime), this.commonService.dateTimeFormate, 'en-US');

            let finalExamData: ExaminationDTO = {
                ...this.examForm.value,
                status: status,
                timeTable: this.es.timeTable,
                subjects: this.groupSubjectsFromTreeNodes(this.selectedSubjects)
            };

            if (this.es.selectedExam) {
                finalExamData = {
                    ...this.es.selectedExam,
                    ...this.examForm.value,
                    status: status,
                    timeTable: this.es.timeTable,
                    subjects: this.groupSubjectsFromTreeNodes(this.selectedSubjects)
                };
            }

            const actionText = status === 'DRAFT' ? 'saved as draft' : 'scheduled';

            if (finalExamData.examId) {
                this.examinationService.update(finalExamData).subscribe({
                    next: (result) => {
                        if (result.body.status == 200 || result.body.status == 201) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail: `Examination ${actionText} successfully`
                            });
                            this.clearDailogCache();
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: result.body.error
                            });
                        }
                    }
                });
            } else {
                this.examinationService.create(finalExamData).subscribe({
                    next: (result) => {
                        if (result.body.status == 200 || result.body.status == 201) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail: `Examination ${actionText} successfully`
                            });
                            this.clearDailogCache();
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: result.body.error
                            });
                        }
                    }
                });
            }
        }
    }

    rescheduleExam() {
        const rule = this.es.getTransitionRule(this.es.selectedExam.status, ExamStatus.RE_SCHEDULED);

        this.showConfirmationDialog(
            {
                header: 'Reschedule Exam',
                message: rule?.confirmationMessage || 'Are you sure you want to reschedule this exam?',
                icon: 'pi pi-question-circle',
                iconColor: 'text-orange-500',
                acceptLabel: 'Yes, Reschedule',
                acceptButtonClass: 'p-button-warning'
            },
            () => this.performSave('RE_SCHEDULED')
        );
    }

    isScheduleValid(): boolean {
        return this.es.timeTable?.schedules?.length >= this.es.selectedSubjectsForTimeTable.length;
    }

    ExamTypeLabels = ExamTypeLabels;
    ExamStatusLabels = ExamStatusLabels;

    isSingleDayExam(exam: any): boolean {
        if (!exam.timeTable?.settings?.startDate || !exam.timeTable?.settings?.endDate) {
            return true;
        }
        const start = new Date(exam.timeTable.settings.startDate);
        const end = new Date(exam.timeTable.settings.endDate);
        return start.toDateString() === end.toDateString();
    }

    getStatusMenuItems(exam: any): any[] {
        const availableStatuses = this.es.getAvailableTransitions(exam.status);
        return availableStatuses.map((status) => ({
            label: ExamStatusLabels[status] || status,
            value: status,
            icon: this.es.getStatusIcon(status),
            command: () => this.onStatusMenuClick(exam, status)
        }));
    }

    onStatusMenuClick(exam: any, newStatus: ExamStatus) {
        const currentStatus = exam.status;

        const errors = this.validateTimetable(newStatus, exam.timeTable);
        if (errors.length) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Action',
                detail: `Cannot change status from ${ExamStatusLabels[currentStatus]} to ${ExamStatusLabels[newStatus]} Examination Not Configered Properly`
            });
            return;
        }

        if (!this.es.canTransition(currentStatus, newStatus)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Action',
                detail: `Cannot change status from ${ExamStatusLabels[currentStatus]} to ${ExamStatusLabels[newStatus]}`
            });
            return;
        }

        const rule = this.es.getTransitionRule(currentStatus, newStatus);

        if (rule?.requiresConfirmation) {
            this.showConfirmationDialog(
                {
                    header: `Change Status to ${ExamStatusLabels[newStatus]}`,
                    message: rule.confirmationMessage || `Are you sure you want to change the status to ${ExamStatusLabels[newStatus]}?`,
                    icon: this.es.getStatusIcon(newStatus),
                    iconColor: this.getIconColorForStatus(newStatus),
                    acceptLabel: 'Yes, Change Status',
                    acceptButtonClass: this.getButtonClassForStatus(newStatus)
                },
                () => this.updateExamStatus(exam, newStatus)
            );
        } else {
            this.updateExamStatus(exam, newStatus);
        }
    }

    getStatusDescription(status: ExamStatus): string {
        const descriptions = {
            [ExamStatus.SCHEDULED]: 'Set exam as scheduled',
            [ExamStatus.RE_SCHEDULED]: 'Postpone the exam',
            [ExamStatus.CANCELLED]: 'Cancel the exam',
            [ExamStatus.ONGOING]: 'Mark exam as in progress',
            [ExamStatus.RESULT_DECLARED]: 'Declare exam results'
        };
        return descriptions[status] || 'Change status';
    }

    getStatusColorClass(status: ExamStatus): string {
        const colors = {
            [ExamStatus.SCHEDULED]: 'text-blue-500',
            [ExamStatus.RE_SCHEDULED]: 'text-orange-500',
            [ExamStatus.CANCELLED]: 'text-red-500',
            [ExamStatus.ONGOING]: 'text-green-500',
            [ExamStatus.RESULT_DECLARED]: 'text-teal-500'
        };
        return colors[status] || 'text-gray-500';
    }

    getAvailableActions(exam: any): any[] {
        const availableStatuses = this.es.getAvailableTransitions(exam.status);
        return availableStatuses.map((status) => ({
            label: ExamStatusLabels[status] || status,
            value: status,
            icon: this.es.getStatusIcon(status)
        }));
    }

    onStatusChange(exam: any) {
        if (!exam.tempStatus) return;

        const newStatus = exam.tempStatus;
        const currentStatus = exam.status;
        if (!this.es.canTransition(currentStatus, newStatus)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Action',
                detail: `Cannot change status from ${ExamStatusLabels[currentStatus]} to ${ExamStatusLabels[newStatus]}`
            });
            exam.tempStatus = null;
            return;
        }

        const rule = this.es.getTransitionRule(currentStatus, newStatus);

        if (rule?.requiresConfirmation) {
            this.showConfirmationDialog(
                {
                    header: `Change Status to ${ExamStatusLabels[newStatus]}`,
                    message: rule.confirmationMessage || `Are you sure you want to change the status to ${ExamStatusLabels[newStatus]}?`,
                    icon: this.es.getStatusIcon(newStatus),
                    iconColor: this.getIconColorForStatus(newStatus),
                    acceptLabel: 'Yes, Change Status',
                    acceptButtonClass: this.getButtonClassForStatus(newStatus)
                },
                () => this.updateExamStatus(exam, newStatus)
            );
        } else {
            this.updateExamStatus(exam, newStatus);
        }

        exam.tempStatus = null;
    }

    updateExamStatus(exam: any, newStatus: ExamStatus) {
        this.loader.show('Updating exam status...');

        const updatedExam = {
            ...exam,
            status: newStatus
        };

        this.examinationService.update(updatedExam).subscribe({
            next: (result) => {
                this.loader.hide();
                if (result.body.status == 200) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: `Exam status changed to ${ExamStatusLabels[newStatus]}`
                    });
                    this.getExams();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: result.body.error || 'Failed to update exam status'
                    });
                }
            },
            error: () => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update exam status'
                });
            }
        });
    }

    deleteExam(exam: any) {
        if (!this.es.canDelete(exam.status)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Cannot Delete',
                detail: 'Only draft exams can be deleted'
            });
            return;
        }

        this.showConfirmationDialog(
            {
                header: 'Delete Draft Exam',
                message: `Are you sure you want to permanently delete this draft exam?<br><br><strong>Exam Type:</strong> ${ExamTypeLabels[exam.examType]}<br><strong>Department:</strong> ${exam.departmentName}<br><br>This action cannot be undone.`,
                icon: 'pi pi-question-circle',
                iconColor: 'text-red-500',
                acceptLabel: 'Yes, Delete',
                rejectLabel: 'Cancel',
                acceptButtonClass: 'p-button-danger'
            },
            () => this.performDelete(exam)
        );
    }

    performDelete(exam: any) {
        this.loader.show('Deleting exam...');

        this.examinationService.delete(exam.examId).subscribe({
            next: () => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Draft exam deleted successfully'
                });
                this.getExams();
            },
            error: () => {
                this.loader.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete exam'
                });
            }
        });
    }

    showConfirmationDialog(config: ConfirmationConfig, onConfirm: () => void) {
        this.confirmConfig = config;
        this.pendingAction = onConfirm;
        this.showConfirmDialog = true;
    }

    handleConfirmation() {
        if (this.pendingAction) {
            this.pendingAction();
            this.pendingAction = null;
        }
    }

    handleCancellation() {
        this.pendingAction = null;
    }

    getIconColorForStatus(status: ExamStatus): string {
        const colors = {
            [ExamStatus.SCHEDULED]: 'text-blue-500',
            [ExamStatus.RE_SCHEDULED]: 'text-orange-500',
            [ExamStatus.CANCELLED]: 'text-red-500',
            [ExamStatus.ONGOING]: 'text-green-500',
            [ExamStatus.RESULT_DECLARED]: 'text-teal-500'
        };
        return colors[status] || 'text-gray-500';
    }

    getButtonClassForStatus(status: ExamStatus): string {
        const classes = {
            [ExamStatus.SCHEDULED]: 'p-button-success',
            [ExamStatus.RE_SCHEDULED]: 'p-button-warning',
            [ExamStatus.CANCELLED]: 'p-button-danger',
            [ExamStatus.ONGOING]: 'p-button-info',
            [ExamStatus.RESULT_DECLARED]: 'p-button-help'
        };
        return classes[status] || 'p-button-primary';
    }
}
