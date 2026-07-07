import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { ProfileService, ProfileRead } from './profile.service';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="p-8 bg-gray-50 rounded-lg">
      <button (click)="goBack()" class="mb-4 rounded bg-slate-200 px-3 py-1 text-sm hover:bg-slate-300">← Back</button>
      <h2 class="text-2xl font-semibold mb-6 text-slate-800">Discover Connections</h2>
      <div *ngIf="profiles.length; else noProfiles">
        <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div *ngFor="let p of profiles" class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 class="text-lg font-medium text-slate-900 mb-1">{{ p.display_name || 'Unnamed' }}</h3>
              <p class="text-sm text-slate-600"><strong>Dept:</strong> {{ p.department || 'N/A' }}</p>
              <p class="text-sm text-slate-600"><strong>Year:</strong> {{ p.year || 'N/A' }}</p>
              <p class="text-sm text-slate-600"><strong>Interests:</strong> {{ p.interests.join(', ') || 'None' }}</p>
              <img *ngIf="p.image_url" [src]="p.image_url" class="mt-2 max-w-xs rounded" />
            </div>
        </div>
      </div>
      <ng-template #noProfiles>
        <p class="text-gray-700">No profiles found.</p>
      </ng-template>
    </section>
  `,
  styles: []
})
export class DiscoverComponent implements OnInit {
  private profileService = inject(ProfileService);
  private location = inject(Location);
  public profiles: ProfileRead[] = [];

  ngOnInit() {
    this.profileService.getProfiles().subscribe({
      next: (data) => (this.profiles = data),
      error: () => (this.profiles = []),
    });
  }

  goBack() { this.location.back(); }
}

