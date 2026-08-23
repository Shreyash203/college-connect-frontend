import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MarketplaceService, MarketplaceItem } from './marketplace.service';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './marketplace.component.html',
  styles: []
})
export class MarketplaceComponent {
  private marketplaceService = inject(MarketplaceService);
  private chatService = inject(ChatService);
  private router = inject(Router);
  selectedFile: File | null = null;
  items: MarketplaceItem[] = [];
  skip = 0;
  limit = 20;
  isLoading = true;
  isUploading = false;
  
  // Debounce timers to prevent database spamming
  private interestTimeouts: { [key: number]: any } = {};
  errorMessage = '';
  successMessage = '';

  marketForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    description: new FormControl('', []),
    item_type: new FormControl<'selling' | 'wanted'>('selling', [Validators.required])
  });

  ngOnInit() {
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
    this.errorMessage = '';
    this.successMessage = '';
    const rawTitle = this.marketForm.value.title!;
    const itemType = this.marketForm.value.item_type || 'selling';
    const title = itemType === 'wanted' ? `[WANTED] ${rawTitle}` : rawTitle;
    const desc = this.marketForm.value.description || '';
    
    this.marketplaceService.createItem(title, desc, this.selectedFile).subscribe({
      next: (item) => {
        this.items.unshift(item);
        this.marketForm.reset({ item_type: 'selling' });
        this.selectedFile = null;
        this.isUploading = false;
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
