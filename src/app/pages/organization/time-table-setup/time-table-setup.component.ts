import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { Toolbar } from 'primeng/toolbar';
import { MenuItem, MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { IMasterDepartment } from '../../models/org.model';
import { UserService } from '../../service/user.service';
import { CardModule } from 'primeng/card';
import { AccordionModule } from 'primeng/accordion';
import { TimetableViewComponentComponent } from '../timetable-view-component/timetable-view-component.component';
import { TimeTableGeneratorService } from '../../service/time-table-generator.service';
import { SmartTimetableComponentComponent } from '../../smart-timetable-component/smart-timetable-component.component';

@Component({
  selector: 'app-time-table-setup',
  imports: [CardModule, AccordionModule, SmartTimetableComponentComponent,  ButtonModule, CommonModule, DropdownModule, DialogModule, FormsModule, InputTextModule, TabsModule, SelectModule],
  template: `<app-smart-timetable-component></app-smart-timetable-component>`,
  styles: ``,
  providers:[MessageService]
})
export class TimeTableSetupComponent {

  commonService = inject(CommonService);
  selectedMasterDepartment : any;
  selectedDepartment : IMasterDepartment;
  items: MenuItem[] | undefined;
  departmentConfigService = inject(DepartmentConfigService);
  userService = inject(UserService);
  timeTable = inject(TimeTableGeneratorService);
  users = [];
  generatedTimetables:any[] = [];
   constructor(private messageService: MessageService, public loader: ApiLoaderService) {}
    // userConfig = ;
  sectionCards: any[] = [];
  departmentGroups: any[] = [];

  generateDialogVisible = false;
maxPeriodsPerDay = 6;
periodDuration = 60;
selectedDeptForGeneration: any = null;
allDepartments:IMasterDepartment[]=[];
    ngOnInit() {
      this.commonService.associatedDepartments.subscribe((data)=>{
        
        if(data){
         this.selectedMasterDepartment = data[0];
         this.onDepartmentChange();
        }
        
      })
      
        this.items = [
            {
                label: 'Update',
                icon: 'pi pi-refresh'
            },
            {
                label: 'Delete',
                icon: 'pi pi-times'
            }
        ];
            this.extractSectionsGroupedByDepartment();
    }


  getRandomLightColor(): string {
  const colors = [
    'bg-red-50', 'bg-orange-50', 'bg-amber-50', 'bg-yellow-50',
    'bg-lime-50', 'bg-green-50', 'bg-teal-50', 'bg-blue-50',
    'bg-indigo-50', 'bg-purple-50', 'bg-pink-50'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

extractSectionsGroupedByDepartment() {
  this.departmentGroups = [];

  this.commonService.associatedDepartments.subscribe((departments) => {
    departments.forEach((dept: any) => {
      const departmentSections: any[] = [];
      this.allDepartments.push(dept.department);
      dept.department.classes.forEach((cls: any) => {
        cls.sections.forEach((sec: any) => {
          const allSubjectsAssigned = sec.subjects.every((sub: any) => !!sub.teacher);
          departmentSections.push({
            departmentName: dept.department.name,
            className: cls.name,
            academicYear: dept.academicYear,
            sectionName: sec.name,
            sectionTeacher: sec.sectionTeacher,
            subjects: sec.subjects,
            status: allSubjectsAssigned ? 'complete' : 'incomplete'
          });
        });
      });

      const deptStatus = departmentSections.every(sec => sec.status === 'complete') ? 'complete' : 'incomplete';

      this.departmentGroups.push({
        name: dept.department.name,
        status: deptStatus,
        bgColorClass: this.getRandomLightColor(),
        sections: departmentSections
      });
    });

    //  Sort: 'incomplete' first, then 'complete'
    this.departmentGroups.sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'incomplete' ? -1 : 1;
    });
  });
}


  onDepartmentChange(){

     this.loader.show("Fetching latest config");
     this.departmentConfigService.find(this.selectedMasterDepartment.id).subscribe(departmentConfig=>{
      this.selectedMasterDepartment.academicStart = departmentConfig.body?.academicStart;
      this.selectedMasterDepartment.academicEnd = departmentConfig.body?.academicEnd
      if(this.selectedMasterDepartment){
          this.userService.search(0,100,'id','ASC',{ 'departments.in': [this.selectedMasterDepartment!.id]})
        .subscribe(result=>{
          this.loader.hide();
          this.selectedDepartment = departmentConfig.body?.department;
          this.users = result.content;
          })
      }
    })
      
    this.userService.search(0,100,'id','ASC',{ 'departments.in': [this.selectedMasterDepartment!.id]})
        .subscribe(result=>{
        this.users = result.content;
    })
  
  }

  openGenerateDialog(dept: any) {
  this.selectedDeptForGeneration = dept;
  this.generateDialogVisible = true;
}

generateForDepartment() {
 let originalDept = this.allDepartments.find(dept=>dept.name ==this.selectedDeptForGeneration.name );
this.timeTable.generateTimeTable(originalDept).next(response=>{
    console.log(response);
})
  
  // const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // this.selectedDeptForGeneration.sections.forEach((section: any) => {
  //   const timetable = {
  //     academicYear: section.academicYear,
  //     semester: 'Fall',
  //     department: section.departmentName,
  //     year: this.extractYear(section.className),
  //     section: section.sectionName,
  //     schedule: weekdays.map(day => ({
  //       day,
  //       periods: this.buildPeriods(section, day)
  //     })),
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     isActive: true
  //   };

  //   this.generatedTimetables.push(timetable);

  // });
    // console.log('Generated Timetable:', JSON.stringify(this.generatedTimetables));
  this.generateDialogVisible = false;
}


buildPeriods(section: any, day: string): any[] {
  const periods = [];
  const maxPeriodsPerDay = 6;

  section.subjects.forEach(subject => {
    for (let i = 0; i < maxPeriodsPerDay; i++) {
      const period = {
        subject: subject.name,
        teacher: subject.teacher,
        index: i
      };

      if (this.validateConstraints(period, day)) {
        periods.push(period);
        break; // Move to next subject after placing one period
      }
    }
  });

  return periods;
}


validateConstraints(period: any, day: string): boolean {
  return this.isTeacherAvailable(period.teacher, period.index, day);
}

isTeacherAvailable(teacher: string, periodIndex: number, day: string): boolean {
  for (const timetable of this.generatedTimetables) {
    const daySchedule = timetable.schedule.find(s => s.day === day);
    if (!daySchedule) continue;

    const period = daySchedule.periods.find(p => p.index === periodIndex);
    if (period && period.teacher === teacher) {
      return false; // Teacher already assigned in this period
    }
  }
  return true;
}


extractYear(className: string): number {
  const match = className.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

 async saveSetup(){

    this.selectedMasterDepartment!['department'] = this.selectedDepartment;
    this.selectedMasterDepartment!['branch'] = await  firstValueFrom(this.commonService.branch);
    this.loader.show("Updating Department Config...");
    
    this.departmentConfigService.update(this.selectedMasterDepartment!).subscribe(departConf=>{

      this.loader.hide();
      this.messageService.add({ severity: 'success', summary: 'Success Message', detail: 'DepartmentConfig Updated Successful!!!' });
    });

  }


}
