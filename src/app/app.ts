import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';
import { CurrentUserService } from './current-user.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink],
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
    this.darkMode = localStorage.getItem('theme') === 'dark';
    this.applyTheme();
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
