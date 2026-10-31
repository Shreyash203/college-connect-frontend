import { Capacitor } from '@capacitor/core';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ProfileService, ProfileRead } from './services/profile.service';
import { ChatService } from '../../core/services/chat.service';

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
  private route = inject(ActivatedRoute);
  public profiles: ProfileRead[] = [];
  skip = 0;
  limit = 20;
  errorMessage = '';
  isLoading = false;
  selectedCategory: string | null = null;
  categoryTitle: string = '';
  myYear: string = 'Your Batch';
  selectedProfileForView: ProfileRead | null = null;
  copiedToast = false;

  openFullProfile(profile: ProfileRead) {
    this.selectedProfileForView = profile;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { profile: profile.id },
      queryParamsHandling: 'merge'
    });
  }

  closeFullProfile() {
    this.selectedProfileForView = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { profile: null },
      queryParamsHandling: 'merge'
    });
  }

  copyProfileLink(profileId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const shareUrl = `${Capacitor.isNativePlatform() ? 'https://college-connect.azurecontainerapps.io' : window.location.origin}/discover?profile=${profileId}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.copiedToast = true;
        setTimeout(() => {
          this.copiedToast = false;
        }, 2500);
      }).catch(() => {
        this.fallbackCopy(shareUrl);
      });
    } else {
      this.fallbackCopy(shareUrl);
    }
  }

  private fallbackCopy(text: string) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    this.copiedToast = true;
    setTimeout(() => {
      this.copiedToast = false;
    }, 2500);
  }

  ngOnInit() {
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        if (profile.year) {
          this.myYear = profile.year;
        }
      },
      error: () => {}
    });

    // Deep-linking & Browser Back/Forward navigation support
    this.route.queryParams.subscribe(params => {
      const profileParam = params['profile'];
      if (profileParam) {
        const id = Number(profileParam);
        const existing = this.profiles.find(p => p.id === id);
        if (existing) {
          this.selectedProfileForView = existing;
        } else {
          this.profileService.getProfileById(id).subscribe({
            next: (profile) => {
              this.selectedProfileForView = profile;
            },
            error: () => {
              this.closeFullProfile();
            }
          });
        }
      } else {
        this.selectedProfileForView = null;
      }
    });
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

    this.errorMessage = "";
    this.isLoading = true;
    this.profileService.getProfiles(this.skip, this.limit, this.selectedCategory).subscribe({
      next: (data) => {
        this.profiles = append ? [...this.profiles, ...data] : data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Cannot load profiles. Check your connection and try again.';
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
        this.router.navigate(['/messages'], { queryParams: { conversationId: conv.id } });
      },
      error: (err) => {
        console.error('Error starting conversation', err);
      }
    });
  }
}

