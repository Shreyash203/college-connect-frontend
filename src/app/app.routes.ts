import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { AuthComponent } from './features/authentication/auth.component';
import { ProfileComponent } from './features/profile/profile.component';
import { FeedComponent } from './features/feed/feed.component';
import { ForgotPasswordComponent } from './features/authentication/forgot-password.component';
import { ResetPasswordComponent } from './features/authentication/reset-password.component';
import { MarketplaceComponent } from './features/marketplace/marketplace.component';
import { DiscoverComponent } from './features/profile/discover.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { ChatComponent } from './features/chat/chat.component';
import { authGuard } from './core/guards/auth.guard';
import { profileGuard } from './core/guards/profile.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'register', component: AuthComponent },
  { path: 'login', component: AuthComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'feed', component: FeedComponent, canActivate: [authGuard, profileGuard] },
  // New feature routes - protected
  { path: 'marketplace', component: MarketplaceComponent, canActivate: [authGuard, profileGuard] },
  { path: 'discover', component: DiscoverComponent, canActivate: [authGuard, profileGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard, profileGuard] },
  { path: 'messages', component: ChatComponent, canActivate: [authGuard, profileGuard] },
];
