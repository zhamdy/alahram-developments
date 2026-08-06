import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { PlatformService } from './platform.service';
import { SOCIAL_LINKS } from '@core/config/social.config';

export interface SiteSettings {
  projectsCount: number;
  unitsCount: number;
  clientsCount: number;
  phone: string;
  whatsapp: string;
}

const DEFAULTS: SiteSettings = {
  projectsCount: 21,
  unitsCount: 300,
  clientsCount: 260,
  phone: SOCIAL_LINKS.phone,
  whatsapp: SOCIAL_LINKS.whatsapp,
};

// Format an E.164 Egyptian number (+20 + 10 digits) as "+20 1XX XXX XXXX".
// Any other shape is returned unchanged so non-Egyptian numbers still display.
function formatPhone(num: string): string {
  const n = (num ?? '').trim();
  const m = /^\+20(\d{10})$/.exec(n);
  if (!m) return n;
  const d = m[1];
  return `+20 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly api = inject(ApiService);
  private readonly platform = inject(PlatformService);

  readonly settings = signal<SiteSettings>(DEFAULTS);
  readonly loaded = signal(false);

  // WhatsApp falls back to the phone number when left blank in admin settings.
  private readonly whatsappNumber = computed(() => {
    const w = this.settings().whatsapp?.trim();
    return w ? w : this.settings().phone;
  });

  readonly phoneHref = computed(() => `tel:${this.settings().phone}`);
  readonly whatsappHref = computed(() => `https://wa.me/${this.whatsappNumber().replace('+', '')}`);
  readonly whatsappMessageHref = computed(
    () => (message: string) => `${this.whatsappHref()}?text=${encodeURIComponent(message)}`,
  );

  // Display-formatted variants for visible text (links use the *Href computeds above).
  readonly phoneDisplay = computed(() => formatPhone(this.settings().phone));
  readonly whatsappDisplay = computed(() => formatPhone(this.whatsappNumber()));

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
