import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: number;
  user1_id: number;
  user2_id: number;
  other_user_id: number;
  other_user_name: string;
  other_user_image: string | null;
  last_message: string | null;
  unread_count: number;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private ws: WebSocket | null = null;
  
  private apiUrl = API_BASE_URL;
  private wsUrl = this.apiUrl.replace('http', 'ws').replace('https', 'wss');

  private messageSubject = new BehaviorSubject<ChatMessage | null>(null);
  public newMessage$ = this.messageSubject.asObservable();

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/chat/conversations`);
  }

  getMessages(conversationId: number, skip: number = 0, limit: number = 50): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/${conversationId}/messages?skip=${skip}&limit=${limit}`);
  }

  startConversation(targetUserId: number): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiUrl}/chat/start/${targetUserId}`, {});
  }

  connect() {
    if (this.ws) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    this.ws = new WebSocket(`${this.wsUrl}/ws/chat?token=${token}`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error('Chat WS Error:', data.error);
        return;
      }
      this.messageSubject.next(data as ChatMessage);
    };

    this.ws.onclose = () => {
      this.ws = null;
      setTimeout(() => this.connect(), 3000);
    };
  }

  sendMessage(conversationId: number, targetUserId: number, content: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not open');
      return;
    }
    
    if (content.length > 1000) {
      console.warn('Message exceeds 1000 characters. Slicing.');
      content = content.substring(0, 1000);
    }
    
    const payload = {
      conversation_id: conversationId,
      target_user_id: targetUserId,
      content: content
    };
    
    this.ws.send(JSON.stringify(payload));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
