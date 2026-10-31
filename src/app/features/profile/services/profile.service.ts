import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { API_BASE_URL } from '../../../core/api.config';

export interface ProfilePrompt {
  question: string;
  answer: string;
}

export interface ProfileCreate {
  image_url?: string;
  vibe_photos?: string[];
  prompts?: ProfilePrompt[];
  display_name?: string;
  department?: string;
  year?: string;
  bio?: string;
  interests: string[];
}

export interface ProfileRead {
  image_url?: string;
  vibe_photos?: string[];
  prompts?: ProfilePrompt[];
  id: number;
  user_id: number;
  email?: string;
  display_name?: string;
  department?: string;
  year?: string;
  bio?: string;
  interests: string[];
}

const MAX_PROFILE_IMAGE_SIZE = 10 * 1024 * 1024;

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

  getProfiles(skip: number = 0, limit: number = 20, category?: string): Observable<ProfileRead[]> {
    let url = `${this.apiUrl}/profiles?skip=${skip}&limit=${limit}`;
    if (category) {
      url += `&category=${category}`;
    }
    return this.http.get<ProfileRead[]>(url);
  }

  getMyProfile(): Observable<ProfileRead> {
    return this.http.get<ProfileRead>(`${this.apiUrl}/profiles/me`);
  }

  getProfileById(profileId: number): Observable<ProfileRead> {
    return this.http.get<ProfileRead>(`${this.apiUrl}/profiles/${profileId}`);
  }

  getProfileByUserId(userId: number): Observable<ProfileRead> {
    return this.http.get<ProfileRead>(`${this.apiUrl}/profiles/by-user/${userId}`);
  }

  uploadProfileImage(file: File): Observable<{url: string}> { 
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      return throwError(() => new Error('Profile images must be 10 MB or smaller.'));
    }

    return this.http.get<{upload_url: string; image_url: string}>(
      `${this.apiUrl}/profiles/me/upload-url`,
      { params: { filename: file.name } }
    ).pipe(
      switchMap(urls => {
        const headers = new HttpHeaders().set('x-ms-blob-type', 'BlockBlob');
        return this.http.put(urls.upload_url, file, { headers, responseType: 'text' }).pipe(
          switchMap(() => this.http.post<{image_url: string}>(
            `${this.apiUrl}/profiles/me/upload/verify`,
            { image_url: urls.image_url }
          )),
          map(response => ({ url: response.image_url }))
        );
      })
    );
  }
}
  
