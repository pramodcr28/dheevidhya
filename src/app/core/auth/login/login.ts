import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthServerProvider } from '../../services/auth-jwt.service';
import { mergeMap } from 'rxjs';
import { AccountService } from '../../services/account.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ButtonModule, 
        CheckboxModule, 
        InputTextModule, 
        PasswordModule, 
        FormsModule, 
        RouterModule, 
        RippleModule, 
        AppFloatingConfigurator,
        ReactiveFormsModule],
    templateUrl: 'login.html'
})
export class Login {
    username = viewChild.required<ElementRef>('username');
    private readonly accountService = inject(AccountService);
    authenticationError = signal(false);
  
    loginForm = new FormGroup({
      username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      rememberMe: new FormControl(false, { nonNullable: true }),
    });
  
    private  authServerProvider = inject(AuthServerProvider);
    private  router = inject(Router);
  
    ngOnInit(): void {
  
    }
  
    ngAfterViewInit(): void {
      this.username().nativeElement.focus();
    }
  
    login(): void {
      this.authServerProvider.login(this.loginForm.getRawValue())
      .pipe(mergeMap(()=>this.accountService.identity(true)))
      .subscribe({
        next: () => {
          this.authenticationError.set(false);
          if (!this.router.getCurrentNavigation()) {

            this.router.navigate(['']);
          }
        },
        error: () => this.authenticationError.set(true),
      });
    }
}
