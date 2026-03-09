import { Injectable, inject, signal, computed } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';
import { PlatformService } from './platform.service';

export type AppLocale = 'ar' | 'en';
export type AppDirection = 'rtl' | 'ltr';

const LOCALE_STORAGE_KEY = 'ahram-locale';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly transloco = inject(TranslocoService);
  private readonly platform = inject(PlatformService);
  private readonly document = inject(DOCUMENT);

  private readonly _locale = signal<AppLocale>('ar');

  readonly locale = this._locale.asReadonly();

  readonly direction = computed<AppDirection>(() =>
    this._locale() === 'ar' ? 'rtl' : 'ltr'
  );

  readonly isRtl = computed(() => this.direction() === 'rtl');

  initialize(): void {
    const stored = this.getStoredLocale();
    const locale = stored ?? 'ar';
    this.setLocale(locale);
  }

  initializeFromUrl(locale: AppLocale): void {
    this.setLocale(locale);
  }

  setLocale(locale: AppLocale): void {
    this._locale.set(locale);
    this.transloco.setActiveLang(locale);
    this.applyLocaleToDocument(locale);
    this.storeLocale(locale);
  }

  toggleLocale(): void {
    const next: AppLocale = this._locale() === 'ar' ? 'en' : 'ar';
    this.setLocale(next);
  }

  switchLocaleUrl(currentUrl: string): string {
    const next: AppLocale = this._locale() === 'ar' ? 'en' : 'ar';
    const segments = currentUrl.split('/').filter(Boolean);
    if (segments.length > 0 && (segments[0] === 'ar' || segments[0] === 'en')) {
      segments[0] = next;
    } else {
      segments.unshift(next);
    }
    return '/' + segments.join('/');
  }

  private applyLocaleToDocument(locale: AppLocale): void {
    const html = this.document.documentElement;
    html.lang = locale;
    html.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }

  private getStoredLocale(): AppLocale | null {
    if (!this.platform.isBrowser) return null;
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === 'ar' || stored === 'en' ? stored : null;
  }

  private storeLocale(locale: AppLocale): void {
    this.platform.runInBrowser(() => {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    });
  }
}
