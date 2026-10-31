import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStore } from '../services/token-store.service';
export const authGuard: CanActivateFn = (_route, state) =>
  inject(TokenStore).get() ? true : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
