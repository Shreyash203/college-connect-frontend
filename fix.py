import os

service_code = """import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common';
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
  private wsUrl = this.apiUrl.replace('http', 'ws');

  private messageSubject = new BehaviorSubject<ChatMessage | null>(null);
  public newMessage$ = this.messageSubject.asObservable();

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(${this.apiUrl}/chat/conversations);
  }

  getMessages(conversationId: number, skip: number = 0, limit: number = 50): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(${this.apiUrl}/chat//messages?skip=&limit=);
  }

  startConversation(targetUserId: number): Observable<Conversation> {
    return this.http.post<Conversation>(${this.apiUrl}/chat/start/, {});
  }

  connect() {
    if (this.ws) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    this.ws = new WebSocket(${this.wsUrl}/ws/chat?token=);

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
"""

component_ts_code = """import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService, Conversation, ChatMessage } from '../chat.service';
import { CurrentUserService } from '../current-user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private chatService = inject(ChatService);
  private currentUserService = inject(CurrentUserService);
  private router = inject(Router);

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  conversations: Conversation[] = [];
  activeConversation: Conversation | null = null;
  messages: ChatMessage[] = [];
  
  newMessageText = '';
  currentUserId: number | null = null;
  private msgSub: Subscription | null = null;
  private shouldScroll = false;

  ngOnInit() {
    this.currentUserId = this.currentUserService.currentUser()?.id || null;
    
    if (!this.currentUserId) {
      return;
    }

    this.loadSidebar();
    this.chatService.connect();

    this.msgSub = this.chatService.newMessage$.subscribe((msg) => {
      if (!msg) return;
      
      if (this.activeConversation && msg.conversation_id === this.activeConversation.id) {
        this.messages.push(msg);
        this.shouldScroll = true;
      }
      
      this.loadSidebar();
    });
  }

  ngOnDestroy() {
    if (this.msgSub) this.msgSub.unsubscribe();
    this.chatService.disconnect();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  loadSidebar() {
    this.chatService.getConversations().subscribe({
      next: (data) => {
        this.conversations = data;
      },
      error: (err) => console.error(err)
    });
  }

  openConversation(conv: Conversation) {
    this.activeConversation = conv;
    this.chatService.getMessages(conv.id).subscribe({
      next: (data) => {
        this.messages = data;
        this.shouldScroll = true;
        conv.unread_count = 0;
      },
      error: (err) => console.error(err)
    });
  }

  sendMessage() {
    if (!this.newMessageText.trim() || !this.activeConversation) return;
    
    this.chatService.sendMessage(
      this.activeConversation.id, 
      this.activeConversation.other_user_id, 
      this.newMessageText
    );
    
    this.newMessageText = '';
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}
"""

component_css_code = """.scrollable-messages::-webkit-scrollbar { width: 6px; }
.scrollable-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.dark .scrollable-messages::-webkit-scrollbar-thumb { background: #334155; }
"""

with open(r"C:\SHREYASH ACADEMICS\Shreyash Long Term Project\Frontend\college-connect-frontend\src\app\chat.service.ts", "w", encoding="utf-8") as f:
    f.write(service_code)

with open(r"C:\SHREYASH ACADEMICS\Shreyash Long Term Project\Frontend\college-connect-frontend\src\app\chat\chat.component.ts", "w", encoding="utf-8") as f:
    f.write(component_ts_code)

with open(r"C:\SHREYASH ACADEMICS\Shreyash Long Term Project\Frontend\college-connect-frontend\src\app\chat\chat.component.css", "w", encoding="utf-8") as f:
    f.write(component_css_code)

print("success")
