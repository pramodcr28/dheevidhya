
import { CommonModule } from '@angular/common';
import { Component, computed, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
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
import { StudentDialogComponent } from '../student-dialog/student-dialog.component';
import { ExportColumn, Column } from '../../../core/model/table.model';
import { catchError, map, Observable, of, Subscription, switchMap, tap } from 'rxjs';
import { IProfileConfig,  ITenantAuthority,  ITenantUser, NewProfileConfig, NewTenantUser } from '../../models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ITEMS_PER_PAGE} from '../../../core/model/pagination.constants';
import { EntityArrayResponseType, UserService } from '../../service/user.service';
import { SortService } from '../../../shared/sort';
import { ProfileConfigService } from '../../service/profile-config.service';
import { Store } from '@ngrx/store';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getBranch, selectUserConfig } from '../../../core/store/user-profile/user-profile.selectors';
import dayjs from 'dayjs/esm';
import { TenantAuthorityService } from '../../service/tenant-authority.service';
import { GuardianDialogComponent } from '../guardian-dialog/guardian-dialog.component';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { IBranch } from '../../models/tenant.model';

@Component({
  selector: 'app-student-list',
  imports: [CommonModule,TableModule,FormsModule,ButtonModule,RippleModule,ToastModule,ToolbarModule,RatingModule,InputTextModule,DialogModule,TagModule,InputIconModule,IconFieldModule,ConfirmDialogModule,GuardianDialogComponent,StudentDialogComponent],
  templateUrl: './student-list.component.html',
  providers: [MessageService, ConfirmationService]
})
export class StudentListComponent {
    private store = inject(Store<{ userProfile: UserProfileState }>);
    studentDialog: boolean = false;
    guardianDialog: boolean = false;
    student!:NewTenantUser | ITenantUser;
    studentProfile! : NewProfileConfig | IProfileConfig | any;
    selectedGaurdian!:NewTenantUser | ITenantUser;
    selectedGaurdianProfile! : NewProfileConfig | IProfileConfig | any;
    selectedStudentProfile! : NewProfileConfig | IProfileConfig | any;
    submitted: boolean = false;
    exportColumns!: ExportColumn[];
    cols!: Column[];
    subscription: Subscription | null = null;
 
    tenantAuthorities =  signal<ITenantAuthority[]>([]);
    isLoading = false;
    tenantUsers = signal<ITenantUser[] | null>([]);
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
    branch:IBranch;
     ngOnInit() {
          this.authorityService.query().subscribe((result:any)=>{
            this.tenantAuthorities.set(result.body);
          })

          this.store.select(selectUserConfig).subscribe(userConfig => {
           this.currentUser = userConfig.userId;
          });

          this.store.select(getBranch).subscribe(branch => {
           this.branch = branch;
          });
         this.load();
     }

    
      load(): void {
        this.loader.show("Fetching Staff Data");
        this.queryBackend().subscribe({
          next: (res: any) => {
            this.onResponseSuccess(res);
            this.loader.hide();
          },
        });
      }

    
      protected onResponseSuccess(response: EntityArrayResponseType): void {

        let result:any = response.body?.filter((a:ITenantUser) =>{
          return a.authorities?.find( authority=>authority.name == 'STUDENT') != null;
        });
        this.tenantUsers.set(result);
      }

      protected queryBackend(): Observable<any> {
        const { page } = this;
        this.isLoading = true;
        const pageToLoad: number = page;
    
        const queryObject: any = {
            page: pageToLoad - 1,
            size: this.itemsPerPage,
            eagerload: true
        };
    
        return this.studentService.query(queryObject).pipe(
            tap(() => (this.isLoading = false)),
            catchError(error => {
                console.error('Error in normal query', error);
                return of({ body: [], headers: null });
            }),
            switchMap(normalResult => {
                const ids = (normalResult.body || []).map(item => item.id.toString());
    
                if (ids.length === 0) {
                    return of(normalResult);
                }
    
                return this.studentService.search(0,10,'id','ASC',{ 'user_id.in': ids }
                ).pipe(
                    map(searchResult => {
                        return { body: normalResult.body?.map((user:any)=>{
                          user['profile'] = searchResult.content?.find((config:any)=>{
                            return user.id  == config.userId
                          });
  
                          return user;
                        }), headers: normalResult.headers };
                    }),
                    catchError(error => {
                        console.error('Error in search query', error);
                        return of(normalResult);
                    })
                );
            })
        );
    }
    openNew() {
      this.student = { 
        authorities: [ this.tenantAuthorities().find((a:any) => a.name === 'STUDENT')],
        isTenantUser: true,
        createdBy: this.currentUser,
        lastModifiedBy: this.currentUser,
        activated:true,
        createdDate: dayjs(),
        lastModifiedDate: dayjs(),
        imageUrl: '',
        email: 'NA',
        passwordHash: '1234'
      } as NewTenantUser | any;
    
      this.studentProfile = {} as NewProfileConfig;
      this.submitted = false;
      this.studentDialog = true;
    }

     hideDialog() {
        this.loader.hide();
         this.studentDialog = false;
         this.guardianDialog = false;
         this.submitted = false;
     }
 
