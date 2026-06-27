import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private userSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('auth_token'));
  user$: Observable<boolean> = this.userSubject.asObservable();

  setLoggedIn(loggedIn: boolean) {
    this.userSubject.next(loggedIn);
  }
}
