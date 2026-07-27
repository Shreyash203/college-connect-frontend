import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { CurrentUserService } from './current-user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styles: []
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private currentUser = inject(CurrentUserService);

  email = '';
  password = '';
  successMessage = '';
  errorMessage = '';
  private isLoadingSignal = signal(false);

  isLoading() {
    return this.isLoadingSignal();
  }

  ngOnInit() {
    if (localStorage.getItem('auth_token')) {
      this.router.navigate(['/profile']);
    }
  }

  login() {
    this.successMessage = '';
    this.errorMessage = '';
    this.isLoadingSignal.set(true);

    this.authService.login(this.email, this.password).subscribe({
      next: (result) => {
        localStorage.setItem('auth_token', result.access_token);
        this.currentUser.setLoggedIn(true);
        this.isLoadingSignal.set(false);
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Login failed.';
        this.isLoadingSignal.set(false);
      },
    });
  }
}
