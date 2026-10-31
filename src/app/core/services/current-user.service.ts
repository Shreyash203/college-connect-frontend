import { TokenStore } from './token-store.service';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private tokens = inject(TokenStore);
  private userSubject = new BehaviorSubject<boolean>(!!this.tokens.get());
  user$: Observable<boolean> = this.userSubject.asObservable();

  setLoggedIn(loggedIn: boolean) {
    this.userSubject.next(loggedIn);
  }
}
