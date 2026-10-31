import { ReplaySubject } from 'rxjs';
import { Router } from '@angular/router';
import type { Photo } from '@capacitor/camera';
import { Injectable, NgZone, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';

@Injectable({ providedIn: 'root' })
export class NativeShell {
  readonly recoveredPhoto = new ReplaySubject<Photo>(1);
  private router = inject(Router);
  private location = inject(Location);
  private zone = inject(NgZone);
  private started = false;
  async start() {
    if (!Capacitor.isNativePlatform() || this.started) return;
    this.started = true;
    await App.addListener('appRestoredResult', result => {
      if (result.pluginId === 'Camera' && result.success && result.data?.webPath) {
        this.zone.run(() => {
          this.recoveredPhoto.next(result.data as Photo);
          void this.router.navigate(['/marketplace']);
        });
      }
    });
    await App.addListener('backButton', ({ canGoBack }) => {
      this.zone.run(() => {
        // Components can consume the event to close an in-page dialog first.
        const event = new Event('native-back', { cancelable: true });
        if (!window.dispatchEvent(event)) return;
        if (canGoBack) this.location.back();
        else void App.minimizeApp();
      });
    });
    await Keyboard.addListener('keyboardWillShow', () => document.body.classList.add('keyboard-visible'));
    await Keyboard.addListener('keyboardWillHide', () => document.body.classList.remove('keyboard-visible'));
    await this.theme(document.documentElement.classList.contains('dark'));
  }
  async theme(dark: boolean) {
    if (Capacitor.isNativePlatform()) await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
  }
}
