import { Component, inject, OnInit, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { CurrentUserService } from './current-user.service';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styles: []
})
export class LoginComponent implements OnInit, AfterViewInit {
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
      const el = document.getElementById('googleLoginBtn');
      if (el) {
        google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'pill'
        });
      }
    } else {
      setTimeout(() => this.initGoogleBtn(), 400);
    }
  }

  handleGoogleCredentialResponse(response: any) {
    if (!response || !response.credential) return;
    this.isLoadingSignal.set(true);
    this.errorMessage = '';
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (res) => {
        localStorage.setItem('auth_token', res.access_token);
        this.currentUser.setLoggedIn(true);
        this.isLoadingSignal.set(false);
        this.router.navigateByUrl(this.returnUrl || '/profile');
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err, 'Google login failed.');
        this.isLoadingSignal.set(false);
      }
    });
  }

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

  login() {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.email || !this.email.trim() || !this.password || !this.password.trim()) {
      this.errorMessage = 'Please enter both your college email and password.';
      return;
    }

    this.isLoadingSignal.set(true);

    this.authService.login(this.email.trim(), this.password).subscribe({
      next: (result) => {
        localStorage.setItem('auth_token', result.access_token);
        this.currentUser.setLoggedIn(true);
        this.isLoadingSignal.set(false);
        this.router.navigateByUrl(this.returnUrl || '/profile');
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err, 'Login failed.');
        this.isLoadingSignal.set(false);
      },
    });
  }
}
