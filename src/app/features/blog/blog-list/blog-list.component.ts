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
import { SeoService } from '@core/services';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { environment } from '@env';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { BLOG_POSTS } from '../data/blog.data';
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
  imports: [TranslocoDirective, NgOptimizedImage, RouterLink, FormatDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
})
export class BlogListComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);

  protected readonly filters = FILTERS;
  protected readonly activeFilter = signal<FilterKey>('all');
  protected readonly allPosts = BLOG_POSTS;

  protected readonly filteredPosts = computed<readonly BlogPost[]>(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.allPosts;
    return this.allPosts.filter(post => post.category === filter);
  });

  ngOnInit(): void {
    this.seo.updateSeo({
      title: this.transloco.translate('seo.blog.title'),
      description: this.transloco.translate('seo.blog.description'),
      keywords: this.transloco.translate('seo.blog.keywords'),
      canonicalUrl: `${environment.siteUrl}/blog`,
    });
    this.seo.addJsonLd(
      buildBreadcrumbSchema([
        { name: this.transloco.translate('header.home'), url: environment.siteUrl },
        {
          name: this.transloco.translate('seo.blog.title'),
          url: `${environment.siteUrl}/blog`,
        },
      ]),
    );
  }

  protected setFilter(key: FilterKey): void {
    this.activeFilter.set(key);
  }
}
