import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-footer-section',
    imports: [CommonModule, RouterLink],
    templateUrl: './footer-section.component.html',
    styles: ``
})
export class FooterSectionComponent {
    @Input() today: any;
}
