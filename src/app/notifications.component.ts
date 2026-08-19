import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IntercollegeService, NotificationRead } from './intercollege.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styles: []
})
export class NotificationsComponent implements OnInit {
  private intercollegeService = inject(IntercollegeService);

  notifications: NotificationRead[] = [];
  notificationsSkip = 0;
  limit = 15;
  isLoading = true;

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications(append = false) {
    this.isLoading = true;
    this.intercollegeService.getNotifications(this.notificationsSkip, this.limit).subscribe({
      next: (data) => {
        this.notifications = append ? [...this.notifications, ...data] : data;
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
}
