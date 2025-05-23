import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MenuItem, MessageService, TreeNode } from 'primeng/api';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { ToastModule } from 'primeng/toast';
import { SpeedDialModule } from 'primeng/speeddial';
import { ButtonModule } from 'primeng/button';
import { Store } from '@ngrx/store';
import { UserProfileState } from '../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments, getBranch } from '../../core/store/user-profile/user-profile.selectors';
import { IBranch } from '../models/tenant.model';
import { DialogModule } from 'primeng/dialog';


export interface CustomTreeNode  extends TreeNode{
  _originalChildren?: TreeNode<any>[];
}

@Component({
  selector: 'app-org-tree',
  imports: [OrganizationChartModule,CommonModule, ToastModule, SpeedDialModule,ButtonModule,DialogModule],
  templateUrl: './org-tree.component.html',
  styles: `.p-button-icon .pi .pi-upload{
    font-size:0.05rem !important;
  }`,
  providers:[MessageService]
})
export class OrgTreeComponent {
 selectedNodes!: CustomTreeNode[];

 items: MenuItem[] | any = [
            {
                icon: 'pi pi-pencil',
                iconStyle:{'font-size':'3px'},
                command: () => {
                    this.messageService.add({ severity: 'info', summary: 'Add', detail: 'Data Added' });
                }
            },
            {
                icon: 'pi pi-info',
                command: () => {
                    this.messageService.add({ severity: 'error', summary: 'Delete', detail: 'Data Deleted' });
                }
            },
            {
                icon: 'pi pi-upload',
                routerLink: ['/fileupload']
            },
        ];;
 branch:IBranch | any;
 associatedDepartments: any[] = [];
  data:any = [];
 constructor(private messageService: MessageService) {}

 private store = inject(Store<{ userProfile: UserProfileState }>);
 
    ngOnInit() {
        this.store.select(getBranch).subscribe(branch=>{
          this.branch = branch;
        })
        this.store.select(getAssociatedDepartments).subscribe(departments => {
            this.associatedDepartments = departments
            this.data = this.generateTreeData();});

    }

generateTreeData() {
  let data: TreeNode<any> = {
      label: "SSKC",
      type: "branch",
      expanded: true,
      children: this.generateDepartmentData(this.associatedDepartments)
    }
    return [data];
}

generateDepartmentData(departments: any) {
  return departments?.map((dept:any) => {
    return {
      label: dept.department.name, 
      type: "department",
      expanded: true,
      children: this.generateClassData(dept.department.classes)
    };
  });
}

generateClassData(classes: any) {
  return classes?.map((cls:any) => {
    return {
      label: cls.name,
      type: "class",
      expanded: true,
      children: this.generateSectionData(cls.sections)
    };
  });
}

generateSectionData(sections: any) {
  return sections?.map((section:any) => {
    return {
      label: section.name,
      type: "section",
      expanded: true,
      children: this.generateSubjectsData(section.subjects)
    };
  });
}

generateSubjectsData(subjects: any) {
  return subjects?.map((subject:any) => {
    return {
      label: subject.name,
      type: "subject",
      expanded: false,
      children: []
    };
  });
}

  
toggleNode(node: CustomTreeNode, event: MouseEvent) {
    event.stopPropagation();

    if (node.expanded) {
      if (node.children) {
        node._originalChildren = node.children;
        node.children = [];
      }
      node.expanded = false;
    } else {
      
      if (node._originalChildren) {
        node.children = node._originalChildren;
      }
      node.expanded = true;
    }

    this.data = [...this.data];
  }
}
