import { CommonService } from './../../../core/services/common.service';
import { ExaminationTimeTable, IExaminationSubject } from './../../models/examination.model';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments, getBranch } from '../../../core/store/user-profile/user-profile.selectors';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { TreeNode } from 'primeng/api';
import { TreeSelectModule } from 'primeng/treeselect';
import { SelectModule } from 'primeng/select';
import { ExaminationDTO, ExamTypeLabels, ExamStatusLabels} from '../../models/examination.model';
import { IDepartmentConfig } from '../../models/org.model';
import { IBranch } from '../../models/tenant.model';
import { ExaminationService } from '../../service/examination.service';
import { InputNumberModule } from 'primeng/inputnumber';
import { ExamSlotsComponent } from '../exam-slots/exam-slots.component';
import { Subject } from '../../models/time-table';
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
    ExamSlotsComponent
  ],
  templateUrl: './add-exam.component.html',
  styles: ``
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
  private examinationService = inject(ExaminationService);
  examTypes = Object.entries(ExamTypeLabels).map(([value, label]) => ({ label, value }));
  examStatuses = Object.entries(ExamStatusLabels).map(([value, label]) => ({ label, value }));
  selectedSubjectsForTimeTable: Subject[] = [];
  constructor(private fb: FormBuilder) {}
  //  timeSlots: ExaminationTimeSlot[] = [];
   timeTable:ExaminationTimeTable = {
    settings: {
        startDate:new Date(),
        endDate:new Date(),
        breakDuration:15,
        slotDuration:60,
        slotsperday:1
      },
    schedules: []
   }
   commonService:CommonService = inject(CommonService);
  ngOnInit(): void {
    this.store.select(getAssociatedDepartments).subscribe(departments => {
      this.associatedDepartments = departments;
    });

    this.store.select(getBranch).subscribe(branch => {
      this.currentBranch = branch;
    });

    this.examForm = this.fb.group({
      totalMarks: [100, Validators.required],
      departmentId: [null, Validators.required],
      branchId: [null, Validators.required],
      examType: [null, Validators.required],
      resultDeclarationDate: [null]
    });

    this.examinationService.search(0, 100, 'id', 'ASC', {'branchId.equals': this.currentBranch.id?.toString()}).subscribe(res=>{
           this.exams = res.content;
    });

  }

  openSlotDailog(exam: any) {
    this.slotDailog =true;
    console.log(exam);
  }

  onDepartmentChange() {
    if (this.selectedDepartment) {
      this.examForm.get('departmentId').setValue(this.selectedDepartment?.id);
      this.examForm.get('branchId').setValue(this.currentBranch.id);
      this.treeNodes = this.selectedDepartment?.department.classes?.map(cls => ({
        label: 'Class: ' + cls.name,
        key: cls.name,
        data: cls,
        children: cls.sections.map(sec => ({
          label: 'Section: ' + sec.name,
          key: cls.name + ':' + sec.name,
          data: sec,
          children: sec.subjects.map(sub => 
            {
            let subject :IExaminationSubject = 
            {id:sub.id,name:sub.name,className:cls.name,sectionName:sec.name,departmentName:this.selectedDepartment.department.name};
            return {
            label: `${sub.name}`,
            key: cls.name + ':' + sec.name + ':' + sub.name + ':' +sub.id,
            data: subject
          };
          }
        )
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
      color:this.commonService.themeGradients[index],
      id: _subId,
      teacher: '',
      name: _subName,
      hoursPerWeek: 0
    };

    if (!timeTableSubjects.find(sub => sub.name === timeTableSubject.name)) {
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
      'PRE_KG': 'bg-amber-100',
      'LKG': 'bg-lime-100',
      'UKG': 'bg-blue-100',
      '1st Grade': 'bg-pink-100',
      '2nd Grade': 'bg-purple-100',
      'default': 'bg-gray-100'
    };

    return colors[className] || colors['default'];
  }

  removeSubject(subject: any): void {
    this.selectedSubjects = this.selectedSubjects.filter(s => s.key !== subject.key);
  }

  openDialog() {
    this.selectedDepartment = null;
    this.selectedSubjects = [];
    this.displayDialog = true;
  }

  groupSubjectsFromTreeNodes(nodes: TreeNode[]): any {
    let subjects = [];
    for (const node of nodes) {
   
      const keyParts = node.key?.split(':') ?? [];
      if (keyParts.length !== 4) continue;

      const [className, sectionName, _subName,_subId] = keyParts;
      let subject :IExaminationSubject = {id:_subId,name:_subName,className:className,sectionName:sectionName,departmentName:this.selectedDepartment.department.name};
      subjects.push(subject);

    }
    return subjects;
  }

  saveExam() {
    console.log(this.timeTable);
    if (this.examForm.valid && this.timeTable.schedules.length == this.selectedSubjectsForTimeTable.length) {
      this.groupSubjectsFromTreeNodes(this.selectedSubjects);
      const finalExamData: ExaminationDTO = {
        ...this.examForm.value,
        timeTable:this.timeTable,
        subjects: this.groupSubjectsFromTreeNodes(this.selectedSubjects)
      };
       this.examinationService.create(finalExamData).subscribe(result=>{
        console.log(result);
       });

      this.displayDialog = false;
    }
  }

  ExamTypeLabels = ExamTypeLabels;
  ExamStatusLabels = ExamStatusLabels;
}
