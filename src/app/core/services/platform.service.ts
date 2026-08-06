import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly platformId = inject(PLATFORM_ID);

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  get isServer(): boolean {
    return isPlatformServer(this.platformId);
  }

  runInBrowser(fn: () => void): void {
    if (this.isBrowser) {
      fn();
    }
  }

  getWindow(): Window | null {
    return this.isBrowser ? window : null;
  }

  getDocument(): Document | null {
    return this.isBrowser ? document : null;
  }
}
