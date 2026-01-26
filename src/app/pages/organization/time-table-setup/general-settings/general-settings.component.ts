import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoFocusModule } from 'primeng/autofocus';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CommonService } from '../../../../core/services/common.service';
import { DepartmentConfigService } from '../../../../core/services/department-config.service';
import { DheeSelectComponent } from '../../../../shared/dhee-select/dhee-select.component';
import { BreakConfig } from '../../../models/time-table';
import { TimeTableService } from '../../../service/time-table.service';

@Component({
    selector: 'app-general-settings',
    standalone: true,
    imports: [CommonModule, DatePickerModule, FormsModule, InputNumberModule, SelectModule, AutoFocusModule, CheckboxModule, DheeSelectComponent],
    templateUrl: './general-settings.component.html'
})
export class GeneralSettingsComponent implements OnInit {
    submitted = false;
    showPeriodDetails = false;
    commonService = inject(CommonService);
    timeTableService = inject(TimeTableService);
    associatedDepartments: any[] = [];
    departmentConfigService = inject(DepartmentConfigService);
    ngOnInit(): void {
        // Initialize breaks if not present
        if (!this.timeTableService.timeTable.settings.breaks) {
            this.timeTableService.timeTable.settings.breaks = [
                {
                    id: 'tea_break',
                    name: 'Tea Break',
                    afterPeriod: 2,
                    duration: 15,
                    enabled: false
                },
                {
                    id: 'lunch_break',
                    name: 'Lunch Break',
                    afterPeriod: 4,
                    duration: 45,
                    enabled: false
                }
            ];
        }
        this.getAssociatedDepartmentsOnAcademicyear();
    }

    getAssociatedDepartmentsOnAcademicyear() {
        const filterParams = {
            branch: this.commonService.branch?.id
        };

        this.departmentConfigService.search(0, 100, 'id', 'ASC', filterParams).subscribe((res) => {
            this.associatedDepartments = res.content.map((re) => ({
                ...re,
                name: re.department.name
            }));
        });
    }

    toggleDaySelection(day: { name: string; selected: boolean }): void {
        day.selected = !day.selected;
    }

    addBreak(): void {
        if (!this.timeTableService.timeTable.settings.breaks) {
            this.timeTableService.timeTable.settings.breaks = [];
        }

        const newBreak: BreakConfig = {
            id: `break_${Date.now()}`,
            name: 'New Break',
            afterPeriod: 1,
            duration: 15,
            enabled: true
        };

        this.timeTableService.timeTable.settings.breaks.push(newBreak);
    }

    removeBreak(index: number): void {
        if (this.timeTableService.timeTable.settings.breaks) {
            this.timeTableService.timeTable.settings.breaks.splice(index, 1);
        }
    }

    getMaxPeriodForBreak(): number {
        return this.timeTableService.timeTable.settings.periodsPerDay || 10;
    }

    onDepartmentChange(event: Event) {
        console.log(event);
    }
}
