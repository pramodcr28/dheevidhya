
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-contact-section',
    imports: [FormsModule],
    templateUrl: './contact-section.component.html',
    styles: ``
})
export class ContactSectionComponent {
    @Input() contactForm: any;
    @Input() today: any;

    @Output() formSubmit = new EventEmitter<void>();
}
