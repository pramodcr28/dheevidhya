import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { SelectModule } from 'primeng/select';
import { SpeedDialModule } from 'primeng/speeddial';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { CommonService } from '../../../core/services/common.service';
import { DepartmentConfigService } from '../../../core/services/department-config.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { UserProfileState } from '../../../core/store/user-profile/user-profile.reducer';
import { getAssociatedDepartments } from '../../../core/store/user-profile/user-profile.selectors';
import { IDepartmentConfig, IMasterDepartment } from '../../models/org.model';
import { ProfileConfigService } from '../../service/profile-config.service';
import { UserService } from '../../service/user.service';

export interface CustomTreeNode extends TreeNode {
    _originalChildren?: TreeNode<any>[];
}

@Component({
    selector: 'app-org-tree',
    imports: [OrganizationChartModule, CommonModule, ToastModule, SpeedDialModule, ButtonModule, DialogModule, FormsModule, InputTextModule, TextareaModule, InputIconModule, IconFieldModule, ConfirmDialogModule, SelectModule, MessageModule],
    templateUrl: './org-tree.component.html',
    styles: `
        .p-button-icon .pi .pi-upload {
            font-size: 0.05rem !important;
        }
    `,
    providers: [MessageService]
})
export class OrgTreeComponent {
    selectedNodes!: CustomTreeNode[];
    selectedDepartment!: IMasterDepartment | any;
    selectedMasterDepartment!: IDepartmentConfig | null;
    userService = inject(UserService);
    users = [];
    departmentConfigService = inject(DepartmentConfigService);
    profileService = inject(ProfileConfigService);
    commonService = inject(CommonService);
    associatedDepartments: any[] = [];
    data: any = [];
    result: any;

    constructor(
        private messageService: MessageService,
        public loader: ApiLoaderService
    ) {}

    private store = inject(Store<{ userProfile: UserProfileState }>);
    dialogVisible = false;

    ngOnInit() {
        this.store.select(getAssociatedDepartments).subscribe((departments) => {
            this.associatedDepartments = departments;
            this.data = this.generateTreeData();
        });
    }

    generateTreeData() {
        let data: TreeNode<any> = {
            label: this.commonService?.branch?.name || 'Organization',
            type: 'branch',
            expanded: true,
            children: this.generateDepartmentData(this.associatedDepartments)
        };
        return [data];
    }

    generateDepartmentData(departments: any) {
        return departments?.map((dept: any) => {
            return {
                label: dept.department.name,
                value: dept,
                type: 'department',
                expanded: true,
                children: this.generateClassData(dept.department.classes)
            };
        });
    }

    generateClassData(classes: any) {
        return classes?.map((cls: any) => {
            return {
                label: cls.name,
                value: cls,
                type: 'class',
                expanded: false,
                children: this.generateSectionData(cls.sections)
            };
        });
    }

    generateSectionData(sections: any) {
        return sections?.map((section: any) => {
            return {
                label: section.name,
                value: section,
                styleClass: 'no-padding',
                type: 'section',
                expanded: false,
                children: this.generateSubjectsData(section.subjects)
            };
        });
    }

    generateSubjectsData(subjects: any) {
        return subjects?.map((subject: any) => {
            return {
                label: subject.name,
                value: subject,
                type: 'subject',
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

    openEditOrganizationDailogue(node: any) {
        this.loader.show('Fetching latest config');
        this.departmentConfigService.find(node.value.id).subscribe((departmentConfig) => {
            this.selectedMasterDepartment = departmentConfig.body;
            if (this.selectedMasterDepartment) {
                this.profileService.search(0, 100, 'id', 'ASC', { 'departments.in': [this.selectedMasterDepartment!.id] }).subscribe((result) => {
                    this.loader.hide();
                    this.selectedDepartment = this.selectedMasterDepartment?.department;
                    this.users = result.content;
                    this.dialogVisible = true;
                });
            }
        });
    }

    saveDepartment() {
        this.selectedMasterDepartment!['department'] = this.selectedDepartment;
        this.loader.show('Updating Department Config...');
        this.departmentConfigService.update(this.selectedMasterDepartment!).subscribe((departConf) => {
            this.dialogVisible = false;
            this.loader.hide();
            this.messageService.add({ severity: 'success', summary: 'Success Message', detail: 'DepartmentConfig Updated Successful!!!' });
        });
    }
}
