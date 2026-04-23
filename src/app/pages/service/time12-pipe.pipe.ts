import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'time12'
})
export class Time12Pipe implements PipeTransform {
    transform(value: string | null): string {
        if (!value) return '—';

        // value = "22:11:51"
        const [hours, minutes, seconds] = value.split(':').map(Number);

        const date = new Date();
        date.setHours(hours, minutes, seconds);

        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
}
