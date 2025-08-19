import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthServerProvider } from '../../services/auth-jwt.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Message } from 'primeng/message';
import { AppFloatingConfigurator } from '../../layout/app.floatingconfigurator';
@Component({
  selector: 'app-reset-finish',
  imports: [
    RouterModule, FormsModule, ReactiveFormsModule,
     CommonModule,
    ReactiveFormsModule,
    PasswordModule,
    InputTextModule,
    ButtonModule,
    Message,
    FormsModule,
    AppFloatingConfigurator
  ],
  templateUrl: './reset-finish.component.html',
  styles: ``
})
export class ResetFinishComponent {
 newPassword = viewChild.required<ElementRef>('newPassword');
  initialized = signal(false);
  doNotMatch = signal(false);
  error = signal(false);
  success = signal(false);
  key = signal('');

  passwordForm = new FormGroup({
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4), Validators.maxLength(50)]
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4), Validators.maxLength(50)]
    })
  });

  private authService = inject(AuthServerProvider);
  private readonly route = inject(ActivatedRoute);

  get newPasswordRef() {
    return this.passwordForm.get('newPassword')!;
  }
  get confirmPasswordRef() {
    return this.passwordForm.get('confirmPassword')!;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['key']) {
        this.key.set(params['key']);
      }
      this.initialized.set(true);
    });
  }

  ngAfterViewInit(): void {
    this.newPassword()?.nativeElement?.focus();
  }

  finishReset(): void {
    this.doNotMatch.set(false);
    this.error.set(false);

    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();

    if (newPassword !== confirmPassword) {
      this.doNotMatch.set(true);
    } else {
      this.authService.save(this.key(), newPassword).subscribe({
        next: () => this.success.set(true),
        error: () => this.error.set(true)
      });
    }
  }
}
