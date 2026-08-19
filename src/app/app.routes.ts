import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { AuthComponent } from './auth.component';
import { ProfileComponent } from './profile.component';
import { FeedComponent } from './feed.component';
import { ForgotPasswordComponent } from './forgot-password.component';
import { ResetPasswordComponent } from './reset-password.component';
import { MarketplaceComponent } from './marketplace.component';
import { DiscoverComponent } from './discover.component';
import { NotificationsComponent } from './notifications.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'register', component: AuthComponent },
  { path: 'login', component: AuthComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'feed', component: FeedComponent, canActivate: [authGuard] },
  // New feature routes - protected
  { path: 'marketplace', component: MarketplaceComponent, canActivate: [authGuard] },
  { path: 'discover', component: DiscoverComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
];
