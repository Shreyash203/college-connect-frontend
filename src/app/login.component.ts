import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { CurrentUserService } from './current-user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mx-auto flex max-w-md flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Welcome back</p>
        <h2 class="text-3xl font-semibold text-slate-900">Login</h2>
      </div>
      <form (ngSubmit)="login()" class="flex flex-col gap-4">
        <label class="text-sm font-medium text-slate-700">Email</label>
        <input type="email" [(ngModel)]="email" name="email" required class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-blue-500" />
        <label class="text-sm font-medium text-slate-700">Password</label>
        <input type="password" [(ngModel)]="password" name="password" required class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-blue-500" />
        <button type="submit" class="mt-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">Login</button>
      </form>
      <div *ngIf="message" class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ message }}</div>
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
  message = '';

  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: (result) => {
        localStorage.setItem('auth_token', result.access_token);
        this.currentUser.setLoggedIn(true);
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.message = err.error?.detail || 'Login failed.';
      },
    });
  }
}
