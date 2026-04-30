import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideChevronRight, LucideMapPin } from '@lucide/angular';
import { I18nService } from '@core/services';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { ProjectsApiService } from '@features/projects/services/projects-api.service';
import { ApiZone } from '@features/projects/models/project-api.models';

@Component({
  selector: 'ahram-zones-showcase',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, TranslocoDirective, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, LucideChevronRight, LucideMapPin],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zones-showcase.component.html',
  styleUrl: './zones-showcase.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ZonesShowcaseComponent {
  protected readonly zones = signal<ApiZone[]>([]);

  private readonly i18n = inject(I18nService);
  private readonly projectsApi = inject(ProjectsApiService);

  constructor() {
    effect(() => {
      this.i18n.locale();
      this.projectsApi.getZones().subscribe(data => this.zones.set(data ?? []));
    });
  }
}
