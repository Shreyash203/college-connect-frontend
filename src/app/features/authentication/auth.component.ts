import { TokenStore } from '../../core/services/token-store.service';
import { Capacitor } from '@capacitor/core';
import { Component, inject, OnInit, OnDestroy, AfterViewInit, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, RegisterRequest } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import { registerPlugin } from '@capacitor/core';

declare var google: any;

interface GoogleAuthPlugin {
  signIn(): Promise<{ credential: string }>;
}

const GoogleAuth = registerPlugin<GoogleAuthPlugin>('GoogleAuth');

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styles: []
})
export class AuthComponent implements OnInit, OnDestroy, AfterViewInit {
  private tokens = inject(TokenStore);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private currentUser = inject(CurrentUserService);
  private ngZone = inject(NgZone);

  native = Capacitor.isNativePlatform();
  androidNative = Capacitor.getPlatform() === 'android';
  private destroyed = false;
  private googleTimer?: ReturnType<typeof setTimeout>;

  mode: 'login' | 'register' = 'login';
  step: 'form' | 'otp' = 'form';

  email = '';
  password = '';
  showPassword = false;
  otp = '';
  pendingId: string | null = null;

  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  isProcessing = false;
  returnUrl = '';
  resendCooldownSeconds = 0;
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    // If the path is /register, start in register mode
    if (this.router.url.includes('/register')) {
      this.mode = 'register';
    }

    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
        if (this.returnUrl.includes('/marketplace')) {
          this.showMessage('🔒 Campus Privacy: Log in with your college email to access the Campus Bazaar.', 'info');
        } else if (this.returnUrl.includes('/discover')) {
          this.showMessage('🔒 Student Privacy Protected: Log in to view student profiles and connect.', 'info');
        } else if (this.returnUrl.includes('/feed')) {
          this.showMessage('🔒 Log in with your college email to access Confessions and Launchpad.', 'info');
        } else {
          this.showMessage('🔒 Please log in to access this page.', 'info');
        }
      }
    });

    if (this.tokens.get()) {
      this.router.navigateByUrl(this.returnUrl || '/profile');
    }
  }

  ngAfterViewInit() {
    this.initGoogleBtn();
  }

  ngOnDestroy() {
    this.clearResendCooldown();
    this.destroyed = true;
    clearTimeout(this.googleTimer);
  }

  toggleMode() {
    this.mode = this.mode === 'login' ? 'register' : 'login';
    this.step = 'form';
    this.message = '';

    // Re-render google button to update text
    setTimeout(() => {
        this.initGoogleBtn();
    }, 100);
  }

  private initGoogleBtn() {
    if (this.native || this.destroyed) return;
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.initialize({
        client_id: '774747436427-57ign6kn9qt9tat4ipq7cnb04hio3rmn.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleCredentialResponse(response),
        ux_mode: 'popup',
        auto_select: false
      });
      const el = document.getElementById('googleAuthBtn');
      if (el) {
        google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: this.mode === 'login' ? 'signin_with' : 'signup_with',
          shape: 'pill'
        });
      }
    } else {
      this.googleTimer = setTimeout(() => this.initGoogleBtn(), 400);
    }
  }

  handleGoogleCredentialResponse(response: any) {
    this.ngZone.run(() => {
      if (!response || !response.credential) return;
      this.message = '';
      this.isProcessing = true;
      this.authService.loginWithGoogle(response.credential).subscribe({
        next: async (res) => {
          if (!(await this.saveSession(res.access_token))) return;
          this.currentUser.setLoggedIn(true);
          this.isProcessing = false;
          this.router.navigateByUrl(this.returnUrl || '/profile');
        },
        error: (err) => {
          this.showMessage(this.extractErrorMessage(err, 'Google authentication failed.'), 'error');
          this.isProcessing = false;
        }
      });
    });
  }

  async signInWithGoogleNative() {
    if (this.isProcessing) return;
    this.message = '';
    this.isProcessing = true;
    try {
      const { credential } = await GoogleAuth.signIn();
      if (!credential) throw new Error('Google did not return an ID token.');
      this.handleGoogleCredentialResponse({ credential });
    } catch (error: any) {
      this.showMessage(this.extractErrorMessage(error, 'Google sign-in was cancelled or could not start.'), 'error');
      this.isProcessing = false;
    }
  }

  private async saveSession(token: string): Promise<boolean> {
    try { await this.tokens.set(token); return true; }
    catch {
      this.authService.logout();
      this.isProcessing = false;
      this.showMessage('Cannot securely save your session. Please unlock your device and try again.', 'error');
      return false;
    }
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

  showMessage(msg: string, type: 'success' | 'error' | 'info') {
    this.message = msg;
    this.messageType = type;
  }

  onSubmit() {
    if (this.isProcessing) return;

    if (!this.email || !this.email.trim() || !this.password || !this.password.trim()) {
      this.showMessage('Please enter both your college email and password.', 'error');
      return;
    }

    if (this.mode === 'login') {
      this.executeLogin();
    } else {
      this.executeRegister();
    }
  }

  private executeLogin() {
    this.isProcessing = true;
    this.authService.login(this.email.trim(), this.password).subscribe({
      next: async (result) => {
        if (!(await this.saveSession(result.access_token))) return;
        this.currentUser.setLoggedIn(true);
        this.isProcessing = false;
        this.router.navigateByUrl(this.returnUrl || '/profile');
      },
      error: (err) => {
        this.showMessage(this.extractErrorMessage(err, 'Login failed.'), 'error');
        this.isProcessing = false;
      },
    });
  }

  private executeRegister() {
    const request: RegisterRequest = {
      email: this.email.trim(),
      password: this.password,
    };

    this.isProcessing = true;
    this.authService.register(request).subscribe({
      next: async (res) => {
        this.pendingId = res.pending_id;
        this.step = 'otp';
        this.startResendCooldown();
        this.showMessage(res.message, 'success');
        this.isProcessing = false;
      },
      error: (err) => {
        this.showMessage(this.extractErrorMessage(err, 'Registration failed.'), 'error');
        this.isProcessing = false;
      },
    });
  }

  verifyOtp() {
    if (this.pendingId == null) {
      this.showMessage('No pending registration found.', 'error');
      return;
    }
    this.isProcessing = true;
    this.authService.verifyRegistration({ pending_id: this.pendingId, otp: this.otp }).subscribe({
      next: async (res) => {
        if (!(await this.saveSession(res.access_token))) return;
        this.currentUser.setLoggedIn(true);
        this.showMessage('Registration successful!', 'success');
        this.isProcessing = false;
        this.router.navigateByUrl(this.returnUrl || '/profile');
      },
      error: (err) => {
        this.showMessage(this.extractErrorMessage(err, 'Verification failed.'), 'error');
        this.isProcessing = false;
      },
    });
  }

  resendOtp() {
    if (this.pendingId == null) {
      this.showMessage('No pending registration found.', 'error');
      return;
    }
    if (this.isProcessing || this.resendCooldownSeconds > 0) return;
    this.startResendCooldown();
    this.authService.resendOtp({ pending_id: this.pendingId }).subscribe({
      next: async (res) => {
        this.showMessage(res.message, 'success');
      },
      error: (err) => {
        const retryAfter = Number(err.headers?.get('Retry-After'));
        if (err.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0) {
          this.startResendCooldown(retryAfter);
        }
        this.showMessage(this.extractErrorMessage(err, 'Failed to resend code.'), 'error');
      },
    });
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
