# 🎓 College Connect — Frontend

**The Angular-powered client for College Connect, a privacy-first social platform for verified college students.**

Built with **Angular 21**, **Tailwind CSS**, and **RxJS** — deployed as a containerized SPA on Azure Container Apps.

> 🔗 **Live App:** [https://college-connect.azurecontainerapps.io](https://college-connect.azurecontainerapps.io)  
> 🔗 **Backend Repo:** [college-connect-backend](https://github.com/Shreyash203/college-connect-backend)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🔐 Authentication** | Email + OTP registration, Google OAuth 2.0 sign-in, forgot/reset password flows |
| **🤫 Confessions** | Anonymous posting with 🌐 Global / 🎓 My College scope toggle |
| **💬 Real-Time Chat** | WebSocket-powered direct messaging with live message delivery |
| **🛒 Marketplace** | List items with image upload, express interest in listings |
| **🔔 Notifications** | Bell icon with unread badge, auto-mark-as-read, Clear All button |
| **👤 Profiles** | Editable display name and profile picture |
| **🔍 Discover** | Browse verified students across campuses |
| **🚀 Launchpad** | Showcase student-built apps and side projects |
| **🌙 Dark Mode** | System-aware theme toggle with localStorage persistence |

---

## 🏗️ Architecture

```
src/app/
├── core/                           # Singleton services & cross-cutting concerns
│   ├── services/
│   │   ├── auth.service.ts         # Login, logout, token management
│   │   ├── chat.service.ts         # WebSocket connection management
│   │   └── current-user.service.ts # Reactive user state (BehaviorSubject)
│   ├── guards/
│   │   └── auth.guard.ts           # Route protection for unauthenticated users
│   ├── interceptors/
│   │   └── auth.interceptor.ts     # Auto-attach JWT + silent token refresh on 401
│   └── api.config.ts               # API base URL configuration
│
├── features/                       # Lazy-loaded feature modules
│   ├── authentication/             # Login, Register, OTP, Forgot/Reset Password
│   ├── feed/                       # Confessions + Launchpad with scope toggle
│   │   └── services/
│   │       └── intercollege.service.ts  # API calls for confessions, apps, notifications
│   ├── chat/                       # Real-time WebSocket messaging
│   ├── marketplace/                # Campus Bazaar with image uploads
│   ├── notifications/              # Notification center with Clear All
│   ├── profile/                    # User profile editing
│   └── home/                       # Landing page
│
├── app.ts                          # Root component — navbar, theme toggle, notification badge
├── app.html                        # Root template with header, router-outlet, footer
├── app.routes.ts                   # Route definitions
└── app.config.ts                   # Providers (HttpClient, Router, Interceptors)
```

---

## 🔧 Key Engineering Decisions

### 1. Standalone Components (No NgModules)
Every component uses Angular's modern `standalone: true` pattern. No `app.module.ts` — cleaner imports, better tree-shaking, faster builds.

### 2. Silent Token Refresh via HTTP Interceptor
When a JWT access token expires mid-session, the interceptor catches the `401` response, silently calls the backend's `/auth/refresh` endpoint using the HttpOnly cookie, gets a fresh token, and **retries the original request** — all invisible to the user.

### 3. Navigation-Based Notification Polling
Instead of polling the server every 30 seconds (which keeps Azure containers awake and burns free-tier credits), the app fetches the unread notification count only when the user **navigates to a new page**. This allows the backend container to scale to zero when idle, keeping hosting costs at ₹0.

### 4. Reactive State with RxJS
- `CurrentUserService` exposes a `BehaviorSubject<boolean>` for login state
- Components subscribe reactively — the navbar, notification badge, and route guards all respond instantly to auth state changes
- WebSocket messages are handled as observable streams

### 5. Dark Mode with Zero Flicker
Theme preference is saved in `localStorage` and applied in `ngOnInit()` before the first paint. The `[class.dark]` binding on the root `<main>` element cascades Tailwind's `dark:` variants across the entire app.

---

## 🎨 UI / UX Highlights

- **Glassmorphism header** with `backdrop-blur-xl` for a modern, premium feel
- **Skeleton loaders** on every data-fetching view (no blank screens while loading)
- **Responsive design** — fully functional on mobile, tablet, and desktop
- **Toast-style feedback messages** for post actions (success/error)
- **Pill-shaped scope toggle** for Global vs My College confessions
- **Hover-to-read** notification cards with unread blue dot indicators

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Angular | 21.2 | Component framework with signals, standalone components |
| Tailwind CSS | 3.4 | Utility-first CSS — zero custom CSS files needed |
| RxJS | 7.8 | Reactive programming for HTTP calls, WebSocket streams, state |
| TypeScript | 5.x | Type-safe development across all components and services |
| Docker | — | Containerized production build with multi-stage Dockerfile |
| Azure Container Apps | — | Serverless hosting with scale-to-zero |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Angular CLI (`npm install -g @angular/cli`)
- Backend server running ([see backend repo](https://github.com/Shreyash203/college-connect-backend))

### Development
```bash
# Install dependencies
npm install

# Start dev server (hot-reload)
ng serve
```

Open `http://localhost:4200` in your browser.

### Production Build
```bash
# Build optimized bundle
ng build

# Output is in dist/college-connect-frontend/
```

### Docker
```bash
# Build container
docker build -t college-connect-frontend .

# Run container
docker run -p 80:80 college-connect-frontend
```

---

## 🔌 Environment Configuration

The API base URL is configured in [`src/app/core/api.config.ts`](src/app/core/api.config.ts). Update this to point to your backend:

```typescript
// Local development
export const API_BASE_URL = 'http://localhost:8000/api';

// Production
export const API_BASE_URL = 'https://your-backend-url.azurecontainerapps.io/api';
```

---

## 📁 Feature Breakdown

### Authentication (`/login`, `/register`)
- Reactive forms with real-time validation
- OTP input with auto-focus progression
- Google OAuth with one-tap sign-in
- Forgot password → email OTP → reset flow

### Feed (`/feed`)
- Two top-level tabs: **Confessions** and **Launchpad**
- Scope toggle (🌐 Global / 🎓 My College) filters both posting and viewing
- Post button dynamically updates: "🌐 Post Globally" vs "🎓 Post to College"
- Like/unlike with optimistic UI updates

### Chat (`/chat`)
- Conversation list with last message preview and unread count
- Full-duplex WebSocket connection via `chat.service.ts`
- Messages rendered in real-time without page refresh

### Marketplace (`/marketplace`)
- Image upload with preview before submission
- Interest toggle (like a "Save" button)
- Owner actions: delete listing

### Notifications (`/notifications`)
- Auto-mark-all-as-read on page visit
- Clear All button permanently deletes from database
- UTC → local timezone conversion for accurate timestamps

---

## 🗺️ Roadmap

- [ ] Infinite scroll with Intersection Observer
- [ ] Client-side image compression before upload
- [ ] Typing indicators in chat
- [ ] PWA support for mobile install
- [ ] Accessibility (a11y) audit

---

<p align="center">
  <b>Built with ❤️ by <a href="https://github.com/Shreyash203">Shreyash Bhanage</a></b>
</p>
