import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService, I18nService, PlatformService } from '@core/services';
import { ContactFormComponent } from '@shared/ui';
import { buildProjectSchema, buildBreadcrumbSchema } from '@shared/helpers';
import { environment } from '@env';
import { LucideChevronLeft, LucideMapPin, LucidePhone, LucidePlay, LucideX, LucideChevronRight } from '@lucide/angular';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { NgOptimizedImage } from '@angular/common';
import { ProjectsApiService } from '../services/projects-api.service';
import { ApiProject, ApiGalleryImage } from '../models/project-api.models';

@Component({
  selector: 'ahram-project-detail',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, ContactFormComponent, NgOptimizedImage, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, FormatDatePipe, LucideChevronLeft, LucideChevronRight, LucideMapPin, LucidePhone, LucidePlay, LucideX],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProjectDetailComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly platform = inject(PlatformService);
  private readonly projectsApi = inject(ProjectsApiService);

  zoneSlug = input<string>();
  slug = input<string>();

  project = signal<ApiProject | undefined>(undefined);
  lightboxIndex = signal<number | null>(null);

  galleryItems = computed<ApiGalleryImage[]>(() => {
    const p = this.project();
    if (!p) return [];
    const heroItem: ApiGalleryImage = { id: 0, imageUrl: p.imageUrl, caption: p.name, sortOrder: -1, mediaType: 'image' };
    return [heroItem, ...(p.gallery ?? [])];
  });

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  prevImage(): void {
    const i = this.lightboxIndex();
    if (i === null) return;
    this.lightboxIndex.set(i === 0 ? this.galleryItems().length - 1 : i - 1);
  }

  nextImage(): void {
    const i = this.lightboxIndex();
    if (i === null) return;
    this.lightboxIndex.set(i === this.galleryItems().length - 1 ? 0 : i + 1);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (this.lightboxIndex() === null) return;
    if (e.key === 'Escape') this.closeLightbox();
    if (e.key === 'ArrowLeft') this.prevImage();
    if (e.key === 'ArrowRight') this.nextImage();
  }

  safeMapUrl = computed(() => {
    const p = this.project();
    return p?.mapEmbedUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(p.mapEmbedUrl)
      : null;
  });

  ngOnInit(): void {
    const projectSlug = this.slug();
    if (!projectSlug) {
      this.router.navigate(['/404'], { skipLocationChange: true });
      return;
    }

    this.projectsApi.getProjectBySlug(projectSlug).subscribe({
      next: data => {
        this.project.set(data);

        const lang = this.i18n.locale();
        const name = data.name;
        const description = data.description;

        this.seo.updateSeo({
          title: name,
          description: description,
          canonicalUrl: `${environment.siteUrl}/${lang}/projects/${data.zoneSlug}/${data.slug}`,
          ogImage: `${environment.siteUrl}/${data.imageUrl}`,
        });

        this.seo.addJsonLd(buildProjectSchema(
          {
            slug: data.slug,
            zoneSlug: data.zoneSlug,
            imageUrl: data.imageUrl,
            galleryImages: data.gallery?.map(g => g.imageUrl),
          },
          name,
          description,
        ));
        this.seo.addJsonLd(buildBreadcrumbSchema([
          { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
          { name: this.transloco.translate('projects.title'), url: `${environment.siteUrl}/${lang}/projects` },
          { name: data.zoneName || '', url: `${environment.siteUrl}/${lang}/projects/${data.zoneSlug}` },
          { name, url: `${environment.siteUrl}/${lang}/projects/${data.zoneSlug}/${data.slug}` },
        ]));
      },
      error: () => {
        this.router.navigate(['/404'], { skipLocationChange: true });
      },
    });
  }
}
