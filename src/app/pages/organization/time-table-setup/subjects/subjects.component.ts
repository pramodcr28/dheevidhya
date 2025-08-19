import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { TimeTableService } from '../../../service/time-table.service';



@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule, InputNumberModule],
  templateUrl: './subjects.component.html'
})
export class SubjectsComponent {

 timeTableService = inject(TimeTableService);
 

  removeSubject(index: number) {
    this.timeTableService.timeTable.subjects.splice(index, 1);
  }

}