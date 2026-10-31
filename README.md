# 🎓 College Connect — Frontend

For Android and iOS build commands, signing, and release prerequisites, see [MOBILE_DEPLOY.md](MOBILE_DEPLOY.md).

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

## Mobile apps (Capacitor 8)

The existing standalone Angular application powers the website, Android, and iOS. No Ionic UI framework or new backend is required. The inspected project declares Angular 21.2.17 (not Angular 20), TypeScript 5.9, RxJS 7.8, and Tailwind 3. Existing functionality includes campus/global confessions, events, launchpad posts, discovery, profile editing, chat, notifications, email/OTP/password recovery, account deletion, and marketplace sales/wanted listings.

### Tools and setup

- Node 22.12+ in the Node 22 line, or Node 24; npm and the committed package-lock.json. Capacitor 8 requires Node 22+. See [Angular compatibility](https://angular.dev/reference/versions) and [Capacitor setup](https://capacitorjs.com/docs/getting-started/environment-setup).
- Android: Android Studio, JDK 21, SDK platform 36, appropriate build tools, and a device/emulator. Generated minSdk is 24 and target/compile SDK are 36. Set JAVA_HOME to a complete JDK and ANDROID_HOME to your SDK.
- iOS: a Mac with Xcode 26+, Apple signing configuration, and a device/simulator. The generated project uses Swift Package Manager. Windows can generate/sync sources, but cannot build/sign/run iOS.

```sh
npm ci
npm start                         # existing website development
npm run build                     # existing production web build
npm run test:ci                    # Karma/Jasmine, requires installed Chrome
npm run mobile:sync               # production build, then sync BOTH native platforms
npm run android:open              # Android Studio
npm run android:run               # rebuild, sync, run Android
npm run ios:open                  # Xcode (Mac only)
npm run ios:run                   # rebuild, sync, run iOS (Mac only)
```

Angular emits `dist/college-connect/browser`; capacitor.config.ts uses that exact webDir. Never sync an old build after changing Angular code. Commit native source projects and the npm lockfile; copied web assets and local SDK settings are ignored. On Windows build Android directly after sync:

```powershell
cd android
.\gradlew.bat assembleDebug
# Only after release signing is configured locally:
.\gradlew.bat bundleRelease
```

On macOS/Linux use `./gradlew`. Debug APK output is `android/app/build/outputs/apk/debug/app-debug.apk`. Release bundles are under `android/app/build/outputs/bundle/release`. Do not publish a debug build.

### Identifiers and branding

`dev.collegeconnect.preview` is a DEVELOPMENT placeholder, not an approved production identity. Before registering a store app, choose an identifier you own and update capacitor.config.ts, Android namespace/applicationId/Java package directory and MainActivity package, Android string resources, and iOS PRODUCT_BUNDLE_IDENTIFIER. Changing capacitor.config.ts alone does not rename existing native projects. Review display name/versionCode/versionName and iOS marketing/build versions. Launcher and splash assets reuse the existing blue/slate College Connect mark; review crops on devices before release.

### API configuration and authentication

`src/app/core/api.config.ts` remains the single source of API URLs. Web development on localhost/127.0.0.1 uses the existing `http://localhost:8000/api`; other web hosts and ALL native builds use the existing HTTPS Azure API endpoint. Capacitor's `https://localhost` / `capacitor://localhost` origin is an app origin, not your development backend. Never use a physical device's localhost to reach your computer. For a development API, use an explicitly configured HTTPS endpoint reachable from the device and rebuild/sync. Do not enable cleartext or disable certificate verification for release.

Native access tokens use `@aparajita/capacitor-secure-storage` (Android Keystore encryption / iOS Keychain). Startup loads the token before routing, native localStorage tokens are removed, and storage failures never fall back to plaintext. The web retains its existing token storage behavior. Theme preferences stay in localStorage. Refresh tokens remain in the backend's existing Secure/HttpOnly/SameSite=None cookies, never copied into JavaScript. Login/registration wait for secure persistence before navigating. Logout clears local state and closes chat even when the logout request fails; server-side revocation still requires connectivity. Refresh is shared across concurrent 401s and rejects all waiters on failure; temporary refresh connectivity errors preserve the session for retry. Authorization headers are scoped strictly to the configured API, including retries; signed Blob requests receive no JWT.

Native email/password, OTP, and password reset use existing endpoints. The Google GIS popup integration is retained for the website and hidden on native because embedded WebViews require a dedicated native/external-browser OAuth flow. Native Google sign-in remains follow-up work; do not treat it as validated. Public profile sharing on native uses the existing live web URL recorded in this README; verify that public URL before release. Universal/App Links and native password-reset link routing are not yet configured.

### Backend/storage review needed (no backend or infrastructure changes made)

The available backend was inspected read-only. It already issues Secure, HttpOnly, SameSite=None refresh cookies and uses configured CORS origins. Verify the existing deployment allows exact native origins `https://localhost` (Android) and `capacitor://localhost` (iOS), with credentials enabled. Keep existing website origins. Verify Azure Blob CORS permits native origins, signed PUT upload headers/methods, and image reads. Do not use wildcard credentialed CORS. Test login, cold-start token recovery, refresh rotation, parallel expiry, logout, and account deletion on both platforms. WebView cross-site cookie policies, especially WKWebView on iOS, can prevent refresh cookies from surviving requests/restarts; the current cookie contract is preserved but is a release blocker until tested. If a platform blocks it, coordinate an explicitly designed native refresh/session contract with the backend; do not expose refresh cookies or invent endpoints.

Existing camera/gallery files feed the same compression -> signed Azure PUT -> listing creation flow. Files are limited to JPEG/PNG/WebP and 10 MB before compression. Android uses the system camera and photo picker without broad media permissions (`saveToGallery` is false). iOS camera/library usage strings are supplied. Camera permission denial/cancellation is handled, and Android activity-restored photo results reopen the listing form. Unsaved listing text is not persisted across process death. Do not assume upload success until verified against the real deployment. No push backend has been introduced.

### Mobile UX and manual validation

Small screens get bottom navigation, 44px form/button targets, safe-area padding, keyboard-aware navigation, dynamic viewport chat height, and reduced-motion support. Existing responsive layouts/desktop breakpoints remain. Listings have a detail route and visible loading/error/retry states. Confessions/events/launchpad and discovery show load failures. Android back closes listing/profile/chat views before navigating back, and minimizes at the root. Check these behaviors on devices; automated builds cannot validate their visual quality.

Before release, test at 320/360/390px and desktop, light/dark themes, notches/gesture navigation, landscape, large fonts, keyboard open/close, offline/reconnect, camera/library permission denial, cancellation, Android process death, upload failures/retry, pagination, chat reconnect, all login/OTP/reset flows, expired sessions, and account deletion. Check dialog focus/back handling and screen-reader names. Native plugins do not provide a full offline marketplace; APIs still require connectivity.

### Publishing preparation and limitations

No deployment, publishing, Git commit, or push was performed. A generated/synced project is not a production-ready signed application. Complete Android compile/device validation first, then iOS on a Mac. Resolve native cookie refresh and Google OAuth limitations, select final identifiers, inspect branded icons/splashes, configure release signing without committing keystores, and create a signed Android App Bundle. Prepare store screenshots, privacy policy, Data Safety disclosures, account deletion information, permissions explanations, content moderation/reporting/blocking for social features, and an internal testing track. Confirm current store requirements in your consoles at submission time. Apple distribution also requires the appropriate Apple developer enrollment/signing. Push notifications remain a later phase.

See `MOBILE_VALIDATION.md` for this migration's actual checks and remaining blockers.
