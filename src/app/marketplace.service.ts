import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    form.append('file', file);
    return this.http.post<MarketplaceItem>(`${this.apiUrl}/marketplace/items`, form);
  }

  getItems(): Observable<MarketplaceItem[]> {
    return this.http.get<MarketplaceItem[]>(`${this.apiUrl}/marketplace/items`);
  }
}
