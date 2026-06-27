import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProfileService, ProfileRead } from './profile.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto flex max-w-5xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="flex flex-col gap-2">
        <p class="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Discover</p>
        <h2 class="text-3xl font-semibold text-slate-900">Student Discovery Feed</h2>
        <p class="text-slate-600">Browse student profiles with matching interests and connect with your campus community.</p>
      </div>

      <div *ngIf="profiles.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-slate-500">
        No profiles available yet.
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div *ngFor="let profile of profiles" class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 class="text-lg font-semibold text-slate-900">{{ profile.display_name || 'Unnamed student' }}</h3>
          <p class="mt-2 text-sm text-slate-600"><span class="font-medium text-slate-800">Department:</span> {{ profile.department || 'N/A' }}</p>
          <p class="text-sm text-slate-600"><span class="font-medium text-slate-800">Year:</span> {{ profile.year || 'N/A' }}</p>
          <p class="mt-3 text-sm text-slate-700">{{ profile.bio || 'No bio yet.' }}</p>
          <p class="mt-3 text-sm text-slate-600"><span class="font-medium text-slate-800">Interests:</span> {{ profile.interests.join(', ') || 'None' }}</p>
        </div>
      </div>

      <a class="w-fit rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" routerLink="/profile">Edit My Profile</a>
    </div>
  `,
  styles: []
})
export class FeedComponent implements OnInit {
  private profileService = inject(ProfileService);
  profiles: ProfileRead[] = [];

  ngOnInit() {
    this.profileService.getProfiles().subscribe({
      next: (data) => (this.profiles = data),
      error: () => (this.profiles = []),
    });
  }
}
