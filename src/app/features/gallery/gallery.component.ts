import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { SeoService } from '@core/services';

interface GalleryItem {
  readonly id: number;
  readonly src: string;
  readonly projectKey: string;
}

type FilterKey = 'all' | 'project865' | 'project868' | 'project76';

interface FilterOption {
  readonly key: FilterKey;
  readonly labelKey: string;
}

const GALLERY_ITEMS: readonly GalleryItem[] = [
  { id: 1, src: 'assets/images/projects/project-865-gallery-1.jpg', projectKey: 'project865' },
  { id: 2, src: 'assets/images/projects/project-865-gallery-2.jpg', projectKey: 'project865' },
  { id: 3, src: 'assets/images/projects/project-865-gallery-3.jpg', projectKey: 'project865' },
  { id: 4, src: 'assets/images/projects/project-865-gallery-4.jpg', projectKey: 'project865' },
  { id: 5, src: 'assets/images/projects/project-868-gallery-1.jpg', projectKey: 'project868' },
  { id: 6, src: 'assets/images/projects/project-868-gallery-2.jpg', projectKey: 'project868' },
  { id: 7, src: 'assets/images/projects/project-868-gallery-3.jpg', projectKey: 'project868' },
  { id: 8, src: 'assets/images/projects/project-868-gallery-4.jpg', projectKey: 'project868' },
  { id: 9, src: 'assets/images/projects/project-76-gallery-1.jpg', projectKey: 'project76' },
  { id: 10, src: 'assets/images/projects/project-76-gallery-2.jpg', projectKey: 'project76' },
  { id: 11, src: 'assets/images/projects/project-76-gallery-3.jpg', projectKey: 'project76' },
  { id: 12, src: 'assets/images/projects/project-76-gallery-4.jpg', projectKey: 'project76' },
];

const FILTERS: readonly FilterOption[] = [
  { key: 'all', labelKey: 'gallery.filters.all' },
  { key: 'project865', labelKey: 'gallery.filters.project865' },
  { key: 'project868', labelKey: 'gallery.filters.project868' },
  { key: 'project76', labelKey: 'gallery.filters.project76' },
];

@Component({
  selector: 'ahram-gallery',
  standalone: true,
  imports: [TranslocoDirective, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent implements OnInit {
  private readonly seo = inject(SeoService);

  protected readonly filters = FILTERS;
  protected readonly activeFilter = signal<FilterKey>('all');

  protected readonly allItems = GALLERY_ITEMS;

  protected get filteredItems(): readonly GalleryItem[] {
    const filter = this.activeFilter();
    if (filter === 'all') return this.allItems;
    return this.allItems.filter((item) => item.projectKey === filter);
  }

  ngOnInit(): void {
    this.seo.updateSeo({
      title: 'معرض الصور',
      description: 'شاهد أحدث صور مشاريع الأهرام للتطوير العقاري ومراحل التنفيذ في مدينة السادات',
      keywords: 'معرض صور, الأهرام, مشاريع, مدينة السادات, تطوير عقاري',
      canonicalUrl: 'https://alahram-developments.com/gallery',
    });
  }

  protected setFilter(key: FilterKey): void {
    this.activeFilter.set(key);
  }
}
