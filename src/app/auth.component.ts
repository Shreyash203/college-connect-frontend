import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from './auth.service';
import { CurrentUserService } from './current-user.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styles: []
})
export class AuthComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private currentUser = inject(CurrentUserService);

  email = '';

  ngOnInit() {
    if (localStorage.getItem('auth_token')) {
      this.router.navigate(['/profile']);
    }
  }
  password = '';
  otp = '';
  pendingId: number | null = null;
  step: 'register' | 'otp' = 'register';
  message = '';
  messageType: 'success' | 'error' = 'success';
  isRegistering = false;

  register() {
    if (this.isRegistering) {
      return;
    }

    const request: RegisterRequest = {
      email: this.email,
      password: this.password,
    };

    this.isRegistering = true;
    this.authService.register(request).subscribe({
      next: (res) => {
        this.pendingId = res.pending_id;
        this.step = 'otp';
        this.message = res.message;
        this.messageType = 'success';
        this.isRegistering = false;
      },
      error: (err) => {
        const detail = err.error?.detail || err.error?.message || err.statusText || err.message;
        this.message = `Registration failed${detail ? ': ' + detail : '.'}`;
        this.messageType = 'error';
        this.isRegistering = false;
      },
    });
  }

  verifyOtp() {
    if (this.pendingId == null) {
      this.message = 'No pending registration found.';
      this.messageType = 'error';
      return;
    }
    this.authService.verifyRegistration({ pending_id: this.pendingId, otp: this.otp }).subscribe({
      next: (res) => {
        localStorage.setItem('auth_token', res.access_token);
        this.currentUser.setLoggedIn(true);
        this.message = 'Registration successful!';
        this.messageType = 'success';
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        const detail = err.error?.detail || err.error?.message || err.statusText || err.message;
        this.message = `Verification failed${detail ? ': ' + detail : '.'}`;
        this.messageType = 'error';
      },
    });
  }

  resendOtp() {
    if (this.pendingId == null) {
      this.message = 'No pending registration found.';
      this.messageType = 'error';
      return;
    }
    this.authService.resendOtp({ pending_id: this.pendingId }).subscribe({
      next: (res) => {
        this.message = res.message;
        this.messageType = 'success';
      },
      error: (err) => {
        const detail = err.error?.detail || err.error?.message || err.statusText || err.message;
        this.message = `Failed to resend code${detail ? ': ' + detail : '.'}`;
        this.messageType = 'error';
      },
    });
  }
}
