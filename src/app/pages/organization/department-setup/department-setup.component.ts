import { DropdownModule } from 'primeng/dropdown';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CommonService } from '../../../core/services/common.service';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MenuItem, MessageService } from 'primeng/api';
import { TabsModule } from 'primeng/tabs';
import { IMasterDepartment } from '../../models/org.model';
import { UserService } from '../../service/user.service';
import { SelectModule } from 'primeng/select';
import { UserFilterPipePipe } from "../../../core/pipe/user-filter-pipe.pipe";
import { ApiLoaderService } from '../../../core/services/loaderService';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { firstValueFrom } from 'rxjs';
import { AccordionModule, AccordionPanel } from 'primeng/accordion';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-department-setup',
  imports: [
    FormsModule,
    ButtonModule,
    DropdownModule,
    DialogModule,
    InputTextModule,
    TabsModule,
    SelectModule,
    AccordionModule,
    UserFilterPipePipe,
    AccordionPanel,
    ToastModule
],
  templateUrl: './department-setup.component.html',
  styles: `

  `,
  providers:[MessageService]
})
export class DepartmentSetupComponent {

  commonService = inject(CommonService);
  selectedMasterDepartment : any;
  selectedDepartment : IMasterDepartment;
  items: MenuItem[] | undefined;
  departmentConfigService = inject(DepartmentConfigService);
  userService = inject(UserService);
  users = [];

   constructor(private messageService: MessageService, public loader: ApiLoaderService) {}
  

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
    }

  onDepartmentChange(){

    
     this.departmentConfigService.find(this.selectedMasterDepartment.id).subscribe(departmentConfig=>{
       this.loader.show("Fetching latest config");
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
      
    // this.userService.search(0,100,'id','ASC',{ 'departments.in': [this.selectedMasterDepartment!.id]})
    //     .subscribe(result=>{
    //     this.users = result.content;
    // })
  
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
