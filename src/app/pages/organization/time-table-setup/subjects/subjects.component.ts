import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../../../../core/services/common.service';
import { TimeTableService } from '../../../service/time-table.service';
import { IMasterSubject } from './../../../models/org.model';

@Component({
    selector: 'app-subjects',
    standalone: true,
    imports: [FormsModule, InputNumberModule, ButtonModule, TooltipModule, NgClass],
    templateUrl: './subjects.component.html'
})
export class SubjectsComponent implements OnInit {
    timeTableService = inject(TimeTableService);
    commonService = inject(CommonService);
    expandedSections = new Set<number>();

    ngOnInit() {}

    toggleSection(sectionId: number) {
        if (this.expandedSections.has(sectionId)) {
            this.expandedSections.delete(sectionId);
        } else {
            this.expandedSections.add(sectionId);
        }
    }

    isSectionExpanded(sectionId: number): boolean {
        return !this.expandedSections.has(sectionId);
    }

    removeSubject(id: string, subjectIndex: number, calsses: any[]) {
        const section = calsses?.find((s) => s.id == id);
        if (section) {
            section.subjects.splice(subjectIndex, 1);
        }
    }

    calculateTotalHours(subjects: IMasterSubject[]): number {
        return subjects.reduce((sum, sub) => sum + sub.periodsPerWeek, 0);
    }

    getTotalSubjects(calsses: any[]): number {
        return calsses.reduce((total, cls) => total + cls.sections.reduce((sum, sec) => sum + sec.subjects.length, 0), 0);
    }

    getTotalHours(calsses: any[]): number {
        return calsses.reduce((total, cls) => total + cls.sections.reduce((sum, sec) => sum + this.calculateTotalHours(sec.subjects), 0), 0);
    }
}
