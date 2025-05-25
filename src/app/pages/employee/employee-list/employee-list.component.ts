import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { EmployeeDialogComponent } from './../employee-dialog/employee-dialog.component';
import { Component, inject, NgZone, signal } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs/esm';
import { Subscription, Observable, tap, catchError, of, switchMap, map } from 'rxjs';
import { ITEMS_PER_PAGE } from '../../../core/model/pagination.constants';
import { ExportColumn, Column } from '../../../core/model/table.model';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { selectUserConfig } from '../../../core/store/user-profile/user-profile.selectors';
import { SortService } from '../../../shared/sort';
import { NewTenantUser, ITenantUser, NewProfileConfig, IProfileConfig, ITenantAuthority } from '../../models/user.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { TenantAuthorityService } from '../../service/tenant-authority.service';
import { UserService, EntityArrayResponseType } from '../../service/user.service';
import { ApiLoaderService } from '../../../core/services/loaderService';

@Component({
  selector: 'app-employee-list',
  imports: [CommonModule,TableModule,FormsModule,ButtonModule,RippleModule,ToastModule,ToolbarModule,RatingModule,InputTextModule,DialogModule,TagModule,InputIconModule,IconFieldModule,ConfirmDialogModule,EmployeeDialogComponent],
  templateUrl: './employee-list.component.html',
  styles: ``,
  providers:[MessageService, ConfirmationService]
})
export class EmployeeListComponent {
private store = inject(Store<{ userProfile: UserProfileState }>);
    studentDialog: boolean = false;
    employee!:NewTenantUser | ITenantUser;
    employeeProfile! : NewProfileConfig | IProfileConfig | any;
    submitted: boolean = false;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    subscription: Subscription | null = null;
 
    tenantAuthorities =  signal<ITenantAuthority[]>([]);
    isLoading = false;
    employeeProfiles = signal<IProfileConfig[] | null>([]);
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems = 0;
    page = 1;
    router = inject(Router);
    studentService = inject(UserService);
    profileService = inject(ProfileConfigService);
    authorityService = inject(TenantAuthorityService);
    activatedRoute = inject(ActivatedRoute);
    sortService = inject(SortService);
    ngZone = inject(NgZone);
    messageService = inject(MessageService);
    confirmationService = inject(ConfirmationService)
    loader = inject(ApiLoaderService); 
    currentUser : any;

     ngOnInit() {
          this.authorityService.query().subscribe((result:any)=>{
            this.tenantAuthorities.set(result.body);
          })

          this.store.select(selectUserConfig).subscribe(userConfig => {
           this.currentUser = userConfig.userId;
          });
         this.load();
     }

    
      load(): void {
        this.loader.show("Fetching Staff Data");
        this.studentService.search(0, 100, 'id', 'ASC', { 'profileType.equals': "STAFF" }).subscribe({
          next: (res: any) => {
            this.employeeProfiles.set(res.content);
            this.loader.hide();
          },
        });
      }

    

    openNew() {
      this.employee = { 
        authorities: [],
        isTenantUser: true,
        createdBy: this.currentUser,
        lastModifiedBy: this.currentUser,
        activated:true,
        createdDate: dayjs(),
        lastModifiedDate: dayjs(),
        imageUrl: '',
        email: '',
        passwordHash: '1234'
      } as NewTenantUser | any;
    
      this.employeeProfile = {} as NewProfileConfig;
      this.submitted = false;
      this.studentDialog = true;
    }

     hideDialog() {
         this.studentDialog = false;
         this.submitted = false;
         this.loader.hide();
     }
 
     onEmployeeSave(employee: { employee: NewTenantUser | ITenantUser; employeeProfile: NewProfileConfig | IProfileConfig }| any) {
        this.submitted = true;
  
        for (let role in employee.employeeProfile.roles) {
          if (employee.employeeProfile.roles[role] == null) {
            delete employee.employeeProfile.roles[role];
          }
        }

        if(!employee.employee.id){
          this.loader.show("Updating new Staff");
          let newEmployee : NewTenantUser | any = {...employee.employee};
          
          this.studentService.create(newEmployee as NewTenantUser).subscribe(result=>{
            employee.employeeProfile.userId = result.body?.id.toString();
            employee.employeeProfile.profileType = 'STAFF';
            this.profileService.create(employee.employeeProfile as NewProfileConfig).subscribe(result=>{
              setTimeout(()=>{
              this.hideDialog();
              this.load();
              this.messageService.add({text: "Congrats! Record created!",closeIcon: "close"});
              });
            })
         
          })
        }else{
          this.loader.show("Adding new Record");
          this.studentService.update(employee.employee as ITenantUser).subscribe(result=>{
            this.profileService.update(employee.employeeProfile as IProfileConfig).subscribe(result=>{
              setTimeout(()=>{
              this.hideDialog();
              this.load();
              this.messageService.add({text: "Congrats! Record updated!",closeIcon: "close"});
              });  
            })
         
          })
        }
      
     }

     deleteEmployee(employee:IProfileConfig){
      this.studentService.delete(+employee.userId).subscribe(res=>{
        this.profileService.delete(employee?.id!).subscribe(result=>{
          this.load();
        })
      });
     }

    getAuthorityNames(authorities: any): string {
      let result = " ";
       for(let authority  in authorities){
        if(authorities[authority] != null){
          result += authority;
        }
       }
      return result;
    }

     editEmployee(employee:IProfileConfig){
      console.log(employee);
      this.studentService.find(+employee.userId).subscribe((result:any)=>{
        
        this.employeeProfile = employee;
        this.employee = { ...result.body};
        this.studentDialog = true;
      })
     
     }
}
