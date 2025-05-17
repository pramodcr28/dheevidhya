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
    student!:NewTenantUser | ITenantUser;
    studentProfile! : NewProfileConfig | IProfileConfig | any;
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
        this.queryBackend().subscribe({
          next: (res: any) => {
            this.onResponseSuccess(res);
            
          },
        });
      }

    
      protected onResponseSuccess(response: EntityArrayResponseType): void {
          let result:any = response.body?.filter((a:ITenantUser) =>{
          return a.authorities?.find( authority=>authority.name != 'STUDENT') != null;
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
    
      this.studentProfile = {} as NewProfileConfig;
      this.submitted = false;
      this.studentDialog = true;
    }

     hideDialog() {
         this.studentDialog = false;
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
          let newStudent : NewTenantUser | any  = {...student.student};
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
          this.studentService.update(student.student as ITenantUser).subscribe(result=>{
            this.profileService.update(student.studentProfile as IProfileConfig).subscribe(result=>{
              setTimeout(()=>{
              this.hideDialog();
              this.load();
              this.messageService.add({text: "Congrats! Record updated!",closeIcon: "close"});
              });  
            })
         
          })
        }
      
     }

     deleteStudent(student:ITenantUser){
      this.studentService.delete(student.id).subscribe(res=>{
        this.profileService.delete(student.profile?.id!).subscribe(result=>{
          this.load();
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
}
