import { ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, OnInit, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService, I18nService } from '@core/services';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { LucideSearch, LucideX, LucideChevronLeft, LucideChevronRight, LucidePlay } from '@lucide/angular';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { environment } from '@env';
import { ProjectsApiService } from '../projects/services/projects-api.service';
import { ApiGalleryImage } from '../projects/models/project-api.models';

interface FilterOption {
  readonly key: string;
  readonly label: string;
}

@Component({
  selector: 'ahram-gallery',
  standalone: true,
  imports: [TranslocoDirective, NgOptimizedImage, ImageFallbackDirective, ScrollAnimateDirective, LucideSearch, LucideX, LucideChevronLeft, LucideChevronRight, LucidePlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);
  private readonly projectsApi = inject(ProjectsApiService);

  protected readonly allItems = signal<ApiGalleryImage[]>([]);
  protected readonly filters = signal<FilterOption[]>([]);
  protected readonly activeFilter = signal<string>('all');

  protected readonly filteredItems = computed(() => {
    const filter = this.activeFilter();
    const items = this.allItems();
    if (filter === 'all') return items;
    return items.filter(item => item.projectSlug === filter);
  });

  constructor() {
    // Re-fetch data when locale changes (language switch)
    effect(() => {
      this.i18n.locale(); // track locale signal
      this.fetchGallery();
    });
  }

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

  private fetchGallery(): void {
    this.projectsApi.getGallery().subscribe(data => {
      this.allItems.set(data);

      // Build dynamic filter options from unique project slugs
      const projectMap = new Map<string, string>();
      for (const img of data) {
        if (img.projectSlug && img.projectName && !projectMap.has(img.projectSlug)) {
          projectMap.set(img.projectSlug, img.projectName);
        }
      }
      const filterOptions: FilterOption[] = [
        { key: 'all', label: this.transloco.translate('gallery.filters.all') },
      ];
      for (const [slug, name] of projectMap) {
        filterOptions.push({ key: slug, label: name });
      }
      this.filters.set(filterOptions);
    });
  }

  protected readonly lightboxIndex = signal<number | null>(null);

  protected readonly lightboxItem = computed(() => {
    const idx = this.lightboxIndex();
    if (idx === null) return null;
    const items = this.filteredItems();
    return items[idx] ?? null;
  });

  protected readonly lightboxCount = computed(() => this.filteredItems().length);

  protected setFilter(key: string): void {
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
