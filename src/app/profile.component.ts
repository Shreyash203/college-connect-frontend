import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService, ProfileCreate } from './profile.service';
import { AuthService } from './auth.service';
import { CurrentUserService } from './current-user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styles: []
})


export class ProfileComponent implements OnInit {
  selectedFile: File | null = null;
  imageUrl: string | null = null;
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private currentUser = inject(CurrentUserService);
  private router = inject(Router);

  profileForm = new FormGroup({
    display_name: new FormControl('', [Validators.required]),
    department: new FormControl(''),
    year: new FormControl(''),
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
        this.imageUrl = profile.image_url || null;
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
      // Show a local preview instantly
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.isSaving = true;
    
    if (this.selectedFile) {
      this.profileService.uploadProfileImage(this.selectedFile).subscribe({
        next: (resp) => {
          this.submitProfile(resp.url);
        },
        error: (err) => {
          this.message = err.error?.detail || 'Failed to upload image.';
          this.isSaving = false;
        },
      });
      return;
    }
    this.submitProfile();
  }

  private submitProfile(imageUrl?: string) {
    const vals = this.profileForm.value;
    const profile: ProfileCreate = {
      display_name: vals.display_name!,
      department: vals.department || '',
      year: vals.year || '',
      bio: vals.bio || '',
      interests: (vals.interests || '').split(',').map((i: string) => i.trim()).filter(Boolean),
      image_url: imageUrl,
    };
    const apiCall = this.isEdit
      ? this.profileService.updateProfile(profile)
      : this.profileService.createProfile(profile);
    apiCall.subscribe({
      next: (resp) => {
        this.message = this.isEdit ? 'Profile updated successfully.' : 'Profile created successfully.';
        if (resp && resp.image_url) {
          this.imageUrl = resp.image_url;
        }
        this.isSaving = false;
      },
      error: (err) => {
        this.message = err.error?.detail || 'Failed to save profile.'; 
        this.isSaving = false;
      },
    });
  }

  logout() {
    this.authService.logout();
    this.currentUser.setLoggedIn(false);
    this.router.navigate(['/']);
  }
}
