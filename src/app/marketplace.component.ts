import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from './profile.service';
import { MarketplaceService, MarketplaceItem } from './marketplace.service';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, NgIf, FormsModule],
  template: `
    <div class="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-semibold">Marketplace</h2>
        <button (click)="goBack()" class="rounded bg-slate-200 px-3 py-1 text-sm hover:bg-slate-300">← Back</button>
      </div>

      <!-- Create new marketplace item -->
      <form (ngSubmit)="uploadImage()" class="flex flex-col gap-4">
        <label class="text-sm font-medium text-slate-700">Title</label>
        <input type="text" [(ngModel)]="title" name="title" required class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500" />
        <label class="text-sm font-medium text-slate-700">Description</label>
        <textarea [(ngModel)]="description" name="description" rows="3" class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"></textarea>
        <label class="block text-sm font-medium text-slate-700 mb-1">Image</label>
        <input type="file" (change)="onFileSelected($event)" class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-emerald-600 file:text-white hover:file:bg-emerald-700" />
        <button type="submit" class="mt-2 w-full rounded bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700">Create Listing</button>
      </form>

      <hr class="my-6" />

      <!-- List existing marketplace items -->
      <div *ngIf="items.length; else noItems">
        <div *ngFor="let item of items" class="mb-6 border-b pb-4">
          <h3 class="text-xl font-medium text-slate-800">{{ item.title }}</h3>
          <p class="text-sm text-slate-600" *ngIf="item.description">{{ item.description }}</p>
          <img *ngIf="item.image_url" [src]="item.image_url" class="mt-2 max-w-xs rounded shadow" />
        </div>
      </div>
      <ng-template #noItems>
        <p class="text-gray-600 text-center">No marketplace items yet.</p>
      </ng-template>
    </div>
  `,
  styles: []
})
export class MarketplaceComponent {
  private location = inject(Location);
  private profileService = inject(ProfileService);
  private marketplaceService = inject(MarketplaceService);
  goBack() { this.location.back(); }

  selectedFile: File | null = null;
  marketImageUrl: string | null = null;
  title = '';
  description = '';
  items: MarketplaceItem[] = [];

  ngOnInit() {
    this.loadItems();
  }

  private loadItems() {
    this.marketplaceService.getItems().subscribe({
      next: (data) => (this.items = data),
      error: (err) => console.error('Failed to load marketplace items', err),
    });
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      this.selectedFile = target.files[0];
    }
  }

  uploadImage() {
    if (!this.selectedFile) {
      return;
    }
    if (!this.title) {
      alert('Please provide a title for the item.');
      return;
    }
    this.marketplaceService.createItem(this.title, this.description, this.selectedFile).subscribe({
      next: (item) => {
        // Refresh list and clear form
        this.items.unshift(item);
        this.title = '';
        this.description = '';
        this.selectedFile = null;
        this.marketImageUrl = null;
      },
      error: (err) => {
        console.error('Marketplace upload failed', err);
      },
    });
  }

}
