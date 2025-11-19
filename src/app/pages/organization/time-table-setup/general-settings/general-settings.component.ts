import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoFocusModule } from 'primeng/autofocus';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CommonService } from '../../../../core/services/common.service';
import { TimeTableService } from '../../../service/time-table.service';

@Component({
    selector: 'app-general-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, InputNumberModule, SelectModule, AutoFocusModule],
    templateUrl: './general-settings.component.html'
})
export class GeneralSettingsComponent {
    submitted = false;
    showPeriodDetails = false;
    commonService = inject(CommonService);
    timeTableService = inject(TimeTableService);

    toggleDaySelection(day: { name: string; selected: boolean }): void {
        day.selected = !day.selected;
    }
}
