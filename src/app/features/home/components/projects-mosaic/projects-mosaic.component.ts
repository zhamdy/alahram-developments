import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideChevronRight } from '@lucide/angular';
import { I18nService } from '@core/services';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { ProjectsApiService } from '@features/projects/services/projects-api.service';
import { ApiProject } from '@features/projects/models/project-api.models';

const TILE_SIZES = ['lg', 'md', 'sm', 'sm', 'md', 'sm', 'sm'] as const;

@Component({
  selector: 'ahram-projects-mosaic',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, TranslocoDirective, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, LucideChevronRight],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects-mosaic.component.html',
  styleUrl: './projects-mosaic.component.scss',
})
export class ProjectsMosaicComponent {
  private readonly projects = signal<ApiProject[]>([]);
  private readonly i18n = inject(I18nService);
  private readonly projectsApi = inject(ProjectsApiService);

  protected readonly tiles = computed(() =>
    this.projects().slice(0, 7).map((p, i) => ({
      id: p.slug,
      imageUrl: p.imageUrl,
      name: p.name,
      link: `/projects/${p.zoneSlug}/${p.slug}`,
      tileSize: TILE_SIZES[i] ?? 'sm',
    }))
  );

  constructor() {
    effect(() => {
      this.i18n.locale();
      this.projectsApi.getProjects().subscribe(data => this.projects.set(data ?? []));
    });
  }
}
