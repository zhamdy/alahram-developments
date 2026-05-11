import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { PlatformService } from './platform.service';
import { SOCIAL_LINKS } from '@core/config/social.config';

export interface SiteSettings {
  projectsCount: number;
  unitsCount: number;
  clientsCount: number;
  phone: string;
}

const DEFAULTS: SiteSettings = {
  projectsCount: 21,
  unitsCount: 300,
  clientsCount: 260,
  phone: SOCIAL_LINKS.phone,
};

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly api = inject(ApiService);
  private readonly platform = inject(PlatformService);

  readonly settings = signal<SiteSettings>(DEFAULTS);
  readonly loaded = signal(false);

  readonly phoneHref = computed(() => `tel:${this.settings().phone}`);
  readonly whatsappHref = computed(() => `https://wa.me/${this.settings().phone.replace('+', '')}`);
  readonly whatsappMessageHref = computed(
    () => (message: string) => `${this.whatsappHref()}?text=${encodeURIComponent(message)}`,
  );

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
