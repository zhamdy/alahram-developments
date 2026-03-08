import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { SeoService } from '@core/services';
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
  selector: 'ahram-blog-list',
  standalone: true,
  imports: [TranslocoDirective, NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
})
export class BlogListComponent implements OnInit {
  private readonly seo = inject(SeoService);

  protected readonly filters = FILTERS;
  protected readonly activeFilter = signal<FilterKey>('all');
  protected readonly allPosts = BLOG_POSTS;

  protected get filteredPosts(): readonly BlogPost[] {
    const filter = this.activeFilter();
    if (filter === 'all') return this.allPosts;
    return this.allPosts.filter((post) => post.category === filter);
  }

  ngOnInit(): void {
    this.seo.updateSeo({
      title: 'المدونة',
      description: 'اقرأ أحدث المقالات حول سوق العقارات في مصر ونصائح الاستثمار وأخبار مشاريع الأهرام للتطوير العقاري',
      keywords: 'مدونة, عقارات, استثمار, مدينة السادات, الأهرام',
      canonicalUrl: 'https://alahram-developments.com/blog',
    });
  }

  protected setFilter(key: FilterKey): void {
    this.activeFilter.set(key);
  }

  protected formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
