
import { Component } from '@angular/core';

@Component({
    selector: 'app-hero-section',
    imports: [],
    templateUrl: './hero-section.component.html',
    styles: `
        @use '../_public-shared' as *;

        :host {
            display: block;
        }
    `
})
export class HeroSectionComponent {}
