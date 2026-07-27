import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';

export interface MarketplaceItem {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
}

@Injectable({ providedIn: 'root' })
export class MarketplaceService {
  private http = inject(HttpClient);
  private readonly apiUrl = API_BASE_URL;

  createItem(title: string, description: string, file: File): Observable<MarketplaceItem> {
    return this.http.get<{ upload_url: string, image_url: string }>(
      `${this.apiUrl}/marketplace/items/upload-url`,
      { params: { filename: file.name } }
    ).pipe(
      switchMap(urls => {
        const headers = new HttpHeaders().set('x-ms-blob-type', 'BlockBlob');
        return this.http.put(urls.upload_url, file, { headers, responseType: 'text' }).pipe(
          switchMap(() => {
            return this.http.post<MarketplaceItem>(`${this.apiUrl}/marketplace/items`, {
              title,
              description,
              image_url: urls.image_url
            });
          })
        );
      })
    );
  }

  getItems(skip: number = 0, limit: number = 5): Observable<MarketplaceItem[]> {
    return this.http.get<MarketplaceItem[]>(`${this.apiUrl}/marketplace/items?skip=${skip}&limit=${limit}`);
  }
}
