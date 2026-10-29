import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    inject(Router).navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  return true;
};
