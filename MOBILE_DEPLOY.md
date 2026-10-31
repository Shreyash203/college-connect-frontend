# College Connect mobile deployment

The `mobile-deploy` branch contains the Angular application and its Capacitor 8 Android and iOS projects. The backend stays on its existing shared `dev` branch, including the access/session fixes. Native apps use the existing hosted HTTPS backend.

## Included

- Android and iOS projects, icons, launch screens, and camera/photo permission descriptions.
- Native encrypted access-token storage, startup initialization, refresh handling, logout cleanup, camera/library upload selection, safe-area layouts, keyboard handling, and Android back-button behavior.
- Android Credential Manager Google sign-in plugin. Configure its Android OAuth registration for the installed package ID and signing certificate. iOS Google sign-in is not implemented; email/password and OTP flows remain available there.
- Native HTTP transport through CapacitorHttp for Angular XMLHttpRequest/fetch requests. Refresh credentials remain in native HTTP cookies; they are not copied into JavaScript/localStorage. This transport needs real-device cookie persistence and binary-upload validation.
- A mobile-only build index without remote font or Google web scripts at startup; native screens use the system sans-serif fallback.
- Configuration checks, local Android commands, and GitHub Actions builds for Android debug APK, unsigned release AAB, and unsigned iOS Simulator app.
- Signing material, device-local SDK paths, build outputs, and IDE state excluded from Git.

## Requirements

Use Node 22.12+ or Node 24 and `npm ci`. Android uses Java 21, Android SDK platform/build tools 36, and the checked-in Gradle wrapper. iOS requires macOS and Xcode 26+; its dependencies use Swift Package Manager. The iOS CI job uses a macOS 26 runner.

Official references: [Capacitor environment setup](https://capacitorjs.com/docs/getting-started/environment-setup), [native HTTP configuration](https://capacitorjs.com/docs/apis/http), and [GitHub macOS 26 image](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-Readme.md).

## Local commands

Run from the frontend repository:

```sh
npm ci
npm run mobile:check
npm run mobile:sync
npm run android:debug
npm run android:open
```

On macOS:

```sh
npm run mobile:sync
npm run ios:open
```

Select an iOS Simulator in Xcode for unsigned testing. Physical-device and App Store builds require your Apple signing team and provisioning configuration.

For a signed Android bundle, copy `android/keystore.properties.example` to `android/keystore.properties` and fill in your own private upload key information. Select an owned production application ID first, then run:

```sh
npm run android:release
```

The release command blocks the preview application ID and missing signing configuration. CI deliberately produces an unsigned release bundle for compile validation; it is not a Play-upload-ready artifact. Debug APKs are for testing. Simulator apps cannot be installed on physical iPhones or submitted to the App Store.

## Backend configuration

Deploy the shared backend access/session changes before installing clients that use the new profile-by-user route. The new `auth_sessions` table is created by existing backend startup schema initialization; the database account must be allowed to create it. Existing sessions require sign-in again. All active replicas must run the revocation-aware backend.

Keep the web origin plus both native origins in backend CORS:

```text
https://localhost
capacitor://localhost
```

Add any missing native origins to the shared backend deployment configuration. Verify the deployed configuration and Azure Blob upload CORS separately, especially when using WebView networking. No Azure configuration is changed merely by creating this branch.

## Branch and CI behavior

Only the frontend uses `mobile-deploy`. The shared backend remains on `dev`; no backend mobile branch is needed. Frontend mobile code is committed locally on this branch. No branch has been pushed automatically.

The frontend Azure `deploy-dev.yml` workflow on this branch is restricted to pushes to `dev`, so pushing mobile work does not automatically replace the web deployment. Explicit manual workflow dispatch remains available. The frontend `mobile-build.yml` builds both platforms on pushes/PRs to `mobile-deploy`, and supports manual runs. It builds artifacts and does not publish to either store.

## Before store submission

1. Replace `dev.collegeconnect.preview` with your owned identifier in `capacitor.config.ts`, Android `applicationId`, and iOS `PRODUCT_BUNDLE_IDENTIFIER`. Android's Java namespace may remain separate. Re-sync, increment app/build versions, and register the actual signing certificates with Google OAuth.
2. Configure Apple signing and Android upload signing privately. Never commit keystores, passwords, provisioning files, or service credentials.
3. Test Android and iPhone sign-in, OTP, refresh after access-token expiry, app restart, logout, password reset, profile links, chat reconnect, image uploads, permission denial, keyboard, and back navigation against staging. Confirm cross-college requests are rejected. Re-run after any native configuration change.
4. Implement iOS Google sign-in if required for the release. Configure owned-domain App/Universal Links if deep linking from outside the app is required; none are invented for a domain you have not confirmed.
5. Complete privacy policy, store disclosures, screenshots, support contact, and moderation/reporting/blocking flows appropriate to this social app. Verify full account deletion; the separately reported event-owner deletion issue remains outside the requested access/session fixes.

## Validation for this branch

The security patch previously passed 36 selected backend tests and Angular template/type checks. Current build/sync results are recorded in the chat handoff. GitHub native jobs have not run until the branch is pushed or manually dispatched. Existing `MOBILE_VALIDATION.md` describes an earlier migration run and is historical, not proof of current native or device testing.
