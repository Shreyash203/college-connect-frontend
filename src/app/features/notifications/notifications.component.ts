import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IntercollegeService, NotificationRead } from '../feed/services/intercollege.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styles: []
})
export class NotificationsComponent implements OnInit {
  private intercollegeService = inject(IntercollegeService);
  private router = inject(Router);

  notifications: NotificationRead[] = [];
  notificationsSkip = 0;
  limit = 15;
  isLoading = true;

  ngOnInit() {
    this.loadNotifications();
    this.markAllAsRead();
  }

  markAllAsRead() {
    this.intercollegeService.markAllAsRead().subscribe({
      next: () => {
        // Also update local state so they appear read immediately
        this.notifications.forEach(n => n.is_read = true);
      },
      error: (err) => console.error('Failed to mark all as read:', err)
    });
  }

  loadNotifications(append = false) {
    this.isLoading = true;
    this.intercollegeService.getNotifications(this.notificationsSkip, this.limit).subscribe({
      next: (data) => {
        // Fix UTC timing issue
        const formatted = data.map(n => ({ 
          ...n, 
          created_at: n.created_at.endsWith('Z') ? n.created_at : n.created_at + 'Z' 
        }));
        
        this.notifications = append ? [...this.notifications, ...formatted] : formatted;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }
  
  loadMoreNotifications() {
    this.notificationsSkip += this.limit;
    this.loadNotifications(true);
  }

  markAsRead(n: NotificationRead) {
    if (n.is_read) return;
    this.intercollegeService.markNotificationAsRead(n.id).subscribe({
      next: () => {
        n.is_read = true;
      },
      error: (err) => console.error(err)
    });
  }

  /** Navigate to whatever the notification is about. */
  open(n: NotificationRead) {
    this.markAsRead(n);
    const link = this.resolveLink(n);
    if (link) this.router.navigateByUrl(link);
  }

  /** Has a destination? Used to show the pointer cursor / arrow. */
  hasLink(n: NotificationRead): boolean {
    return !!this.resolveLink(n);
  }

  private resolveLink(n: NotificationRead): string | null {
    if (n.link) return n.link;
    // Notifications created before links existed: send to the right page at least
    const msg = n.message.toLowerCase();
    if (msg.includes('new message')) return '/messages';
    if (msg.includes('confession')) return '/feed';
    if (msg.includes('listing')) return '/marketplace';
    return null;
  }

  clearAll() {
    this.intercollegeService.clearAllNotifications().subscribe({
      next: () => {
        this.notifications = [];
        this.notificationsSkip = 0;
      },
      error: (err) => console.error('Failed to clear notifications:', err)
    });
  }
}
