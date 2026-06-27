import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, ProfileCreate } from './profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Profile</p>
        <h2 class="text-3xl font-semibold text-slate-900">Build Your Profile</h2>
      </div>
      <form (ngSubmit)="saveProfile()" class="flex flex-col gap-4">
        <label class="text-sm font-medium text-slate-700">Display Name</label>
        <input type="text" [(ngModel)]="display_name" name="display_name" required class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500" />
        <label class="text-sm font-medium text-slate-700">Department</label>
        <input type="text" [(ngModel)]="department" name="department" class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500" />
        <label class="text-sm font-medium text-slate-700">Year</label>
        <input type="text" [(ngModel)]="year" name="year" class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500" />
        <label class="text-sm font-medium text-slate-700">Bio</label>
        <textarea [(ngModel)]="bio" name="bio" rows="4" class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500"></textarea>
        <label class="text-sm font-medium text-slate-700">Interests (comma separated)</label>
        <input type="text" [(ngModel)]="interests" name="interests" class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500" />
        <button type="submit" class="mt-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700">Save Profile</button>
      </form>
      <div *ngIf="message" class="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ message }}</div>
    </div>
  `,
  styles: []
})
export class ProfileComponent {
  private profileService = inject(ProfileService);

  display_name = '';
  department = '';
  year = '';
  bio = '';
  interests = '';
  message = '';

  saveProfile() {
    const profile: ProfileCreate = {
      display_name: this.display_name,
      department: this.department,
      year: this.year,
      bio: this.bio,
      interests: this.interests.split(',').map((i) => i.trim()).filter(Boolean),
    };

    this.profileService.createProfile(profile).subscribe({
      next: () => {
        this.message = 'Profile created successfully.';
      },
      error: (err) => {
        this.message = err.error?.detail || 'Failed to save profile.';
      },
    });
  }
}
