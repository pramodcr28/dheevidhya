import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AuthServerProvider } from '../../core/services/auth-jwt.service';

@Component({
  selector: 'app-profile',
  imports: [ButtonModule,ToastModule,PasswordModule,CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styles: ``,
  providers: [MessageService]
})
export class ProfileComponent {
  passwordForm!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private passwordService: AuthServerProvider,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      isTenantUser: [true]
    });
  }

  onSubmit() {
    if (this.passwordForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields correctly.'
      });
      return;
    }

    this.loading = true;
    
    this.passwordService.changePassword(this.passwordForm.value)
      .subscribe(
        response => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Password changed successfully!'
          });
          // Reset form except for tenant user status
          const isTenantUser = this.passwordForm.get('isTenantUser')?.value;
          this.passwordForm.reset({ isTenantUser });
        },
        error => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to change password. Please try again.'
          });
        }
      );
  }
}
