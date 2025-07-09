import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { TimeTableService } from '../../../service/time-table.service';

export interface Subject {
  id: string;
  name: string;
  teacher: string;
  hoursPerWeek: number;
  color: string;
}

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule, InputNumberModule],
  templateUrl: './subjects.component.html'
})
export class SubjectsComponent {

 timeTableService = inject(TimeTableService);
 
  subjects: Subject[] = [
    { id: '1', name: 'KANNADA', teacher: 'DEV', hoursPerWeek: 4, color: '#3b82f6' },
    { id: '2', name: 'ENGLISH', teacher: 'MAHESH', hoursPerWeek: 5, color: '#ef4444' },
    { id: '3', name: 'VLCAG', teacher: 'PRAMOD', hoursPerWeek: 3, color: '#10b981' },
    { id: '4', name: 'VC\'H\'QC', teacher: 'DEV', hoursPerWeek: 4, color: '#f59e0b' },
    { id: '5', name: 'QCJLB', teacher: 'MAHESH', hoursPerWeek: 2, color: '#8b5cf6' }
  ];

  removeSubject(index: number) {
    this.subjects.splice(index, 1);
  }

}