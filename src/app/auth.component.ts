import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from './auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mx-auto flex max-w-md flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Join us</p>
        <h2 class="text-3xl font-semibold text-slate-900">Create your account</h2>
      </div>
      <ng-container *ngIf="step === 'register'">
        <form (ngSubmit)="register()" class="flex flex-col gap-4">
          <label class="text-sm font-medium text-slate-700">Email</label>
          <input type="email" [(ngModel)]="email" name="email" required [disabled]="isRegistering" class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100" />
          <label class="text-sm font-medium text-slate-700">Password</label>
          <input type="password" [(ngModel)]="password" name="password" required minlength="8" [disabled]="isRegistering" class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100" />
          <button type="submit" [disabled]="isRegistering" class="mt-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400">
            {{ isRegistering ? 'Sending OTP...' : 'Register' }}
          </button>
        </form>
      </ng-container>
      <ng-container *ngIf="step === 'otp'">
        <form (ngSubmit)="verifyOtp()" class="flex flex-col gap-4">
          <p class="text-sm text-slate-600">We've sent a verification code to <strong>{{ email }}</strong>. Enter it below to complete your registration.</p>
          <label class="text-sm font-medium text-slate-700">Verification Code</label>
          <input type="text" [(ngModel)]="otp" name="otp" required maxlength="6" class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500" />
          <button type="submit" class="mt-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">Verify</button>
          <button type="button" (click)="resendOtp()" class="text-sm text-blue-600 hover:underline">Resend code</button>
        </form>
      </ng-container>
      <div *ngIf="message" [ngClass]="messageType === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'" class="rounded-2xl px-4 py-3 text-sm">{{ message }}</div>
    </div>
  `,
  styles: []
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
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
