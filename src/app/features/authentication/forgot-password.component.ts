import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styles: []
})
export class ForgotPasswordComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  otp = '';
  newPassword = '';
  step: 'request' | 'reset' = 'request';
  message = '';
  messageType: 'success' | 'error' = 'success';
  isSendingCode = false;
  isResettingPassword = false;
  resendCooldownSeconds = 0;
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  sendResetCode() {
    if (this.isSendingCode || this.resendCooldownSeconds > 0) return;
    this.requestResetCode(false);
  }

  resendResetCode() {
    if (this.isSendingCode || this.resendCooldownSeconds > 0) return;
    this.startResendCooldown();
    this.requestResetCode(true);
  }

  private requestResetCode(isResend: boolean) {
    this.isSendingCode = true;
    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: (res) => {
        this.message = res.message;
        this.messageType = 'success';
        this.step = 'reset';
        if (!isResend) this.startResendCooldown();
        this.isSendingCode = false;
      },
      error: (err) => {
        const detail = err.error?.detail || err.error?.message || err.statusText || err.message;
        this.message = `Failed to send code${detail ? ': ' + detail : '.'}`;
        this.messageType = 'error';
        const retryAfter = Number(err.headers?.get('Retry-After'));
        if (err.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0) {
          this.startResendCooldown(retryAfter);
        }
        this.isSendingCode = false;
      },
    });
  }

  resetPassword() {
    if (this.isResettingPassword) return;
    this.isResettingPassword = true;
    this.authService.resetPassword({ email: this.email, otp: this.otp, new_password: this.newPassword }).subscribe({
      next: (res) => {
        this.message = res.message;
        this.messageType = 'success';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        const detail = this.getErrorMessage(err, 'Please check the code and try again.');
        this.message = `Reset failed: ${detail}`;
        this.messageType = 'error';
        this.isResettingPassword = false;
      },
    });
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    const formatValue = (value: unknown): string | null => {
      if (typeof value === 'string') return value;
      if (Array.isArray(value)) {
        const messages = value
          .map((item) => formatValue(item))
          .filter((item): item is string => item !== null);
        return messages.length > 0 ? messages.join(' | ') : null;
      }
      if (typeof value !== 'object' || value === null) return null;

      const detail = value as Record<string, unknown>;
      const message = formatValue(detail['msg']);
      if (message) {
        const location = Array.isArray(detail['loc'])
          ? detail['loc'].filter((part): part is string => typeof part === 'string').join('.')
          : '';
        return location ? `${location}: ${message}` : message;
      }

      for (const key of ['detail', 'message', 'error']) {
        const nestedMessage = formatValue(detail[key]);
        if (nestedMessage) return nestedMessage;
      }
      return null;
    };

    if (typeof error !== 'object' || error === null) return fallback;
    const response = error as Record<string, unknown>;
    return (
      formatValue(response['error']) ??
      formatValue(response['statusText']) ??
      formatValue(response['message']) ??
      fallback
    );
  }

  ngOnDestroy() {
    this.clearResendCooldown();
  }

  private startResendCooldown(seconds = 30) {
    this.clearResendCooldown();
    this.resendCooldownSeconds = Math.ceil(seconds);
    this.cooldownInterval = setInterval(() => {
      this.resendCooldownSeconds = Math.max(0, this.resendCooldownSeconds - 1);
      if (this.resendCooldownSeconds === 0) {
        this.clearResendCooldown();
      }
    }, 1000);
  }

  private clearResendCooldown() {
    if (this.cooldownInterval !== null) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }
}
