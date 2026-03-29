import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService, I18nService } from '@core/services';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { environment } from '@env';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { LocalizeRoutePipe } from '@shared/pipes';
import { BLOG_POSTS } from '../data/blog.data';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LucideChevronRight } from '@lucide/angular';
import { BlogCategory, BlogPost } from '../models/blog.models';

type FilterKey = 'all' | BlogCategory;

interface FilterOption {
  readonly key: FilterKey;
  readonly labelKey: string;
}

const FILTERS: readonly FilterOption[] = [
  { key: 'all', labelKey: 'blog.filters.all' },
  { key: 'company-news', labelKey: 'blog.filters.companyNews' },
  { key: 'market-insights', labelKey: 'blog.filters.marketInsights' },
  { key: 'investment-tips', labelKey: 'blog.filters.investmentTips' },
];

@Component({
  standalone: true,
  imports: [TranslocoDirective, NgOptimizedImage, RouterLink, FormatDatePipe, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, LucideChevronRight],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
})
export class BlogListComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  protected readonly filters = FILTERS;
  protected readonly activeFilter = signal<FilterKey>('all');
  protected readonly allPosts = BLOG_POSTS;

  protected readonly filteredPosts = computed<readonly BlogPost[]>(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.allPosts;
    return this.allPosts.filter(post => post.category === filter);
  });

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('seo.blog.title'),
      description: this.transloco.translate('seo.blog.description'),
      keywords: this.transloco.translate('seo.blog.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/blog`,
    });
    this.seo.addJsonLd(
      buildBreadcrumbSchema([
        { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
        {
          name: this.transloco.translate('seo.blog.title'),
          url: `${environment.siteUrl}/${lang}/blog`,
        },
      ]),
    );
  }

  protected setFilter(key: FilterKey): void {
    this.activeFilter.set(key);
  }
}
