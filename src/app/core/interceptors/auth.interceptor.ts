import { Router } from '@angular/router';
import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, from, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { CurrentUserService } from '../services/current-user.service';
import { TokenStore } from '../services/token-store.service';
import { API_BASE_URL } from '../api.config';

let refresh$: Observable<string> | undefined;
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Signed storage URLs and third party requests must never receive our credentials.
  if (!(req.url === API_BASE_URL || req.url.startsWith(API_BASE_URL + '/'))) return next(req);
  const tokens = inject(TokenStore);
  const user = inject(CurrentUserService);
  const router = inject(Router);
  const http = new HttpClient(inject(HttpBackend));
  const token = tokens.get();
  const authEntry = /\/auth\/(login|register|verify-registration|resend-otp|google|forgot-password|reset-password|refresh|logout)(?:[/?]|$)/.test(req.url);
  const authorize = (t: string | null) => t ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : req;
  return next(authorize(token)).pipe(catchError((err: HttpErrorResponse) => {
    if (err.status !== 401 || authEntry || !token) return throwError(() => err);
    if (!refresh$) {
      refresh$ = http.post<{ access_token: string }>(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true }).pipe(
        switchMap(res => {
          if (!res.access_token) throw new Error('Missing access token');
          // A logout during refresh must never restore the session.
          if (tokens.get() !== token) throw new Error('Session changed');
          return from(tokens.set(res.access_token)).pipe(switchMap(() => from([res.access_token])));
        }),
        catchError(error => {
          // Preserve the session for transient network/server errors; expire only rejected sessions.
          if ((error.status === 401 || error.status === 403) && tokens.get() === token) {
            void tokens.clear().catch(() => console.error('Unable to clear secure session'));
            user.setLoggedIn(false);
            void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          }
          return throwError(() => error);
        }),
        finalize(() => { refresh$ = undefined; }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return refresh$.pipe(switchMap(t => next(authorize(t))));
  }));
};
