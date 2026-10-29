import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { 
  IntercollegeService, 
  ConfessionRead, 
  StudentAppRead,
  CampusEventRead,
  CampusEventCreate
} from './services/intercollege.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl:'./feed.component.html',
  styles: []
})
export class FeedComponent implements OnInit {
  private intercollegeService = inject(IntercollegeService);
  private route = inject(ActivatedRoute);

  // Deep link from a notification (?confession=<id>&scope=<global|college>)
  private pendingConfessionId: number | null = null;
  highlightedConfessionId: number | null = null;

  activeTab: 'confessions' | 'events' | 'launchpad' = 'confessions';
  confessionScope: 'global' | 'college' = 'global';

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

  // Campus Events State
  eventScope: 'college' | 'global' = 'college';
  events: CampusEventRead[] = [];
  eventsSkip = 0;
  isLoadingEvents = false;
  isPostingEvent = false;
  showEventForm = false;
  eventMessage = '';
  eventMessageType: 'success' | 'error' = 'success';
  private rsvpTimeouts: { [key: number]: any } = {};

  eventForm = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    description: new FormControl('', [Validators.required, Validators.maxLength(1500)]),
    event_date: new FormControl('', [Validators.required]),
    venue: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    category: new FormControl('Workshop', [Validators.required]),
    scope: new FormControl<'college' | 'global'>('college', [Validators.required])
  });

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
    const params = this.route.snapshot.queryParamMap;
    const confessionId = Number(params.get('confession'));
    if (confessionId > 0) {
      this.pendingConfessionId = confessionId;
      if (params.get('scope') === 'college') this.confessionScope = 'college';
    }
    this.loadConfessions();
    this.loadApps();
    this.loadEvents();
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
    this.intercollegeService.getConfessions(this.confessionsSkip, this.limit, this.confessionScope).subscribe({
      next: (data) => {
        const formatted = data.map(c => ({ ...c, created_at: c.created_at.endsWith('Z') ? c.created_at : c.created_at + 'Z' }));
        this.confessions = append
          ? [...this.confessions, ...formatted.filter(f => !this.confessions.some(e => e.id === f.id))]
          : formatted;
        this.isLoadingConfessions = false;
        this.focusPendingConfession();
      },
      error: (err) => {
        console.error(err);
        this.isLoadingConfessions = false;
      }
    });
  }

  /** Scroll to + highlight the confession a notification pointed at. */
  private focusPendingConfession() {
    const id = this.pendingConfessionId;
    if (id === null) return;
    this.pendingConfessionId = null;

    if (this.confessions.some(c => c.id === id)) {
      this.highlightConfession(id);
      return;
    }

    // Not on the first page: fetch just that one and show it at the top
    this.intercollegeService.getConfession(id).subscribe({
      next: (c) => {
        const formatted = { ...c, created_at: c.created_at.endsWith('Z') ? c.created_at : c.created_at + 'Z' };
        this.confessions = [formatted, ...this.confessions];
        this.highlightConfession(id);
      },
      error: () => {
        this.confessionMessage = 'That confession is no longer available (confessions disappear after 48 hours).';
        this.confessionMessageType = 'error';
        setTimeout(() => this.confessionMessage = '', 6000);
      }
    });
  }

  private highlightConfession(id: number) {
    this.highlightedConfessionId = id;
    setTimeout(() => {
      document.getElementById('confession-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => this.highlightedConfessionId = null, 4000);
  }

  switchScope(scope: 'global' | 'college') {
    if (this.confessionScope === scope) return;
    this.confessionScope = scope;
    this.confessionsSkip = 0;
    this.confessions = [];
    this.loadConfessions();
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
    this.intercollegeService.createConfession({ 
      content: this.confessionForm.value.content!,
      scope: this.confessionScope
    }).subscribe({
      next: (res) => {
        let updatedRes = { ...res, created_at: res.created_at.endsWith('Z') ? res.created_at : res.created_at + 'Z' };
        this.confessions.unshift(updatedRes);
        this.confessionForm.reset();
        this.confessionMessage = this.confessionScope === 'college' 
          ? 'Posted anonymously to your college only!' 
          : 'Confession posted anonymously to all campuses!';
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

  loadEvents(append = false) {
    this.isLoadingEvents = true;
    this.intercollegeService.getEvents(this.eventsSkip, this.limit, this.eventScope).subscribe({
      next: (data) => {
        this.events = append
          ? [...this.events, ...data.filter(d => !this.events.some(e => e.id === d.id))]
          : data;
        this.isLoadingEvents = false;
      },
      error: (err) => {
        console.error('Failed to load campus events', err);
        this.isLoadingEvents = false;
      }
    });
  }

  switchEventScope(scope: 'college' | 'global') {
    this.eventScope = scope;
    this.eventsSkip = 0;
    this.loadEvents(false);
  }

  postEvent() {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    const val = this.eventForm.value;
    const newEvent: CampusEventCreate = {
      title: (val.title || '').trim(),
      description: (val.description || '').trim(),
      event_date: new Date(val.event_date || '').toISOString(),
      venue: (val.venue || '').trim(),
      category: val.category || 'General',
      scope: val.scope || 'college'
    };

    this.isPostingEvent = true;
    this.eventMessage = '';
    this.intercollegeService.createEvent(newEvent).subscribe({
      next: (res) => {
        this.events.unshift(res);
        this.eventForm.reset({
          category: 'Workshop',
          scope: 'college'
        });
        this.showEventForm = false;
        this.isPostingEvent = false;
        this.eventMessage = 'Event posted successfully! 📅';
        this.eventMessageType = 'success';
        setTimeout(() => this.eventMessage = '', 4000);
      },
      error: (err) => {
        this.eventMessage = this.extractErrorMessage(err, 'Failed to post event.');
        this.eventMessageType = 'error';
        this.isPostingEvent = false;
      }
    });
  }

  toggleEventRsvp(e: CampusEventRead) {
    e.has_rsvped = !e.has_rsvped;
    e.rsvp_count += e.has_rsvped ? 1 : -1;

    if (this.rsvpTimeouts[e.id]) {
      clearTimeout(this.rsvpTimeouts[e.id]);
    }

    this.rsvpTimeouts[e.id] = setTimeout(() => {
      this.intercollegeService.toggleEventRsvp(e.id).subscribe({
        next: (res) => {
          e.has_rsvped = res.rsvped;
          e.rsvp_count = res.rsvp_count;
          delete this.rsvpTimeouts[e.id];
        },
        error: (err) => {
          e.has_rsvped = !e.has_rsvped;
          e.rsvp_count += e.has_rsvped ? 1 : -1;
          delete this.rsvpTimeouts[e.id];
          console.error('Failed to RSVP', err);
        }
      });
    }, 500);
  }

  deleteEvent(id: number) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    this.intercollegeService.deleteEvent(id).subscribe({
      next: () => {
        this.events = this.events.filter(item => item.id !== id);
      },
      error: (err) => {
        this.eventMessage = this.extractErrorMessage(err, 'Failed to delete event.');
        this.eventMessageType = 'error';
      }
    });
  }

  formatEventDate(dateStr: string): { month: string, day: string, time: string, weekday: string } {
    try {
      const d = new Date(dateStr);
      return {
        month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        day: d.getDate().toString().padStart(2, '0'),
        time: d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        weekday: d.toLocaleString('en-US', { weekday: 'short' })
      };
    } catch {
      return { month: 'DATE', day: '--', time: '', weekday: '' };
    }
  }

}
