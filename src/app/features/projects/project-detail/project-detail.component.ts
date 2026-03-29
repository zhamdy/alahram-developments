import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService, I18nService } from '@core/services';
import { ContactFormComponent } from '@shared/ui';
import { buildProjectSchema, buildBreadcrumbSchema } from '@shared/helpers';
import { environment } from '@env';
import { LucideChevronLeft, LucideMapPin, LucideCheck, LucidePhone, LucideHouse } from '@lucide/angular';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { NgOptimizedImage } from '@angular/common';
import { getProjectBySlug, getZoneBySlug } from '../data/projects.data';

@Component({
  selector: 'ahram-project-detail',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, ContactFormComponent, NgOptimizedImage, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, FormatDatePipe, LucideChevronLeft, LucideMapPin, LucideCheck, LucidePhone, LucideHouse],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  zoneSlug = input<string>();
  slug = input<string>();

  project = computed(() => {
    const s = this.slug();
    return s ? getProjectBySlug(s) : undefined;
  });
  zone = computed(() => {
    const zs = this.zoneSlug();
    return zs ? getZoneBySlug(zs) : undefined;
  });

  ngOnInit(): void {
    const project = this.project();
    if (!project) {
      this.router.navigate(['/404'], { skipLocationChange: true });
      return;
    }

    const lang = this.i18n.locale();
    const name = this.transloco.translate(project.nameKey);
    const description = this.transloco.translate(project.descriptionKey);
    const zone = this.zone();
    const zoneName = zone ? this.transloco.translate(zone.nameKey) : '';

    this.seo.updateSeo({
      title: name,
      description: description,
      canonicalUrl: `${environment.siteUrl}/${lang}/projects/${project.zoneSlug}/${project.slug}`,
      ogImage: `${environment.siteUrl}/${project.imageUrl}`,
    });

    this.seo.addJsonLd(buildProjectSchema(project, name, description));
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('projects.title'), url: `${environment.siteUrl}/${lang}/projects` },
      { name: zoneName, url: `${environment.siteUrl}/${lang}/projects/${project.zoneSlug}` },
      { name, url: `${environment.siteUrl}/${lang}/projects/${project.zoneSlug}/${project.slug}` },
    ]));
  }
}
