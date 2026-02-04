import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConfirmationConfig } from '../../pages/models/common.model';

@Injectable({ providedIn: 'root' })
export class DheeConfirmationService {
    private _visible = new BehaviorSubject<boolean>(false);
    private _config = new BehaviorSubject<ConfirmationConfig>({});

    visible$ = this._visible.asObservable();
    config$ = this._config.asObservable();

    confirm(config: ConfirmationConfig) {
        this._config.next(config);
        this._visible.next(true);
    }

    accept() {
        const cfg = this._config.value;
        this._visible.next(false);
        cfg.accept?.();
    }

    reject() {
        const cfg = this._config.value;
        this._visible.next(false);
        cfg.reject?.();
    }
}
