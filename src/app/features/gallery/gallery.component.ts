import { ChangeDetectionStrategy, Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService, I18nService } from '@core/services';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { LucideSearch, LucideX, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { environment } from '@env';

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
  imports: [TranslocoDirective, NgOptimizedImage, ImageFallbackDirective, ScrollAnimateDirective, LucideSearch, LucideX, LucideChevronLeft, LucideChevronRight],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  protected readonly filters = FILTERS;
  protected readonly activeFilter = signal<FilterKey>('all');

  protected readonly allItems = GALLERY_ITEMS;

  protected readonly filteredItems = computed<readonly GalleryItem[]>(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.allItems;
    return this.allItems.filter((item) => item.projectKey === filter);
  });

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('seo.gallery.title'),
      description: this.transloco.translate('seo.gallery.description'),
      keywords: this.transloco.translate('seo.gallery.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/gallery`,
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('header.gallery'), url: `${environment.siteUrl}/${lang}/gallery` },
    ]));
  }

  protected readonly lightboxIndex = signal<number | null>(null);

  protected readonly lightboxItem = computed(() => {
    const idx = this.lightboxIndex();
    if (idx === null) return null;
    const items = this.filteredItems();
    return items[idx] ?? null;
  });

  protected readonly lightboxCount = computed(() => this.filteredItems().length);

  protected setFilter(key: FilterKey): void {
    this.activeFilter.set(key);
    this.lightboxIndex.set(null);
  }

  protected openLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  protected closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  protected prevImage(): void {
    const idx = this.lightboxIndex();
    if (idx === null) return;
    const count = this.lightboxCount();
    this.lightboxIndex.set((idx - 1 + count) % count);
  }

  protected nextImage(): void {
    const idx = this.lightboxIndex();
    if (idx === null) return;
    const count = this.lightboxCount();
    this.lightboxIndex.set((idx + 1) % count);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.lightboxIndex() === null) return;
    switch (event.key) {
      case 'Escape':
        this.closeLightbox();
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        event.key === 'ArrowLeft' ? this.prevImage() : this.nextImage();
        break;
    }
  }
}
