import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styles: []
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  otp = '';
  newPassword = '';
  step: 'request' | 'reset' = 'request';
  message = '';
  messageType: 'success' | 'error' = 'success';

  sendResetCode() {
    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: (res) => {
        this.message = res.message;
        this.messageType = 'success';
        this.step = 'reset';
      },
      error: (err) => {
        const detail = err.error?.detail || err.error?.message || err.statusText || err.message;
        this.message = `Failed to send code${detail ? ': ' + detail : '.'}`;
        this.messageType = 'error';
      },
    });
  }

  resetPassword() {
    this.authService.resetPassword({ email: this.email, otp: this.otp, new_password: this.newPassword }).subscribe({
      next: (res) => {
        this.message = res.message;
        this.messageType = 'success';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        const detail = err.error?.detail || err.error?.message || err.statusText || err.message;
        this.message = `Reset failed${detail ? ': ' + detail : '.'}`;
        this.messageType = 'error';
      },
    });
  }
}
