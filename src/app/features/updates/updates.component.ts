import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService, I18nService } from '@core/services';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { LocalizeRoutePipe } from '@shared/pipes';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { environment } from '@env';
import { CONSTRUCTION_UPDATES, MILESTONES } from './data/updates.data';

@Component({
  selector: 'ahram-updates',
  standalone: true,
  imports: [
    TranslocoDirective,
    NgOptimizedImage,
    RouterLink,
    LocalizeRoutePipe,
    FormatDatePipe,
    ImageFallbackDirective,
    ScrollAnimateDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './updates.component.html',
  styleUrl: './updates.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class UpdatesComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  protected readonly milestones = MILESTONES;
  protected readonly activeFilter = signal<string>('all');

  protected readonly filteredUpdates = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return CONSTRUCTION_UPDATES;
    return CONSTRUCTION_UPDATES.filter(u => u.projectSlug === filter);
  });

  protected readonly projects = [
    { slug: 'all', nameKey: 'gallery.filters.all' },
    { slug: 'project-865', nameKey: 'projects.project865.name' },
    { slug: 'project-868', nameKey: 'projects.project868.name' },
    { slug: 'project-76', nameKey: 'projects.project76.name' },
  ];

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('seo.constructionUpdates.title'),
      description: this.transloco.translate('seo.constructionUpdates.description'),
      keywords: this.transloco.translate('seo.constructionUpdates.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/construction`,
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('header.constructionUpdates'), url: `${environment.siteUrl}/${lang}/construction` },
    ]));
  }

  protected setFilter(slug: string): void {
    this.activeFilter.set(slug);
  }

  protected getMilestoneIndex(milestone: string): number {
    return MILESTONES.indexOf(milestone as typeof MILESTONES[number]);
  }
}
