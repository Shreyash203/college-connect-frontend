import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { CurrentUserService } from './current-user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mx-auto flex max-w-md flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{{ resetMode ? 'Reset access' : 'Welcome back' }}</p>
        <h2 class="text-3xl font-semibold text-slate-900">{{ resetMode ? 'Reset your password' : 'Login' }}</h2>
        <p class="text-sm text-slate-600">
          {{ resetMode ? 'Request a reset code by email, then set a new password with that code.' : 'Sign in with your verified college account.' }}
        </p>
      </div>

      <form *ngIf="!resetMode; else resetTemplate" (ngSubmit)="login()" class="flex flex-col gap-4">
        <label class="text-sm font-medium text-slate-700">Email</label>
        <input type="email" [(ngModel)]="email" name="email" required class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-blue-500" />
        <label class="text-sm font-medium text-slate-700">Password</label>
        <input type="password" [(ngModel)]="password" name="password" required class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-blue-500" />
        <button type="submit" class="mt-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">Login</button>
        <a routerLink="/forgot-password" class="text-sm text-blue-600 hover:underline">Forgot password?</a>
      </form>

      <ng-template #resetTemplate>
        <form (ngSubmit)="submitPasswordReset()" class="flex flex-col gap-4">
          <label class="text-sm font-medium text-slate-700">Email</label>
          <input type="email" [(ngModel)]="resetEmail" name="resetEmail" required class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-blue-500" />
          <button type="button" (click)="requestResetCode()" class="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">Send reset code</button>
          <label class="text-sm font-medium text-slate-700">Reset code</label>
          <input type="text" [(ngModel)]="resetOtp" name="resetOtp" required minlength="6" maxlength="6" inputmode="numeric" class="w-full rounded-2xl border border-slate-300 px-4 py-3 tracking-[0.4em] outline-none ring-0 transition focus:border-blue-500" />
          <label class="text-sm font-medium text-slate-700">New password</label>
          <input type="password" [(ngModel)]="newPassword" name="newPassword" required minlength="8" class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-blue-500" />
          <button type="submit" class="mt-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">Reset password</button>
        </form>
      </ng-template>

      <button type="button" (click)="toggleResetMode()" class="self-start text-sm font-semibold text-blue-600 transition hover:text-blue-700">
        {{ resetMode ? 'Back to login' : 'Forgot password?' }}
      </button>

      <div *ngIf="successMessage" class="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ successMessage }}</div>
      <div *ngIf="errorMessage" class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private currentUser = inject(CurrentUserService);

  email = '';
  password = '';
  resetMode = false;
  resetEmail = '';
  resetOtp = '';
  newPassword = '';
  successMessage = '';
  errorMessage = '';

  login() {
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (result) => {
        localStorage.setItem('auth_token', result.access_token);
        this.currentUser.setLoggedIn(true);
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Login failed.';
      },
    });
  }

  toggleResetMode() {
    this.resetMode = !this.resetMode;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.resetMode && !this.resetEmail) {
      this.resetEmail = this.email;
    }
  }

  requestResetCode() {
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.forgotPassword({ email: this.resetEmail }).subscribe({
      next: (result) => {
        this.successMessage = result.message;
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Could not send reset code.';
      },
    });
  }

  submitPasswordReset() {
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.resetPassword({
      email: this.resetEmail,
      otp: this.resetOtp,
      new_password: this.newPassword,
    }).subscribe({
      next: (result) => {
        this.successMessage = result.message;
        this.resetMode = false;
        this.email = this.resetEmail;
        this.password = '';
        this.resetOtp = '';
        this.newPassword = '';
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Could not reset password.';
      },
    });
  }
}
