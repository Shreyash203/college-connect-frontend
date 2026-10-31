import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/authentication/auth.component').then(m => m.AuthComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/authentication/auth.component').then(m => m.AuthComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/authentication/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/authentication/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'feed',
    loadComponent: () =>
      import('./features/feed/feed.component').then(m => m.FeedComponent),
    canActivate: [authGuard],
  },
  // New feature routes - protected
  {
    path: 'marketplace/:id',
    loadComponent: () => import('./features/marketplace/item-detail.component').then(m => m.ItemDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'marketplace',
    loadComponent: () =>
      import('./features/marketplace/marketplace.component').then(m => m.MarketplaceComponent),
    canActivate: [authGuard],
  },
  {
    path: 'discover',
    loadComponent: () =>
      import('./features/profile/discover.component').then(m => m.DiscoverComponent),
    canActivate: [authGuard],
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'messages',
    loadComponent: () =>
      import('./features/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard],
  },
];
