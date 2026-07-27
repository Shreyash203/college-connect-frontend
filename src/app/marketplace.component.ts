import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ProfileService } from './profile.service';
import { MarketplaceService, MarketplaceItem } from './marketplace.service';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './marketplace.component.html',
  styles: []
})
export class MarketplaceComponent {
  private profileService = inject(ProfileService);
  private marketplaceService = inject(MarketplaceService);
  selectedFile: File | null = null;
  marketImageUrl: string | null = null;
  items: MarketplaceItem[] = [];
  skip = 0;
  limit = 20;
  isLoading = true;
  isUploading = false;

  marketForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    description: new FormControl('', [])
  });

  ngOnInit() {
    this.loadItems();
  }

  private loadItems(append = false) {
    this.isLoading = true;
    this.marketplaceService.getItems(this.skip, this.limit).subscribe({
      next: (data) => {
        this.items = append ? [...this.items, ...data] : data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load marketplace items', err);
        this.isLoading = false;
      },
    });
  }

  loadMoreItems() {
    this.skip += this.limit;
    this.loadItems(true);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      this.selectedFile = target.files[0];
    }
  }

  uploadImage() {
    if (!this.selectedFile || this.marketForm.invalid) {
      return;
    }
    
    this.isUploading = true;
    const title = this.marketForm.value.title!;
    const desc = this.marketForm.value.description || '';
    
    this.marketplaceService.createItem(title, desc, this.selectedFile).subscribe({
      next: (item) => {
        this.items.unshift(item);
        this.marketForm.reset();
        this.selectedFile = null;
        this.marketImageUrl = null;
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Marketplace upload failed', err);
        this.isUploading = false;
      },
    });
  }
}
