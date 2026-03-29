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
import { buildBreadcrumbSchema } from '@shared/helpers';
import { environment } from '@env';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { getProjectsByZone, getZoneBySlug, getProjectBySlug } from '../data/projects.data';

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

  zoneSlug = input<string>();

  zone = computed(() => {
    const zs = this.zoneSlug();
    return zs ? getZoneBySlug(zs) : undefined;
  });
  projects = computed(() => {
    const zs = this.zoneSlug();
    return zs ? getProjectsByZone(zs) : [];
  });

  ngOnInit(): void {
    const slug = this.zoneSlug();
    if (!slug) return;

    // Backward compat: if zoneSlug is actually a project slug, redirect
    const projectMatch = getProjectBySlug(slug);
    if (projectMatch) {
      const lang = this.i18n.locale();
      this.router.navigateByUrl(`/${lang}/projects/${projectMatch.zoneSlug}/${projectMatch.slug}`, { replaceUrl: true });
      return;
    }

    const zone = this.zone();
    if (!zone) {
      this.router.navigate(['/404'], { skipLocationChange: true });
      return;
    }

    const lang = this.i18n.locale();
    const zoneName = this.transloco.translate(zone.nameKey);

    this.seo.updateSeo({
      title: zoneName,
      description: this.transloco.translate(zone.descriptionKey),
      canonicalUrl: `${environment.siteUrl}/${lang}/projects/${zone.slug}`,
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('projects.title'), url: `${environment.siteUrl}/${lang}/projects` },
      { name: zoneName, url: `${environment.siteUrl}/${lang}/projects/${zone.slug}` },
    ]));
  }
}
