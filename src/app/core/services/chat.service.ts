import { TokenStore } from './token-store.service';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../api.config';

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
  private tokens = inject(TokenStore);
  private http = inject(HttpClient);
  private ws: WebSocket | null = null;

  private apiUrl = API_BASE_URL;
  private wsUrl = this.apiUrl.replace('http', 'ws').replace('https', 'wss');

  private messageSubject = new BehaviorSubject<ChatMessage | null>(null);
  public newMessage$ = this.messageSubject.asObservable();

  private isIntentionalClose = false;
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

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
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = this.tokens.get();
    if (!token) return;

    this.isIntentionalClose = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      this.ws = new WebSocket(`${this.wsUrl}/ws/chat?token=${token}`);
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.error('Chat WS Error:', data.error);
          return;
        }
        this.messageSubject.next(data as ChatMessage);
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    this.ws.onclose = (event) => {
      this.ws = null;

      // Do NOT reconnect if user navigated away or intentionally disconnected
      if (this.isIntentionalClose) {
        return;
      }

      // If closed due to unauthorized token (code 1008 or 4001), stop retrying
      if (event.code === 1008 || event.code === 4001) {
        console.warn('Chat WebSocket closed due to unauthorized token. Stopping reconnect.');
        return;
      }

      // Stop retrying if user is logged out
      if (!this.tokens.get()) {
        return;
      }

      // Exponential backoff reconnect with maximum retry limit
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(3000 * Math.pow(1.5, this.reconnectAttempts - 1), 20000);
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
      } else {
        console.warn('Max chat reconnect attempts reached.');
      }
    };

    this.ws.onerror = (err) => {
      console.warn('Chat WebSocket encounter error:', err);
    };
  }

  sendMessage(conversationId: number, targetUserId: number, content: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not open');
      return false;
    }

    if (content.length > 1000) {
      content = content.substring(0, 1000);
    }

    const payload = {
      conversation_id: conversationId,
      target_user_id: targetUserId,
      content: content
    };

    this.ws.send(JSON.stringify(payload));
    return true;
  }

  disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
