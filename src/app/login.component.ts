import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private currentUser = inject(CurrentUserService);

  email = '';
  password = '';
  showPassword = false;
  successMessage = '';
  errorMessage = '';
  infoMessage = '';
  returnUrl = '';
  private isLoadingSignal = signal(false);

  isLoading() {
    return this.isLoadingSignal();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
        if (this.returnUrl.includes('/marketplace')) {
          this.infoMessage = '🔒 Campus Privacy: Log in with your college email to access the Campus Bazaar.';
        } else if (this.returnUrl.includes('/discover')) {
          this.infoMessage = '🔒 Student Privacy Protected: Log in to view student profiles and connect.';
        } else if (this.returnUrl.includes('/feed')) {
          this.infoMessage = '🔒 Log in with your college email to access Confessions and Launchpad.';
        } else {
          this.infoMessage = '🔒 Please log in to access this page.';
        }
      }
    });

    if (localStorage.getItem('auth_token')) {
      this.router.navigateByUrl(this.returnUrl || '/profile');
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
        this.router.navigateByUrl(this.returnUrl || '/profile');
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Login failed.';
        this.isLoadingSignal.set(false);
      },
    });
  }
}
