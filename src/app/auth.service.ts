import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  pending_id: number;
  message: string;
}

export interface VerifyRegistrationRequest {
  pending_id: number;
  otp: string;
}

export interface ResendOtpRequest {
  pending_id: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  new_password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = API_BASE_URL;

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, data);
  }

  verifyRegistration(data: VerifyRegistrationRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/verify-registration`, data);
  }

  resendOtp(data: ResendOtpRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/resend-otp`, data);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  loginWithGoogle(credential: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/google`, { credential });
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, data);
  }

  logout() {
    localStorage.removeItem('auth_token');
  }
}
