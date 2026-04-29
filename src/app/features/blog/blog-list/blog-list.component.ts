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
import { SeoService, I18nService, PlatformService } from '@core/services';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { environment } from '@env';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { LocalizeRoutePipe } from '@shared/pipes';
import { BLOG_POSTS } from '../data/blog.data';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
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

const PAGE_SIZE = 9;

@Component({
  standalone: true,
  imports: [TranslocoDirective, NgOptimizedImage, RouterLink, FormatDatePipe, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, LucideChevronLeft, LucideChevronRight],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
})
export class BlogListComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);
  private readonly platform = inject(PlatformService);

  protected readonly filters = FILTERS;
  protected readonly activeFilter = signal<FilterKey>('all');
  protected readonly currentPage = signal(1);
  protected readonly allPosts = BLOG_POSTS;

  protected readonly filteredPosts = computed<readonly BlogPost[]>(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.allPosts;
    return this.allPosts.filter(post => post.category === filter);
  });

  protected readonly totalPages = computed(() =>
    Math.ceil(this.filteredPosts().length / PAGE_SIZE),
  );

  protected readonly paginatedPosts = computed<readonly BlogPost[]>(() => {
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredPosts().slice(start, start + PAGE_SIZE);
  });

  protected readonly pageNumbers = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    // Always show first, last, current and its neighbors; use 0 as ellipsis marker
    const pages: number[] = [1];
    if (current > 3) pages.push(0);
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
    if (current < total - 2) pages.push(0);
    pages.push(total);
    return pages;
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
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.platform.runInBrowser(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
}
