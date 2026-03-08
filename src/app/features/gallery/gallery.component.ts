import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { SeoService } from '@core/services';

interface GalleryItem {
  readonly id: number;
  readonly from: string;
  readonly to: string;
  readonly projectKey: string;
}

type FilterKey = 'all' | 'project865' | 'project868' | 'project76';

interface FilterOption {
  readonly key: FilterKey;
  readonly labelKey: string;
}

const GALLERY_ITEMS: readonly GalleryItem[] = [
  { id: 1, from: 'oklch(0.72 0.15 55)', to: 'oklch(0.85 0.18 90)', projectKey: 'project865' },
  { id: 2, from: 'oklch(0.60 0.12 40)', to: 'oklch(0.72 0.15 55)', projectKey: 'project865' },
  { id: 3, from: 'oklch(0.85 0.18 90)', to: 'oklch(0.72 0.15 55)', projectKey: 'project865' },
  { id: 4, from: 'oklch(0.72 0.15 55)', to: 'oklch(0.60 0.12 40)', projectKey: 'project865' },
  { id: 5, from: 'oklch(0.25 0.06 50)', to: 'oklch(0.40 0.08 55)', projectKey: 'project868' },
  { id: 6, from: 'oklch(0.35 0.08 55)', to: 'oklch(0.25 0.06 50)', projectKey: 'project868' },
  { id: 7, from: 'oklch(0.40 0.08 55)', to: 'oklch(0.35 0.08 55)', projectKey: 'project868' },
  { id: 8, from: 'oklch(0.25 0.06 50)', to: 'oklch(0.35 0.08 55)', projectKey: 'project868' },
  { id: 9, from: 'oklch(0.85 0.18 90)', to: 'oklch(0.72 0.15 55)', projectKey: 'project76' },
  { id: 10, from: 'oklch(0.72 0.15 55)', to: 'oklch(0.85 0.18 90)', projectKey: 'project76' },
  { id: 11, from: 'oklch(0.60 0.12 40)', to: 'oklch(0.85 0.18 90)', projectKey: 'project76' },
  { id: 12, from: 'oklch(0.85 0.18 90)', to: 'oklch(0.60 0.12 40)', projectKey: 'project76' },
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
  imports: [TranslocoDirective],
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
