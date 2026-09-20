import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideBuilding2, LucideHome, LucideUsers } from '@lucide/angular';
import { SiteSettingsService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';

@Component({
  selector: 'ahram-trust-bar',
  standalone: true,
  imports: [TranslocoDirective, ScrollAnimateDirective, LucideBuilding2, LucideHome, LucideUsers],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trust-bar.component.html',
  styleUrl: './trust-bar.component.scss',
})
export class TrustBarComponent {
  private readonly siteSettings = inject(SiteSettingsService);

  // The real figures, rendered on the server and in every client render. These
  // used to start at 0 and count up after hydration, which put "0 مشاريع متميزة"
  // in the crawlable HTML. The count-up is gone rather than gated: it has to
  // start at 0, and any gate that decides whether showing 0 is safe has to read
  // layout before it has settled, so it eventually lets the figure count
  // backwards from its real value in front of the reader.
  protected readonly projectsCount = linkedSignal(() => this.siteSettings.settings().projectsCount);
  protected readonly unitsCount = linkedSignal(() => this.siteSettings.settings().unitsCount);
  protected readonly clientsCount = linkedSignal(() => this.siteSettings.settings().clientsCount);

  protected readonly stats = computed(() => {
    const s = this.siteSettings.settings();
    return [
      { target: s.projectsCount, signal: this.projectsCount, labelKey: 'home.trustBar.projects', suffix: '' },
      { target: s.unitsCount,    signal: this.unitsCount,    labelKey: 'home.trustBar.units',    suffix: '+' },
      { target: s.clientsCount,  signal: this.clientsCount,  labelKey: 'about.stats.clients',    suffix: '+' },
    ];
  });
}
