import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private readonly apiUrl = 'http://localhost:8000/api';

  createProfile(profile: ProfileCreate): Observable<ProfileRead> {
    return this.http.post<ProfileRead>(`${this.apiUrl}/profiles`, profile);
  }

  getProfiles(): Observable<ProfileRead[]> {
    return this.http.get<ProfileRead[]>(`${this.apiUrl}/profiles`);
  }
}
