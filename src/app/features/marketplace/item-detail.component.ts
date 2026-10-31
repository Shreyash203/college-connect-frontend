import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MarketplaceService, MarketplaceItem } from './services/marketplace.service';
import { ChatService } from '../../core/services/chat.service';
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a routerLink="/marketplace" class="inline-block py-3 text-blue-600">Back to Bazaar</a>
    <p *ngIf="loading" role="status">Loading listing…</p>
    <div *ngIf="error" role="alert"><p>{{ error }}</p><button (click)="load()" class="px-4 py-3 underline">Try again</button></div>
    <article *ngIf="item as listing" class="grid md:grid-cols-2 gap-6">
      <img *ngIf="listing.image_url" [src]="listing.image_url" [alt]="listing.title" class="w-full rounded-2xl object-contain max-h-[60dvh]" />
      <div><h2 class="text-2xl font-bold break-words">{{ listing.title }}</h2>
        <p class="mt-4 whitespace-pre-wrap break-words">{{ listing.description }}</p>
        <p class="my-4 break-all text-sm text-slate-500">{{ listing.email }}</p>
        <button *ngIf="listing.user_id && !listing.is_mine" (click)="message(listing.user_id!)" [disabled]="messaging" class="px-6 py-3 rounded-xl bg-blue-600 text-white">Message Seller</button>
        <p *ngIf="messageError" role="alert">{{ messageError }}</p>
      </div>
    </article>`
})
export class ItemDetailComponent {
  private api = inject(MarketplaceService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chat = inject(ChatService);
  item?: MarketplaceItem;
  loading = false;
  messaging = false;
  error = '';
  messageError = '';
  ngOnInit() { this.load(); }
  load() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.error = ''; this.loading = true;
    if (!Number.isInteger(id) || id <= 0) { this.error = 'Invalid listing.'; this.loading = false; return; }
    this.api.getItem(id).subscribe({
      next: item => { this.item = item; this.loading = false; },
      error: err => { this.loading = false; this.error = err.status === 404 ? 'This listing is no longer available.' : 'Cannot load listing. Check your connection and try again.'; }
    });
  }
  message(id: number) {
    this.messaging = true; this.messageError = '';
    this.chat.startConversation(id).subscribe({
      next: c => { this.messaging = false; this.router.navigate(['/messages'], { queryParams: { conversationId: c.id } }); },
      error: () => { this.messaging = false; this.messageError = 'Cannot start conversation. Please try again.'; }
    });
  }
}
