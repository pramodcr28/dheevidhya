import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DragDropModule } from 'primeng/dragdrop';
import { InputNumberModule } from 'primeng/inputnumber';
import { KnobModule } from 'primeng/knob';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { CommonService } from '../../../core/services/common.service';
import { DheeConfirmationService } from '../../../core/services/dhee-confirmation.service';
import { ApiLoaderService } from '../../../core/services/loaderService';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { ExaminationTimeSlot } from '../../models/examination.model';
import { ExamStatusService } from '../../service/exam-status.service';

@Component({
    selector: 'app-exam-slots',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePickerModule, SelectModule, ButtonModule, TableModule, DragDropModule, CardModule, ToastModule, InputNumberModule, SliderModule, KnobModule, ConfirmationDialogComponent],
    templateUrl: './exam-slots.component.html',
    styles: [],
    providers: [MessageService, DheeConfirmationService]
})
export class ExamSlotsComponent {
    draggedSubject: any;
    isDragOver = false;
    slotOptions = [
        { label: '1 Slot', value: 1 },
        { label: '2 Slots', value: 2 },
        { label: '3 Slots', value: 3 },
        { label: '4 Slots', value: 4 },
        { label: '5 Slots', value: 5 },
        { label: '6 Slots', value: 6 }
    ];

    commonService: CommonService = inject(CommonService);
    loader = inject(ApiLoaderService);
    messageService = inject(MessageService);

    es = inject(ExamStatusService);

    ngOnInit() {
        // Initialize default times if not set
        // if (!this.es.timeTable.settings.dayStartTime) {
        //     this.es.timeTable.settings.dayStartTime = new Date();
        //     this.es.timeTable.settings.dayStartTime.setHours(9, 0, 0, 0);
        // }

        // if (!this.es.timeTable.settings.dayEndTime) {
        //     this.es.timeTable.settings.dayEndTime = new Date();
        //     this.es.timeTable.settings.dayEndTime.setHours(17, 0, 0, 0);
        // }
        this.es.generateTimeTable();
    }

    getExactDayDiff(start: Date, end: Date): number {
        const diffMs = end.getTime() - start.getTime();
        return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    onDragStart(subject: any) {
        this.draggedSubject = subject;
    }

    onDragEnd(event: any) {
        this.isDragOver = false;
        this.draggedSubject = null;
    }
    onDrop(event: any, targetSlot: ExaminationTimeSlot) {
        this.isDragOver = false;

        if (!this.draggedSubject) return;

        // 1. Check if the target slot already has a subject
        if (targetSlot.subjectName) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Slot Occupied',
                detail: `This slot is already assigned to ${targetSlot.subjectName}. Please remove it first.`
            });
            return;
        }

        // 2. Remove subject from any previously assigned slot
        for (const slot of this.es.timeTable.schedules) {
            if (slot.subjectName === this.draggedSubject.name) {
                slot.subjectName = null;
                slot.color = null;
                break; // Only one slot per subject
            }
        }

        // 3. Assign the subject to the new slot
        targetSlot.subjectName = this.draggedSubject.name;
        targetSlot.color = this.draggedSubject.color;

        // 4. Notify user
        this.messageService.add({
            severity: 'success',
            summary: 'Assigned',
            detail: `${this.draggedSubject.name} assigned to ${targetSlot.day}`
        });
    }
    removeSubject(slot: ExaminationTimeSlot) {
        const removed = slot.subjectName;
        slot.subjectName = undefined;
        if (removed) {
            this.messageService.add({
                severity: 'info',
                summary: 'Removed',
                detail: `${removed} removed`
            });
        }
    }
}
