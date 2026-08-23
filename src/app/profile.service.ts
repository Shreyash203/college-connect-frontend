import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';

export interface ProfileCreate {
  image_url?: string;
  display_name?: string;
  department?: string;
  year?: string;
  bio?: string;
  interests: string[];
}

export interface ProfileRead {
  image_url?: string;
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

  uploadProfileImage(file: File): Observable<{url: string}> { 
    return this.http.get<{ upload_url: string, image_url: string }>(
      `${this.apiUrl}/profiles/me/upload-url`,
      { params: { filename: file.name } }
    ).pipe(
      switchMap(urls => {
        const headers = new HttpHeaders().set('x-ms-blob-type', 'BlockBlob');
        return this.http.put(urls.upload_url, file, { headers, responseType: 'text' }).pipe(
          switchMap(() => {
            // We just return the image URL directly so the form can submit it with the profile creation.
            return of({ url: urls.image_url });
          })
        );
      })
    );
  }
}
  

