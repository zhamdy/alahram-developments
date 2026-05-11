import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { PlatformService } from './platform.service';

export interface SiteSettings {
  projectsCount: number;
  unitsCount: number;
  clientsCount: number;
}

const DEFAULTS: SiteSettings = { projectsCount: 21, unitsCount: 300, clientsCount: 260 };

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly api = inject(ApiService);
  private readonly platform = inject(PlatformService);

  readonly settings = signal<SiteSettings>(DEFAULTS);
  readonly loaded = signal(false);

  load(): void {
    // API is not available during SSR prerendering — browser only
    if (!this.platform.isBrowser || this.loaded()) return;
    this.api.get<SiteSettings>('/settings').subscribe({
      next: res => {
        if (res.success) this.settings.set(res.data);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }
}
