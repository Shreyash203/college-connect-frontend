import { Component } from '@angular/core';

@Component({
  selector: 'app-feed',
  standalone: true,
  template: `
    <div class="p-4 bg-gray-50 rounded-lg shadow-sm">
      <p class="text-sm font-medium text-slate-700">No notifications yet.</p>
      <!-- In a full implementation this would list marketplace posts, connection requests, and confessions -->
    </div>
  `,
  styles: []
})
export class FeedComponent {}

