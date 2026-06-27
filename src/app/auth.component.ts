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
      <form (ngSubmit)="register()" class="flex flex-col gap-4">
        <label class="text-sm font-medium text-slate-700">Email</label>
        <input type="email" [(ngModel)]="email" name="email" required class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500" />
        <label class="text-sm font-medium text-slate-700">Password</label>
        <input type="password" [(ngModel)]="password" name="password" required minlength="8" class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500" />
        <button type="submit" class="mt-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">Register</button>
      </form>
      <div *ngIf="message" class="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ message }}</div>
    </div>
  `,
  styles: []
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  message = '';

  register() {
    const request: RegisterRequest = {
      email: this.email,
      password: this.password,
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.message = 'Registration successful. Proceed to login.';
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const detail = err.error?.detail || err.error?.message || err.statusText || err.message;
        this.message = `Registration failed${detail ? ': ' + detail : '.'}`;
      },
    });
  }
}
