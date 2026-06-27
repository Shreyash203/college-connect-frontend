import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { AuthComponent } from './auth.component';
import { LoginComponent } from './login.component';
import { ProfileComponent } from './profile.component';
import { FeedComponent } from './feed.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'register', component: AuthComponent },
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'feed', component: FeedComponent, canActivate: [authGuard] },
];
