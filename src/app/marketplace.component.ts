import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  template: `
    <div class="p-8">
      <button (click)="goBack()" class="mb-4 rounded bg-slate-200 px-3 py-1 text-sm hover:bg-slate-300">← Back</button>
      <h2 class="text-2xl font-semibold mb-4">Marketplace</h2>
      <p class="text-gray-700">This is a placeholder for the Buy/Sell/Request marketplace.</p>
    </div>
  `,
  styles: []
})
export class MarketplaceComponent {
  private location = inject(Location);
  goBack() { this.location.back(); }
}
