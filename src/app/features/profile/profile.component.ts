import { TokenStore } from '../../core/services/token-store.service';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProfileService, ProfileCreate } from './services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import imageCompression from 'browser-image-compression';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './profile.component.html',
  styles: []
})
export class ProfileComponent implements OnInit {
  selectedFile: File | null = null;
  imageUrl: string | null = null;

  // Multi-photo vibe support
  vibePhoto1: string | null = null;
  vibePhoto2: string | null = null;
  selectedVibe1File: File | null = null;
  selectedVibe2File: File | null = null;

  // Campus Prompts
  availablePrompts: string[] = [
    '📍 Favorite Campus Spot',
    '☕ Looking for someone to...',
    '🎸 Secret Talent or Vibe',
    '🍕 Hot take on college mess / canteen',
    '⚡ Best way to spend a Friday evening',
    '📚 Procrastination habit during exams',
    '🎧 Song on repeat right now'
  ];
  prompt1Question: string = '📍 Favorite Campus Spot';
  prompt1Answer: string = '';
  prompt2Question: string = '☕ Looking for someone to...';
  prompt2Answer: string = '';

  userEmail: string = '';
  private tokens = inject(TokenStore);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private currentUser = inject(CurrentUserService);
  private router = inject(Router);

  profileForm = new FormGroup({
    display_name: new FormControl('', [Validators.required]),
    department: new FormControl(''),
    year: new FormControl('', [Validators.required]),
    bio: new FormControl(''),
    interests: new FormControl('')
  });

  message = '';
  isEdit = false;
  isSaving = false;

  ngOnInit() {
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.isEdit = true;
        this.profileForm.patchValue({
          display_name: profile.display_name || '',
          department: profile.department || '',
          year: profile.year || '',
          bio: profile.bio || '',
          interests: profile.interests?.join(', ') || ''
        });
        if (profile.email) {
          this.userEmail = profile.email;
        }
        this.imageUrl = profile.image_url || null;

        // Load existing vibe photos
        if (profile.vibe_photos && profile.vibe_photos.length > 0) {
          this.vibePhoto1 = profile.vibe_photos[0] || null;
          this.vibePhoto2 = profile.vibe_photos[1] || null;
        }

        // Load existing prompts
        if (profile.prompts && profile.prompts.length > 0) {
          if (profile.prompts[0]) {
            this.prompt1Question = profile.prompts[0].question || this.availablePrompts[0];
            this.prompt1Answer = profile.prompts[0].answer || '';
          }
          if (profile.prompts[1]) {
            this.prompt2Question = profile.prompts[1].question || this.availablePrompts[1];
            this.prompt2Answer = profile.prompts[1].answer || '';
          }
        }

        this.message = 'Loaded existing profile. You can edit and save.';
      },
      error: () => {
        this.isEdit = false;
      },
    });
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      this.selectedFile = target.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onVibeFileSelected(event: Event, slot: 1 | 2) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      const file = target.files[0];
      if (slot === 1) {
        this.selectedVibe1File = file;
      } else {
        this.selectedVibe2File = file;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (slot === 1) {
          this.vibePhoto1 = e.target.result;
        } else {
          this.vibePhoto2 = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeVibePhoto(slot: 1 | 2) {
    if (slot === 1) {
      this.selectedVibe1File = null;
      this.vibePhoto1 = null;
    } else {
      this.selectedVibe2File = null;
      this.vibePhoto2 = null;
    }
  }

  private async compressImage(file: File): Promise<File> {
    try {
      const options = {
        maxSizeMB: 1.0,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.9
      };
      const compressedBlob = await imageCompression(file, options);
      return new File([compressedBlob], file.name, {
        type: compressedBlob.type,
        lastModified: Date.now()
      });
    } catch (error) {
      console.warn('Image compression skipped, uploading original.', error);
      return file;
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) return;
    this.isSaving = true;
    this.message = '';

    try {
      // 1. Upload main avatar if new file chosen
      let finalAvatarUrl = this.imageUrl;
      if (this.selectedFile) {
        const compressed = await this.compressImage(this.selectedFile);
        const res = await firstValueFrom(this.profileService.uploadProfileImage(compressed));
        finalAvatarUrl = res.url;
      }

      // 2. Upload vibe photo 1 if new file chosen
      let finalVibe1Url = this.vibePhoto1;
      if (this.selectedVibe1File) {
        const compressed = await this.compressImage(this.selectedVibe1File);
        const res = await firstValueFrom(this.profileService.uploadProfileImage(compressed));
        finalVibe1Url = res.url;
      }

      // 3. Upload vibe photo 2 if new file chosen
      let finalVibe2Url = this.vibePhoto2;
      if (this.selectedVibe2File) {
        const compressed = await this.compressImage(this.selectedVibe2File);
        const res = await firstValueFrom(this.profileService.uploadProfileImage(compressed));
        finalVibe2Url = res.url;
      }

      // Collect vibe photos (ignoring transient data URLs)
      const vibePhotos: string[] = [];
      if (finalVibe1Url && finalVibe1Url.startsWith('http')) {
        vibePhotos.push(finalVibe1Url);
      }
      if (finalVibe2Url && finalVibe2Url.startsWith('http')) {
        vibePhotos.push(finalVibe2Url);
      }

      // Collect prompts
      const prompts: { question: string; answer: string }[] = [];
      if (this.prompt1Answer && this.prompt1Answer.trim()) {
        prompts.push({
          question: this.prompt1Question,
          answer: this.prompt1Answer.trim()
        });
      }
      if (this.prompt2Answer && this.prompt2Answer.trim()) {
        prompts.push({
          question: this.prompt2Question,
          answer: this.prompt2Answer.trim()
        });
      }

      const vals = this.profileForm.value;
      const profile: ProfileCreate = {
        display_name: vals.display_name!,
        department: vals.department || '',
        year: vals.year || '',
        bio: vals.bio || '',
        interests: (vals.interests || '').split(',').map((i: string) => i.trim()).filter(Boolean),
        image_url: finalAvatarUrl?.startsWith('http') ? finalAvatarUrl : undefined,
        vibe_photos: vibePhotos,
        prompts: prompts,
      };

      const apiCall = this.isEdit
        ? this.profileService.updateProfile(profile)
        : this.profileService.createProfile(profile);

      const resp = await firstValueFrom(apiCall);
      this.message = this.isEdit ? 'Profile updated successfully.' : 'Profile created successfully.';
      if (resp && resp.image_url) {
        this.imageUrl = resp.image_url;
      }
      this.selectedFile = null;
      this.selectedVibe1File = null;
      this.selectedVibe2File = null;
    } catch (err: any) {
      console.error('Failed to save profile', err);
      this.message = err?.error?.detail || err?.message || 'Failed to save profile.';
    } finally {
      this.isSaving = false;
    }
  }

  logout() {
    this.authService.logout();
    this.currentUser.setLoggedIn(false);
    this.router.navigate(['/']);
  }

  deleteAccount() {
    if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently erase all your data.')) {
      this.isSaving = true;
      this.authService.deleteAccount().subscribe({
        next: () => {
          this.isSaving = false;
          void this.tokens.clear().catch(() => console.error('Unable to clear secure session'));
          this.currentUser.setLoggedIn(false);
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.isSaving = false;
          this.message = err.error?.detail || 'Failed to delete account.';
        }
      });
    }
  }
}
