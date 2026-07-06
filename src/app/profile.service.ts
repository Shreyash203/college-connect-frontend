import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface ProfileCreate {
  display_name?: string;
  department?: string;
  year?: string;
  bio?: string;
  interests: string[];
}

export interface ProfileRead {
  id: number;
  user_id: number;
  display_name?: string;
  department?: string;
  year?: string;
  bio?: string;
  interests: string[];
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private readonly apiUrl = API_BASE_URL;

  createProfile(profile: ProfileCreate): Observable<ProfileRead> {
    return this.http.post<ProfileRead>(`${this.apiUrl}/profiles`, profile);
  }

  updateProfile(profile: ProfileCreate): Observable<ProfileRead> {
    return this.http.put<ProfileRead>(`${this.apiUrl}/profiles/me`, profile);
  }

  getProfiles(): Observable<ProfileRead[]> {
    return this.http.get<ProfileRead[]>(`${this.apiUrl}/profiles`);
  }

  getMyProfile(): Observable<ProfileRead> {
    return this.http.get<ProfileRead>(`${this.apiUrl}/profiles/me`);
  }
}
