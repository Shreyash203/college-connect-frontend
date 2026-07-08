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
  template: `
    <div class="mx-auto flex max-w-md flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Trouble logging in?</p>
        <h2 class="text-3xl font-semibold text-slate-900">Forgot Password</h2>
      </div>
      <ng-container *ngIf="step === 'request'">
        <form (ngSubmit)="sendResetCode()" class="flex flex-col gap-4">
          <label class="text-sm font-medium text-slate-700">Email</label>
          <input type="email" [(ngModel)]="email" name="email" required class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500" />
          <button type="submit" class="mt-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">Send Reset Code</button>
        </form>
      </ng-container>
      <ng-container *ngIf="step === 'reset'">
        <form (ngSubmit)="resetPassword()" class="flex flex-col gap-4">
          <p class="text-sm text-slate-600">Enter the code sent to <strong>{{ email }}</strong> and your new password.</p>
          <label class="text-sm font-medium text-slate-700">Reset Code</label>
          <input type="text" [(ngModel)]="otp" name="otp" required maxlength="6" class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500" />
          <label class="text-sm font-medium text-slate-700">New Password</label>
          <input type="password" [(ngModel)]="newPassword" name="newPassword" required minlength="8" class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500" />
          <button type="submit" class="mt-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">Reset Password</button>
        </form>
      </ng-container>
      <div *ngIf="message" [ngClass]="messageType === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'" class="rounded-2xl px-4 py-3 text-sm">{{ message }}</div>
      <a routerLink="/login" class="text-sm text-blue-600 hover:underline">Back to Login</a>
    </div>
  `,
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
