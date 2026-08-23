import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProfileService, ProfileRead } from './profile.service';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discover.component.html',
  styles: []
})
export class DiscoverComponent implements OnInit {
  private profileService = inject(ProfileService);
  private chatService = inject(ChatService);
  private router = inject(Router);
  public profiles: ProfileRead[] = [];
  skip = 0;
  limit = 20;
  isLoading = false;
  selectedCategory: string | null = null;
  categoryTitle: string = '';

  ngOnInit() {
    // We don't load profiles immediately on the grid view
  }

  viewCategory(category: string, title: string) {
    this.selectedCategory = category;
    this.categoryTitle = title;
    this.skip = 0;
    this.profiles = [];
    this.loadProfiles();
  }

  goBack() {
    this.selectedCategory = null;
    this.categoryTitle = '';
    this.profiles = [];
  }

  loadProfiles(append = false) {
    if (!this.selectedCategory) return;
    
    this.isLoading = true;
    this.profileService.getProfiles(this.skip, this.limit, this.selectedCategory).subscribe({
      next: (data) => {
        this.profiles = append ? [...this.profiles, ...data] : data;
        this.isLoading = false;
      },
      error: () => {
        if (!append) this.profiles = [];
        this.isLoading = false;
      },
    });
  }

  loadMore() {
    this.skip += this.limit;
    this.loadProfiles(true);
  }

  messageUser(userId: number) {
    this.chatService.startConversation(userId).subscribe({
      next: (conv) => {
        this.router.navigate(['/messages']);
      },
      error: (err) => {
        console.error('Error starting conversation', err);
      }
    });
  }
}