     onStudentSave(student: { student: NewTenantUser | ITenantUser; studentProfile: NewProfileConfig | IProfileConfig | any }) {
        this.submitted = true;

        for (let role in student.studentProfile.roles) {
          if (student.studentProfile.roles[role] == null) {
            delete student.studentProfile.roles[role];
          }
        }
        if(!student.student.id){
          this.loader.show("Adding new Student");
          let newStudent : NewTenantUser | any  = {...student.student};
          newStudent.branch = this.branch;
          // newStudent.email = null;
          this.studentService.create(newStudent as NewTenantUser).subscribe(result=>{
            student.studentProfile.userId = result.body?.id.toString();
        
            this.profileService.create(student.studentProfile as NewProfileConfig).subscribe(result=>{
              setTimeout(()=>{
              this.hideDialog();
              this.load();
              this.messageService.add({text: "Congrats! Record created!",closeIcon: "close"});
              });
            })
         
          })
        }else{
          this.loader.show("Updating new Student");
          this.studentService.update(student.student as ITenantUser).subscribe(result=>{           
            this.profileService.update(student.studentProfile as IProfileConfig).subscribe(result=>{
              setTimeout(()=>{
              this.hideDialog();
              this.load();
              this.messageService.add({summary: "Congrats! Record updated!",detail: "close"});
              });  
            })
         
          })
        }
      
     }

     deleteStudent(student:ITenantUser){
         this.loader.show("Deleting Student");
      this.studentService.delete(student.id).subscribe(res=>{
        this.profileService.delete(student.profile?.id!).subscribe(result=>{
         if(student.profile?.roles?.student?.guardianId){
           this.deleteGuardian(student.profile?.roles?.student?.guardianId);
         }else{
          this.load();
          this.loader.hide();
          this.messageService.add({ severity: 'worn', summary: 'Worn Message', detail: 'Student Deleted Successful!!!' });
         }
       
        })
      });
     }

     deleteGuardian(guardianId:any){
        this.loader.show("deleting Guardian");
        this.studentService.delete(+guardianId).subscribe(res=>{

          this.studentService.search(0,10,'id','ASC',{ 'user_id.in': [guardianId] }
                ).subscribe(profiles=>{
                  if(profiles.content){
                     this.profileService.delete(profiles.content[0].id).subscribe(result=>{
                      this.loader.hide();
                      this.load();
                      this.messageService.add({ severity: 'worn', summary: 'Worn Message', detail: 'Guardian Deleted Successful!!!' });
                    })
                  }else{
                    this.loader.hide();
                  }
                })
       
        
    
   
      });
     }

     editStudent(student:ITenantUser){
     
      this.studentService.find(student.id).subscribe((result:any)=>{
        this.studentProfile = student.profile;
        this.student = { ...result.body};
        this.studentDialog = true;
      })
     
     }

     addOrEditGuardian(student:ITenantUser){
     let gaurdianId = student.profile?.roles?.student?.guardianId;
      this.selectedStudentProfile = student.profile as any;
     if(gaurdianId){
          this.studentService.find(gaurdianId).subscribe((result:any)=>{ 
            this.studentService.search(0,10,'id','ASC',{ 'user_id.in': [gaurdianId] }
                ).subscribe(profiles=>{
                  if(profiles.content){
                     this.selectedGaurdianProfile = profiles.content[0];
                     this.selectedGaurdian = { ...result.body};
                     this.guardianDialog = true;
                  }else{
                    this.loader.hide();
                  }
                })
       
          });
     }else{

      this.selectedGaurdian = { 
        authorities: [ this.tenantAuthorities().find((a:any) => a.name === 'GUARDIAN')],
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
    
      this.selectedGaurdianProfile = {
        departments:student.profile?.departments
      } as NewProfileConfig;
      this.guardianDialog = true;

     }

     }

     onGuardianSave(gaurdian: { gaurdian: NewTenantUser|ITenantUser; guardianProfile: NewProfileConfig|IProfileConfig; }) {
       this.loader.show("Updating Guardian Info");
        if(!gaurdian.gaurdian.id){      
          let newStudent : NewTenantUser | any  = {...gaurdian.gaurdian};
          this.studentService.create(newStudent as NewTenantUser).subscribe(result=>{
            gaurdian.guardianProfile.userId = result.body?.id.toString();
        
            this.profileService.create(gaurdian.guardianProfile as NewProfileConfig).subscribe(result2=>{
              if(this.selectedStudentProfile.roles?.student){
                this.selectedStudentProfile.roles.student.guardianId = result.body?.id.toString();
              }
                
              this.profileService.update( this.selectedStudentProfile  as IProfileConfig).subscribe(result=>{
              setTimeout(()=>{
              this.hideDialog();
              this.load();
              this.messageService.add({text: "Congrats! Record updated!",closeIcon: "close"});
              });  
            })
            })
         
          })
        }else{
          this.studentService.update(gaurdian.gaurdian as ITenantUser).subscribe(result=>{
            this.profileService.update(gaurdian.guardianProfile as IProfileConfig).subscribe(result=>{
              setTimeout(()=>{
              this.hideDialog();
              this.load();
              this.messageService.add({text: "Congrats! Record updated!", closeIcon: "close"});
              });  
            })
         
          })
        }
      
     }

hideGuardianDialog() {
     this.guardianDialog = false;
}
}
