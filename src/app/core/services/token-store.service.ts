import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  private token: string | null = null;
  private native = Capacitor.isNativePlatform();
  private revision = 0;
  private writes = Promise.resolve();
  get(): string | null { return this.native ? this.token : localStorage.getItem('auth_token'); }
  async initialize(): Promise<void> {
    if (!this.native) return;
    // Never fall back to unencrypted storage on a native device.
    try {
      const value = await SecureStorage.get('auth_token');
      this.token = typeof value === 'string' ? value : null;
    } catch { this.token = null; console.error('Secure session unavailable; please sign in again.'); }
    localStorage.removeItem('auth_token');
  }
  set(token: string): Promise<void> {
    if (!this.native) { localStorage.setItem('auth_token', token); return Promise.resolve(); }
    const revision = ++this.revision;
    return this.writes = this.writes.catch(() => {}).then(async () => {
      await SecureStorage.set('auth_token', token);
      if (revision !== this.revision) throw new Error('Session changed');
      this.token = token;
    });
  }
  clear(): Promise<void> {
    this.revision++;
    this.token = null;
    localStorage.removeItem('auth_token');
    if (!this.native) return Promise.resolve();
    return this.writes = this.writes.catch(() => {}).then(async () => { await SecureStorage.remove('auth_token'); });
  }
}
