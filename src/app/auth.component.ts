import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from './auth.service';
import { CurrentUserService } from './current-user.service';

declare var google: any;

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styles: []
})
export class AuthComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private currentUser = inject(CurrentUserService);

  email = '';

  ngOnInit() {
    if (localStorage.getItem('auth_token')) {
      this.router.navigate(['/profile']);
    }
  }

  ngAfterViewInit() {
    this.initGoogleBtn();
  }

  private initGoogleBtn() {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.initialize({
        client_id: '774747436427-57ign6kn9qt9tat4ipq7cnb04hio3rmn.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleCredentialResponse(response),
        ux_mode: 'popup',
        auto_select: false
      });
      const el = document.getElementById('googleRegisterBtn');
      if (el) {
        google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signup_with',
          shape: 'pill'
        });
      }
    } else {
      setTimeout(() => this.initGoogleBtn(), 400);
    }
  }

  handleGoogleCredentialResponse(response: any) {
    if (!response || !response.credential) return;
    this.message = '';
    this.isProcessing = true;
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (res) => {
        localStorage.setItem('auth_token', res.access_token);
        this.currentUser.setLoggedIn(true);
        this.isProcessing = false;
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.message = this.extractErrorMessage(err, 'Google registration failed.');
        this.messageType = 'error';
        this.isProcessing = false;
      }
    });
  }

  password = '';
  showPassword = false;
  otp = '';
  pendingId: number | null = null;
  step: 'register' | 'otp' = 'register';
  message = '';
  messageType: 'success' | 'error' = 'success';
  isProcessing = false;

  extractErrorMessage(err: any, fallback: string): string {
    if (!err) return fallback;
    const detail = err.error?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => {
        if (typeof d === 'string') return d;
        const field = d.loc && d.loc.length > 0 ? d.loc[d.loc.length - 1] : '';
        return field ? `${field}: ${d.msg}` : d.msg;
      }).join(' | ');
    }
    if (err.error?.message) return err.error.message;
    if (err.message) return err.message;
    return fallback;
  }

  register() {
    if (this.isProcessing) {
      return;
    }

    const request: RegisterRequest = {
      email: this.email,
      password: this.password,
    };

    this.isProcessing = true;
    this.authService.register(request).subscribe({
      next: (res) => {
        this.pendingId = res.pending_id;
        this.step = 'otp';
        this.message = res.message;
        this.messageType = 'success';
        this.isProcessing = false;
      },
      error: (err) => {
        this.message = this.extractErrorMessage(err, 'Registration failed.');
        this.messageType = 'error';
        this.isProcessing = false;
      },
    });
  }

  verifyOtp() {
    if (this.pendingId == null) {
      this.message = 'No pending registration found.';
      this.messageType = 'error';
      return;
    }
    this.isProcessing = true;
    this.authService.verifyRegistration({ pending_id: this.pendingId, otp: this.otp }).subscribe({
      next: (res) => {
        localStorage.setItem('auth_token', res.access_token);
        this.currentUser.setLoggedIn(true);
        this.message = 'Registration successful!';
        this.messageType = 'success';
        this.isProcessing = false;
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.message = this.extractErrorMessage(err, 'Verification failed.');
        this.messageType = 'error';
        this.isProcessing = false;
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
        this.message = this.extractErrorMessage(err, 'Failed to resend code.');
        this.messageType = 'error';
      },
    }); 
  }
}
 