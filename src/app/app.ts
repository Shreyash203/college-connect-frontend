import { TokenStore } from './core/services/token-store.service';
import { NativeShell } from './core/services/native-shell.service';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CurrentUserService } from './core/services/current-user.service';
import { IntercollegeService } from './features/feed/services/intercollege.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit, OnDestroy {
  protected title = 'college-connect';
  private tokens = inject(TokenStore);
  private authService = inject(AuthService);
  private router = inject(Router);
  protected currentUser = inject(CurrentUserService);
  private intercollegeService = inject(IntercollegeService);
  protected isLoggedIn$ = this.currentUser.user$;
  protected darkMode = false;

  protected unreadCount = 0;
  private isUserLoggedIn = false;
  private loginSub?: Subscription;
  private routeSub?: Subscription;

  private nativeShell = inject(NativeShell);

  ngOnInit() {
    void this.nativeShell.start().catch(() => console.error('Native shell initialization failed'));
    this.checkTokenValidity();
    this.darkMode = localStorage.getItem('theme') === 'dark';
    this.applyTheme();

    // 1. Fetch count when user logs in
    this.loginSub = this.isLoggedIn$.subscribe(isLoggedIn => {
      this.isUserLoggedIn = isLoggedIn;
      if (isLoggedIn) {
        this.fetchUnreadCount();
      } else {
        this.unreadCount = 0;
      }
    });

    // 2. Fetch count whenever user navigates to a new page (keeps Azure container asleep when idle)
    this.routeSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.isUserLoggedIn) {
        this.fetchUnreadCount();
      }
    });
  }

  ngOnDestroy() {
    if (this.loginSub) this.loginSub.unsubscribe();
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  fetchUnreadCount() {
    this.intercollegeService.getUnreadCount().subscribe({
      next: (res) => this.unreadCount = res.unread_count,
      error: () => {}
    });
  }

  private checkTokenValidity() {
    // Expired access tokens are retained so the interceptor can use the refresh cookie.
    const token = this.tokens.get();
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
    void this.nativeShell.theme(this.darkMode).catch(() => {});
    document.body.classList.toggle('bg-slate-950', this.darkMode);
    document.body.classList.toggle('text-slate-100', this.darkMode);
  }
}
