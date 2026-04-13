import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-hero-section',
    imports: [CommonModule],
    templateUrl: './hero-section.component.html',
    styles: `
        @use '../_public-shared' as *;

        :host {
            display: block;
        }
    `
})
export class HeroSectionComponent {}
