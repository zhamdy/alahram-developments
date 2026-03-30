import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService, I18nService } from '@core/services';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { environment } from '@env';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { ProjectsApiService } from '../services/projects-api.service';
import { ApiZone, ApiProject } from '../models/project-api.models';

@Component({
  selector: 'ahram-zone-projects',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, FormatDatePipe, LucideChevronLeft, LucideChevronRight],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zone-projects.component.html',
  styleUrl: './zone-projects.component.scss',
})
export class ZoneProjectsComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);
  private readonly projectsApi = inject(ProjectsApiService);

  zoneSlug = input<string>();

  zone = signal<ApiZone | undefined>(undefined);
  projects = signal<ApiProject[]>([]);

  ngOnInit(): void {
    const slug = this.zoneSlug();
    if (!slug) return;

    this.projectsApi.getZoneBySlug(slug).subscribe({
      next: data => {
        this.zone.set(data);
        this.projects.set(data.projects);

        const lang = this.i18n.locale();
        const zoneName = data.name;

        this.seo.updateSeo({
          title: zoneName,
          description: data.description,
          canonicalUrl: `${environment.siteUrl}/${lang}/projects/${data.slug}`,
        });
        this.seo.addJsonLd(buildBreadcrumbSchema([
          { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
          { name: this.transloco.translate('projects.title'), url: `${environment.siteUrl}/${lang}/projects` },
          { name: zoneName, url: `${environment.siteUrl}/${lang}/projects/${data.slug}` },
        ]));
      },
      error: () => {
        // Zone not found — try to check if it's a project slug for backward compat
        this.projectsApi.getProjectBySlug(slug).subscribe({
          next: project => {
            const lang = this.i18n.locale();
            this.router.navigateByUrl(`/${lang}/projects/${project.zoneSlug}/${project.slug}`, { replaceUrl: true });
          },
          error: () => {
            this.router.navigate(['/404'], { skipLocationChange: true });
          },
        });
      },
    });
  }
}
