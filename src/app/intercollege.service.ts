import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface ConfessionRead {
  id: number;
  college_domain: string;
  content: string;
  created_at: string;
  is_mine: boolean;
}

export interface ConfessionCreate {
  content: string;
}

export interface StudentAppRead {
  id: number;
  app_name: string;
  description: string;
  app_url?: string;
  college_domain: string;
  created_at: string;
  user_id: number;
  is_mine: boolean;
  [key: string]: any;
}

export interface StudentAppCreate {
  app_name: string;
  description: string;
  app_url?: string;
}

export interface NotificationRead {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class IntercollegeService {
  private http = inject(HttpClient);
  private confessionsUrl = `${API_BASE_URL}/confessions`;
  private launchpadUrl = `${API_BASE_URL}/launchpad`;

  // --- Confessions ---
  getConfessions(skip: number = 0, limit: number = 20): Observable<ConfessionRead[]> {
    return this.http.get<ConfessionRead[]>(`${this.confessionsUrl}/?skip=${skip}&limit=${limit}`);
  }

  createConfession(data: ConfessionCreate): Observable<ConfessionRead> {
    return this.http.post<ConfessionRead>(`${this.confessionsUrl}/`, data);
  }

  deleteConfession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.confessionsUrl}/${id}`);
  }

  // --- Launchpad ---
  getApps(skip: number = 0, limit: number = 20): Observable<StudentAppRead[]> {
    return this.http.get<StudentAppRead[]>(`${this.launchpadUrl}/?skip=${skip}&limit=${limit}`);
  }

  createApp(data: StudentAppCreate): Observable<StudentAppRead> {
    return this.http.post<StudentAppRead>(`${this.launchpadUrl}/`, data);
  }

  deleteApp(id: number): Observable<void> {
    return this.http.delete<void>(`${this.launchpadUrl}/${id}`);
  }

  // --- Notifications ---
  getNotifications(skip: number = 0, limit: number = 20): Observable<NotificationRead[]> {
    return this.http.get<NotificationRead[]>(`${API_BASE_URL}/notifications/?skip=${skip}&limit=${limit}`);
  }

  markNotificationAsRead(id: number): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${API_BASE_URL}/notifications/${id}/read`, {});
  }
}
