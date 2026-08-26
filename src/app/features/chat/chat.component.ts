import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ChatService, Conversation, ChatMessage } from '../../core/services/chat.service';
import { ProfileService } from '../profile/services/profile.service';
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
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  conversations: Conversation[] = [];
  activeConversation: Conversation | null = null;
  messages: ChatMessage[] = [];
  
  newMessageText = '';
  currentUserId: number | null = null;
  private msgSub: Subscription | null = null;
  private shouldScroll = false;

  ngOnInit() {
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.currentUserId = profile.user_id;
        this.loadSidebar();
        this.chatService.connect();
      },
      error: () => console.error("Could not fetch profile for chat")
    });

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
      next: (data: Conversation[]) => {
        this.conversations = data;
        
        // Auto-open conversation if passed via query params
        const autoConvId = this.route.snapshot.queryParamMap.get('conversationId');
        if (autoConvId && !this.activeConversation) {
          const convToOpen = this.conversations.find(c => c.id.toString() === autoConvId);
          if (convToOpen) {
            this.openConversation(convToOpen);
          }
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  openConversation(conv: Conversation) {
    this.activeConversation = conv;
    this.chatService.getMessages(conv.id).subscribe({
      next: (data: ChatMessage[]) => {
        this.messages = data;
        this.shouldScroll = true;
        conv.unread_count = 0;
      },
      error: (err: any) => console.error(err)
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

  goBack() {
    this.location.back();
  }

  closeConversation() {
    this.activeConversation = null;
    this.messages = [];
  }
}
