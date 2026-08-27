import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CurrentUserService } from './core/services/current-user.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  protected title = 'college-connect';
  private authService = inject(AuthService);
  private router = inject(Router);
  protected currentUser = inject(CurrentUserService);
  protected isLoggedIn$ = this.currentUser.user$;
  protected darkMode = false;

  ngOnInit() {
    this.checkTokenValidity();
    this.darkMode = localStorage.getItem('theme') === 'dark';
    this.applyTheme();
  }

  private checkTokenValidity() {
    // We intentionally do NOT delete the token here if it is expired.
    // The entire point of the Dual-Token Silent Refresh architecture is to 
    // leave the expired token in localStorage, let the API call fail with a 401,
    // and allow our HttpInterceptor to automatically fetch a new token via the HttpOnly cookie.
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.currentUser.setLoggedIn(true);
    }
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  logout() {
    this.authService.logout();
    this.currentUser.setLoggedIn(false);
    this.router.navigate(['/']);
  }

  private applyTheme() {
    document.documentElement.classList.toggle('dark', this.darkMode);
    document.body.classList.toggle('bg-slate-950', this.darkMode);
    document.body.classList.toggle('text-slate-100', this.darkMode);
  }
}
