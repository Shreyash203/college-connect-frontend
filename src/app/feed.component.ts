import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { 
  IntercollegeService, 
  ConfessionRead, 
  StudentAppRead
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

  activeTab: 'confessions' | 'launchpad' = 'confessions';

  // State
  confessions: ConfessionRead[] = [];
  studentApps: any[] = [];
  
  // Debounce timers for likes to prevent DB spam
  private likeTimeouts: { [key: number]: any } = {};
  
  confessionMessage = '';
  confessionMessageType: 'success' | 'error' = 'success';
  
  appMessage = '';
  appMessageType: 'success' | 'error' = 'success';

  // Pagination State
  confessionsSkip = 0;
  appsSkip = 0;
  limit = 5;

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

  loadConfessions(append = false) {
    this.isLoadingConfessions = true;
    this.intercollegeService.getConfessions(this.confessionsSkip, this.limit).subscribe({
      next: (data) => {
        const formatted = data.map(c => ({ ...c, created_at: c.created_at.endsWith('Z') ? c.created_at : c.created_at + 'Z' }));
        this.confessions = append ? [...this.confessions, ...formatted] : formatted;
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
          let updatedApp = { ...app, created_at: app.created_at.endsWith('Z') ? app.created_at : app.created_at + 'Z' };
          if (updatedApp.app_url && !updatedApp.app_url.startsWith('http')) {
            updatedApp.app_url = 'https://' + updatedApp.app_url;
          }
          return updatedApp;
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

  postConfession() {
    if (this.confessionForm.invalid) return;
    this.isPostingConfession = true;
    this.confessionMessage = '';
    this.intercollegeService.createConfession({ content: this.confessionForm.value.content! }).subscribe({
      next: (res) => {
        let updatedRes = { ...res, created_at: res.created_at.endsWith('Z') ? res.created_at : res.created_at + 'Z' };
        this.confessions.unshift(updatedRes);
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
        let updatedRes = { ...res, created_at: res.created_at.endsWith('Z') ? res.created_at : res.created_at + 'Z' };
        this.studentApps.unshift(updatedRes);
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

  toggleLike(c: any) {
    if (!c.likes_count) c.likes_count = 0;
    
    // Optimistic UI update instantly for perfect UX
    c.has_liked = !c.has_liked;
    c.likes_count += c.has_liked ? 1 : -1;
    
    // Clear any existing pending request for this specific post
    if (this.likeTimeouts[c.id]) {
      clearTimeout(this.likeTimeouts[c.id]);
    }
    
    // Debounce: Wait 500ms after the user stops clicking before hitting the DB
    this.likeTimeouts[c.id] = setTimeout(() => {
      this.intercollegeService.likeConfession(c.id).subscribe({
        next: (res) => {
          // Sync with truth silently
          c.has_liked = res.liked;
          c.likes_count = res.likes_count;
          delete this.likeTimeouts[c.id];
        },
        error: (err) => {
          // Revert on error
          c.has_liked = !c.has_liked;
          c.likes_count += c.has_liked ? 1 : -1;
          delete this.likeTimeouts[c.id];
          console.error('Failed to like confession', err);
        }
      });
    }, 500);
  }
}
