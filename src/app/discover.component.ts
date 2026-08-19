import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService, ProfileRead } from './profile.service';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discover.component.html',
  styles: []
})
export class DiscoverComponent implements OnInit {
  private profileService = inject(ProfileService);
  public profiles: ProfileRead[] = [];
  skip = 0;
  limit = 20;
  isLoading = true;

  ngOnInit() {
    this.loadProfiles();
  }

  loadProfiles(append = false) {
    this.isLoading = true;
    this.profileService.getProfiles(this.skip, this.limit).subscribe({
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
}

