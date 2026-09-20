import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
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
import { BreadcrumbItem, BreadcrumbsComponent } from '@shared/ui/breadcrumbs/breadcrumbs.component';
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
  imports: [TranslocoDirective, NgOptimizedImage, RouterLink, FormatDatePipe, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, LucideChevronLeft, LucideChevronRight, BreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
})
export class BlogListComponent {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  protected readonly filters = FILTERS;
  protected readonly activeFilter = signal<FilterKey>('all');

  // Page lives in the URL so every post is reachable without JavaScript: page 1
  // is /blog/, the rest are /blog/page/N/, and all of them are prerendered.
  protected readonly pageParam = input<string | undefined>(undefined, { alias: 'page' });

  private readonly requestedPage = linkedSignal(() => {
    const parsed = Number.parseInt(this.pageParam() ?? '1', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });
  protected readonly allPosts = BLOG_POSTS;
  protected breadcrumbItems: BreadcrumbItem[] = [];

  protected readonly filteredPosts = computed<readonly BlogPost[]>(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.allPosts;
    return this.allPosts.filter(post => post.category === filter);
  });

  protected readonly totalPages = computed(() =>
    Math.ceil(this.filteredPosts().length / PAGE_SIZE),
  );

  // Clamped, because the page number arrives from the URL and a filter can
  // shorten the list underneath it.
  protected readonly currentPage = computed(() =>
    Math.min(this.requestedPage(), Math.max(1, this.totalPages())),
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

  constructor() {
    effect(() => this.updateSeo());
  }

  // Page 1 keeps the bare /blog/ URL, so its canonical must not gain a suffix.
  protected pageLink(page: number): string {
    return page <= 1 ? 'blog' : `blog/page/${page}`;
  }

  private updateSeo(): void {
    const lang = this.i18n.locale();
    const page = this.currentPage();
    const suffix = page > 1 ? ` — ${page}` : '';
    this.seo.updateSeo({
      title: `${this.transloco.translate('seo.blog.title')}${suffix}`,
      description: this.transloco.translate('seo.blog.description'),
      canonicalUrl: `${environment.siteUrl}/${lang}/${this.pageLink(page)}/`,
    });
    this.breadcrumbItems = [
      { label: this.transloco.translate('header.home'), url: `/${lang}` },
      { label: this.transloco.translate('seo.blog.title') },
    ];

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
    this.requestedPage.set(1);
  }
}
