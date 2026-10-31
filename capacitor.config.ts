import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // DEVELOPMENT identifier. Replace in both native projects before store registration.
  appId: 'dev.collegeconnect.preview',
  appName: 'College Connect',
  webDir: 'dist/college-connect/browser',
  server: { androidScheme: 'https', iosScheme: 'capacitor', cleartext: false },
  plugins: { CapacitorHttp: { enabled: true }, SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover' }, SplashScreen: { launchAutoHide: true }, Keyboard: { resizeOnFullScreen: true } }
};
export default config;
