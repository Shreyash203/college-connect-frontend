import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { CurrentUserService } from './current-user.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const token = localStorage.getItem('auth_token');
  const currentUser = inject(CurrentUserService);

  // Skip attaching token for Azure Blob Storage requests
  if (req.url.includes('blob.core.windows.net')) {
    return next(req);
  }

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err) => {
      // If the backend says the token is invalid/expired, log out the user.
      if (err.status === 401) {
        localStorage.removeItem('auth_token');
        currentUser.setLoggedIn(false);
      }
      return throwError(() => err);
    })
  );
};
