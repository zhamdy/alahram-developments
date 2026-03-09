import { inject } from '@angular/core';
import { PlatformService } from '../../core/services';

export class StorageHelper {
  private readonly platform = inject(PlatformService);

  getItem(key: string): string | null {
    if (!this.platform.isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    this.platform.runInBrowser(() => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Silent fail: localStorage unavailable (SSR, private browsing, quota exceeded)
      }
    });
  }

  removeItem(key: string): void {
    this.platform.runInBrowser(() => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Silent fail: localStorage unavailable (SSR, private browsing, quota exceeded)
      }
    });
  }

  getJson<T>(key: string): T | null {
    const item = this.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  setJson<T>(key: string, value: T): void {
    this.setItem(key, JSON.stringify(value));
  }
}
