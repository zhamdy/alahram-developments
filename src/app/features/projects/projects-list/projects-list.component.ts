import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService } from '@core/services/seo.service';
import { I18nService } from '@core/services';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { environment } from '@env';
import { LucideChevronRight } from '@lucide/angular';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { ProjectsApiService } from '../services/projects-api.service';
import { ApiZone } from '../models/project-api.models';

@Component({
  selector: 'ahram-projects-list',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, LucideChevronRight],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss',
})
export class ProjectsListComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);
  private readonly projectsApi = inject(ProjectsApiService);

  protected readonly zones = signal<ApiZone[]>([]);

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('seo.projects.title'),
      description: this.transloco.translate('seo.projects.description'),
      keywords: this.transloco.translate('seo.projects.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/projects`,
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('projects.title'), url: `${environment.siteUrl}/${lang}/projects` },
    ]));

    this.projectsApi.getZones().subscribe(data => this.zones.set(data));
  }
}
