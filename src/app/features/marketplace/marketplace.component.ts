import { NativeShell } from '../../core/services/native-shell.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, HostListener } from '@angular/core';
import type { Photo } from '@capacitor/camera';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MarketplaceService, MarketplaceItem } from './services/marketplace.service';
import { ChatService } from '../../core/services/chat.service';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import imageCompression from 'browser-image-compression';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './marketplace.component.html',
  styles: []
})
export class MarketplaceComponent {
  private marketplaceService = inject(MarketplaceService);
  private chatService = inject(ChatService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Deep link from a notification (?item=<id>)
  private pendingItemId: number | null = null;
  highlightedItemId: number | null = null;
  private nativeShell = inject(NativeShell);
  private destroyRef = inject(DestroyRef);
  @HostListener('window:native-back', ['$event'])
  closeFormOnBack(event: Event) {
    if (this.showPostForm) { this.showPostForm = false; event.preventDefault(); }
  }
  private async usePhoto(photo: Photo) {
    if (!photo.webPath) return;
    const response = await fetch(photo.webPath);
    if (!response.ok) throw new Error('Cannot read photo');
    const blob = await response.blob();
    this.selectFile(new File([blob], `listing-${Date.now()}.${photo.format}`, { type: blob.type }));
  }
  native = Capacitor.isNativePlatform();
  selectedFile: File | null = null;
  async takePhoto() {
    try {
      const photo = await Camera.getPhoto({ resultType: CameraResultType.Uri, source: CameraSource.Prompt, quality: 90, saveToGallery: false });
      await this.usePhoto(photo);
    } catch (err: any) {
      if (!/cancel/i.test(err?.message || '')) this.errorMessage = 'Unable to open photos. Check camera/photo permissions or choose a file.';
    }
  }
  private selectFile(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'Choose a JPEG, PNG, or WebP image up to 10 MB.';
      return;
    }
    this.selectedFile = file;
    this.errorMessage = '';
  }
  retry() { this.loadItems(); }

  items: MarketplaceItem[] = [];
  skip = 0;
  limit = 20;
  isLoading = true;
  isUploading = false;
  showPostForm = false;

  // Real-time search & category filter
  searchQuery = '';
  selectedFilter: 'all' | 'selling' | 'wanted' = 'all';
  private searchDebounceTimer: any = null;

  // Debounce timers to prevent database spamming
  private interestTimeouts: { [key: number]: any } = {};
  errorMessage = '';
  successMessage = '';

  marketForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    description: new FormControl('', []),
    item_type: new FormControl<'selling' | 'wanted'>('selling', [Validators.required])
  });

  get filteredItems(): MarketplaceItem[] {
    return this.items.filter(item => {
      // 1. Type filter
      const isWanted = item.title.startsWith('[WANTED]');
      if (this.selectedFilter === 'selling' && isWanted) return false;
      if (this.selectedFilter === 'wanted' && !isWanted) return false;

      // 2. Search query filter
      if (!this.searchQuery || !this.searchQuery.trim()) return true;
      const q = this.searchQuery.toLowerCase().trim();
      const cleanTitle = isWanted ? item.title.substring(8).trim().toLowerCase() : item.title.toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      return cleanTitle.includes(q) || desc.includes(q) || email.includes(q);
    });
  }

  get forSaleCount(): number {
    return this.items.filter(i => !i.title.startsWith('[WANTED]')).length;
  }

  get wantedCount(): number {
    return this.items.filter(i => i.title.startsWith('[WANTED]')).length;
  }

  setFilter(filter: 'all' | 'selling' | 'wanted') {
    this.selectedFilter = filter;
  }

  onSearchChange() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    // Debounce backend query by 350ms to fetch any non-loaded matches from server
    this.searchDebounceTimer = setTimeout(() => {
      this.skip = 0;
      this.loadItems(false);
    }, 350);
  }

  clearSearch() {
    this.searchQuery = '';
    this.skip = 0;
    this.loadItems(false);
  }

  ngOnInit() {
    this.nativeShell.recoveredPhoto.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(photo => {
      this.showPostForm = true;
      void this.usePhoto(photo).catch(() => this.errorMessage = 'Could not restore your photo. Please choose it again.');
    });
    const itemId = Number(this.route.snapshot.queryParamMap.get('item'));
    if (itemId > 0) this.pendingItemId = itemId;
    this.loadItems();
  }

  extractErrorMessage(err: any, fallback: string): string {
    if (!err) return fallback;
    const detail = err.error?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => {
        if (typeof d === 'string') return d;
        const field = d.loc && d.loc.length > 0 ? d.loc[d.loc.length - 1] : '';
        return field ? `${field}: ${d.msg}` : d.msg;
      }).join(' | ');
    }
    if (err.error?.message) return err.error.message;
    if (err.message) return err.message;
    return fallback;
  }

  private loadItems(append = false) {
    this.errorMessage = '';
    this.isLoading = true;
    this.marketplaceService.getItems(this.skip, this.limit, this.searchQuery).subscribe({
      next: (data) => {
        this.items = append
          ? [...this.items, ...data.filter(d => !this.items.some(e => e.id === d.id))]
          : data;
        this.isLoading = false;
        this.focusPendingItem();
      },
      error: (err) => {
        this.errorMessage = err.status === 0 ? 'Cannot connect. Check your connection and try again.' : 'Could not load listings. Please try again.';
        this.isLoading = false;
      },
    });
  }

  /** Scroll to + highlight the listing a notification pointed at. */
  private focusPendingItem() {
    const id = this.pendingItemId;
    if (id === null) return;
    this.pendingItemId = null;

    if (this.items.some(i => i.id === id)) {
      this.highlightItem(id);
      return;
    }

    // Not on the first page: fetch just that one and show it at the top
    this.marketplaceService.getItem(id).subscribe({
      next: (item) => {
        this.items = [item, ...this.items];
        this.highlightItem(id);
      },
      error: () => {
        this.errorMessage = 'That listing is no longer available (listings expire after 14 days, or the seller removed it).';
        setTimeout(() => this.errorMessage = '', 6000);
      }
    });
  }

  private highlightItem(id: number) {
    this.highlightedItemId = id;
    setTimeout(() => {
      document.getElementById('item-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => this.highlightedItemId = null, 4000);
  }

  loadMoreItems() {
    this.skip += this.limit;
    this.loadItems(true);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      this.selectFile(target.files[0]);
    }
  }

  async uploadImage() {
    if (this.isUploading || !this.selectedFile || this.marketForm.invalid) {
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const rawTitle = this.marketForm.value.title!;
    const itemType = this.marketForm.value.item_type || 'selling';
    const title = itemType === 'wanted' ? `[WANTED] ${rawTitle}` : rawTitle;
    const desc = this.marketForm.value.description || '';

    let fileToUpload = this.selectedFile;

    try {
      const options = {
        maxSizeMB: 1.0, // High quality for launch
        maxWidthOrHeight: 1920, // Full HD resolution
        useWebWorker: true,
        initialQuality: 0.9
      };
      const compressedBlob = await imageCompression(this.selectedFile, options);
      // Convert Blob back to File
      fileToUpload = new File([compressedBlob], this.selectedFile.name, {
        type: compressedBlob.type,
        lastModified: Date.now()
      });
      console.log(`Original: ${(this.selectedFile.size/1024/1024).toFixed(2)} MB, Compressed: ${(fileToUpload.size/1024/1024).toFixed(2)} MB`);
    } catch (error) {
      console.error('Image compression failed. Uploading original.', error);
    }

    this.marketplaceService.createItem(title, desc, fileToUpload).subscribe({
      next: (item) => {
        this.items.unshift(item);
        this.marketForm.reset({ item_type: 'selling' });
        this.selectedFile = null;
        this.isUploading = false;
        this.showPostForm = false;
        this.successMessage = 'Listing created successfully!';
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err, 'Failed to create listing.');
        this.isUploading = false;
      },
    });
  }

  deleteItem(item: MarketplaceItem) {
    if (!confirm('Are you sure you want to delete this listing from Campus Bazaar?')) return;
    this.marketplaceService.deleteItem(item.id).subscribe({
      next: () => {
        this.items = this.items.filter(i => i.id !== item.id);
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err, 'Failed to delete listing.');
      }
    });
  }

  toggleInterest(item: MarketplaceItem) {
    // Optimistic update
    item.has_indicated_interest = !item.has_indicated_interest;
    item.interest_count = (item.interest_count || 0) + (item.has_indicated_interest ? 1 : -1);

    // Clear any existing pending request for this specific item
    if (this.interestTimeouts[item.id]) {
      clearTimeout(this.interestTimeouts[item.id]);
    }

    // Wait 500ms before sending to database
    this.interestTimeouts[item.id] = setTimeout(() => {
      this.marketplaceService.indicateInterest(item.id).subscribe({
        next: (res) => {
          item.has_indicated_interest = res.interested;
          item.interest_count = res.interest_count;
          delete this.interestTimeouts[item.id];
        },
        error: (err) => {
          // Revert on error
          item.has_indicated_interest = !item.has_indicated_interest;
          item.interest_count = (item.interest_count || 0) + (item.has_indicated_interest ? 1 : -1);
          delete this.interestTimeouts[item.id];
          console.error('Failed to indicate interest', err);
        }
      });
    }, 500);
  }

  messageSeller(userId: number) {
    if (!userId) return;
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
