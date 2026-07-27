import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { 
  IntercollegeService, 
  ConfessionRead, 
  StudentAppRead,
  NotificationRead
} from './intercollege.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './feed.component.html',
  styles: []
})
export class FeedComponent implements OnInit {
  private intercollegeService = inject(IntercollegeService);

  activeTab: 'notifications' | 'confessions' | 'launchpad' = 'notifications';

  // State
  notifications: NotificationRead[] = [];
  confessions: ConfessionRead[] = [];
  studentApps: StudentAppRead[] = [];
  message = '';

  // Pagination State
  notificationsSkip = 0;
  confessionsSkip = 0;
  appsSkip = 0;
  limit = 5;

  isLoadingNotifications = true;
  isLoadingConfessions = true;
  isLoadingApps = true;
  isPostingConfession = false;
  isPostingApp = false;

  // Reactive Forms
  confessionForm = new FormGroup({
    content: new FormControl('', [Validators.required, Validators.maxLength(500)])
  });

  appForm = new FormGroup({
    app_name: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    app_url: new FormControl('', [Validators.pattern('https?://.+')])
  });

  ngOnInit() {
    this.loadNotifications();
    this.loadConfessions();
    this.loadApps();
  }

  get unreadCount() {
    return this.notifications.filter(n => !n.is_read).length;
  }

  loadNotifications(append = false) {
    this.isLoadingNotifications = true;
    this.intercollegeService.getNotifications(this.notificationsSkip, this.limit).subscribe({
      next: (data) => {
        this.notifications = append ? [...this.notifications, ...data] : data;
        this.isLoadingNotifications = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingNotifications = false;
      }
    });
  }
  
  loadMoreNotifications() {
    this.notificationsSkip += this.limit;
    this.loadNotifications(true);
  }

  loadConfessions(append = false) {
    this.isLoadingConfessions = true;
    this.intercollegeService.getConfessions(this.confessionsSkip, this.limit).subscribe({
      next: (data) => {
        this.confessions = append ? [...this.confessions, ...data] : data;
        this.isLoadingConfessions = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingConfessions = false;
      }
    });
  }
  
  loadMoreConfessions() {
    this.confessionsSkip += this.limit;
    this.loadConfessions(true);
  }

  loadApps(append = false) {
    this.isLoadingApps = true;
    this.intercollegeService.getApps(this.appsSkip, this.limit).subscribe({
      next: (data) => {
        const formatted = data.map(app => {
          if (app.app_url && !app.app_url.startsWith('http')) {
            app.app_url = 'https://' + app.app_url;
          }
          return app;
        });
        this.studentApps = append ? [...this.studentApps, ...formatted] : formatted;
        this.isLoadingApps = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingApps = false;
      }
    });
  }
  
  loadMoreApps() {
    this.appsSkip += this.limit;
    this.loadApps(true);
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

  postConfession() {
    if (this.confessionForm.invalid) return;
    this.isPostingConfession = true;
    this.intercollegeService.createConfession({ content: this.confessionForm.value.content! }).subscribe({
      next: (res) => {
        this.confessions.unshift(res);
        this.confessionForm.reset();
        this.message = 'Confession posted completely anonymously!';
        this.isPostingConfession = false;
        setTimeout(() => this.message = '', 3000);
      },
      error: (err) => {
        this.message = 'Failed to post confession.';
        this.isPostingConfession = false;
        setTimeout(() => this.message = '', 3000);
      }
    });
  }

  postApp() {
    if (this.appForm.invalid) return;
    this.isPostingApp = true;
    let url = this.appForm.value.app_url;
    if (url && !url.startsWith('http')) {
      url = 'https://' + url;
    }
    const newApp = {
      app_name: this.appForm.value.app_name!,
      description: this.appForm.value.description!,
      app_url: url ? url : undefined
    };
    this.intercollegeService.createApp(newApp).subscribe({
      next: (res) => {
        this.studentApps.unshift(res);
        this.appForm.reset();
        this.message = 'App launched to the student network!';
        this.isPostingApp = false;
        setTimeout(() => this.message = '', 3000);
      },
      error: (err) => {
        this.message = 'Failed to post app.';
        this.isPostingApp = false;
        setTimeout(() => this.message = '', 3000);
      }
    });
  }
}
