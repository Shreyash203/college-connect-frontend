import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  templateUrl:'./feed.component.html',
  styles: []
})
export class FeedComponent implements OnInit {
  private intercollegeService = inject(IntercollegeService);

  activeTab: 'confessions' | 'launchpad' | 'notifications' = 'confessions';

  // State
  notifications: NotificationRead[] = [];
  confessions: ConfessionRead[] = [];
  studentApps: any[] = [];
  
  confessionMessage = '';
  confessionMessageType: 'success' | 'error' = 'success';
  
  appMessage = '';
  appMessageType: 'success' | 'error' = 'success';

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
    app_url: new FormControl('', [Validators.pattern('^(https?://)?[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)+.*$')])
  }); 

  ngOnInit() {
    this.loadNotifications();
    this.loadConfessions();
    this.loadApps();
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
    this.confessionMessage = '';
    this.intercollegeService.createConfession({ content: this.confessionForm.value.content! }).subscribe({
      next: (res) => {
        this.confessions.unshift(res);
        this.confessionForm.reset();
        this.confessionMessage = 'Confession posted completely anonymously!';
        this.confessionMessageType = 'success';
        this.isPostingConfession = false;
        setTimeout(() => this.confessionMessage = '', 4000);
      },
      error: (err) => {
        this.confessionMessage = this.extractErrorMessage(err, 'Failed to post confession.');
        this.confessionMessageType = 'error';
        this.isPostingConfession = false;
      }
    });
  }

  postApp() {
    if (this.appForm.invalid) return;
    this.isPostingApp = true;
    this.appMessage = '';
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
        this.appMessage = 'App launched to the student network!';
        this.appMessageType = 'success';
        this.isPostingApp = false;
        setTimeout(() => this.appMessage = '', 4000);
      },
      error: (err) => {
        this.appMessage = this.extractErrorMessage(err, 'Failed to post app.');
        this.appMessageType = 'error';
        this.isPostingApp = false;
      }
    });
  }

  deleteConfession(c: ConfessionRead) {
    if (!confirm('Are you sure you want to delete this confession?')) return;
    this.intercollegeService.deleteConfession(c.id).subscribe({
      next: () => {
        this.confessions = this.confessions.filter(item => item.id !== c.id);
      },
      error: (err) => {
        this.confessionMessage = this.extractErrorMessage(err, 'Failed to delete confession.');
        this.confessionMessageType = 'error';
      }
    });
  }

  deleteApp(app: any) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    this.intercollegeService.deleteApp(app.id).subscribe({
      next: () => {
        this.studentApps = this.studentApps.filter(item => item.id !== app.id);
      },
      error: (err) => {
        this.appMessage = this.extractErrorMessage(err, 'Failed to delete project.');
        this.appMessageType = 'error';
      }
    });
  }
}
