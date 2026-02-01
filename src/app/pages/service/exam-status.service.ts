import { Injectable } from '@angular/core';
import { ExamStatus } from '../models/examination.model';

export interface StatusTransition {
    from: ExamStatus;
    to: ExamStatus;
    allowed: boolean;
    requiresConfirmation: boolean;
    confirmationMessage?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ExamStatusService {
    // Define allowed status transitions
    private transitionRules: Map<string, StatusTransition> = new Map([
        // From DRAFT
        [
            'DRAFT->SCHEDULED',
            {
                from: ExamStatus.DRAFT,
                to: ExamStatus.SCHEDULED,
                allowed: true,
                requiresConfirmation: true,
                confirmationMessage: 'Are you sure you want to schedule this exam? Once scheduled, you can only reschedule or cancel it.'
            }
        ],
        [
            'DRAFT->CANCELLED',
            {
                from: ExamStatus.DRAFT,
                to: ExamStatus.CANCELLED,
                allowed: true,
                requiresConfirmation: true,
                confirmationMessage: 'Are you sure you want to cancel this draft exam?'
            }
        ],
        [
            'SCHEDULED->CANCELLED',
            {
                from: ExamStatus.SCHEDULED,
                to: ExamStatus.CANCELLED,
                allowed: true,
                requiresConfirmation: true,
                confirmationMessage: 'Are you sure you want to cancel this scheduled exam? This action cannot be undone.'
            }
        ],
        [
            'SCHEDULED->ONGOING',
            {
                from: ExamStatus.SCHEDULED,
                to: ExamStatus.ONGOING,
                allowed: true,
                requiresConfirmation: false
            }
        ],
        [
            'RE_SCHEDULED->ONGOING',
            {
                from: ExamStatus.RE_SCHEDULED,
                to: ExamStatus.ONGOING,
                allowed: true,
                requiresConfirmation: false
            }
        ],
        [
            'RE_SCHEDULED->CANCELLED',
            {
                from: ExamStatus.RE_SCHEDULED,
                to: ExamStatus.CANCELLED,
                allowed: true,
                requiresConfirmation: true,
                confirmationMessage: 'Are you sure you want to cancel this RE_SCHEDULED exam?'
            }
        ],

        [
            'ONGOING->CANCELLED',
            {
                from: ExamStatus.ONGOING,
                to: ExamStatus.CANCELLED,
                allowed: true,
                requiresConfirmation: true,
                confirmationMessage: 'Are you sure you want to cancel this ongoing exam? This is an emergency action.'
            }
        ]
    ]);

    /**
     * Check if a status transition is allowed
     */
    canTransition(from: ExamStatus, to: ExamStatus): boolean {
        const key = `${from}->${to}`;
        const rule = this.transitionRules.get(key);
        return rule?.allowed || false;
    }

    /**
     * Get transition rule
     */
    getTransitionRule(from: ExamStatus, to: ExamStatus): StatusTransition | undefined {
        const key = `${from}->${to}`;
        return this.transitionRules.get(key);
    }

    /**
     * Get all possible next statuses from current status
     */
    getAvailableTransitions(currentStatus: ExamStatus): ExamStatus[] {
        const available: ExamStatus[] = [];

        for (const [key, rule] of this.transitionRules.entries()) {
            if (rule.from === currentStatus && rule.allowed) {
                available.push(rule.to);
            }
        }
        return available;
    }

    /**
     * Check if exam can be deleted (only DRAFT status)
     */
    canDelete(status: ExamStatus): boolean {
        return status === ExamStatus.DRAFT;
    }

    /**
     * Check if exam can be edited
     */
    canEdit(status: ExamStatus): boolean {
        return status === ExamStatus.DRAFT || status === ExamStatus.SCHEDULED || status === ExamStatus.RE_SCHEDULED;
    }

    /**
     * Get status badge color
     */
    getStatusBadgeClass(status: ExamStatus): string {
        const classes = {
            [ExamStatus.DRAFT]: 'bg-gray-100 text-gray-800',
            [ExamStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
            [ExamStatus.RE_SCHEDULED]: 'bg-orange-100 text-orange-800',
            [ExamStatus.ONGOING]: 'bg-green-100 text-green-800',
            [ExamStatus.RESULT_DECLARED]: 'bg-teal-100 text-teal-800',
            [ExamStatus.CANCELLED]: 'bg-red-100 text-red-800'
        };

        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    /**
     * Get status icon
     */
    getStatusIcon(status: ExamStatus): string {
        const icons = {
            [ExamStatus.DRAFT]: 'pi pi-file-edit',
            [ExamStatus.SCHEDULED]: 'pi pi-calendar-plus',
            [ExamStatus.RE_SCHEDULED]: 'pi pi-clock',
            [ExamStatus.ONGOING]: 'pi pi-play-circle',
            [ExamStatus.RESULT_DECLARED]: 'pi pi-verified',
            [ExamStatus.CANCELLED]: 'pi pi-times-circle'
        };

        return icons[status] || 'pi pi-info-circle';
    }
}
