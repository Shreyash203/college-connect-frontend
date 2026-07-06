import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-confessions',
  standalone: true,
  template: `
    <div class="p-8">
      <button (click)="goBack()" class="mb-4 rounded bg-slate-200 px-3 py-1 text-sm hover:bg-slate-300">← Back</button>
      <h2 class="text-2xl font-semibold mb-4">Confessions</h2>
      <p class="text-gray-700">Placeholder for anonymous confessions board.</p>
    </div>
  `,
  styles: []
})
export class ConfessionsComponent {
  private location = inject(Location);
  goBack() { this.location.back(); }
}
