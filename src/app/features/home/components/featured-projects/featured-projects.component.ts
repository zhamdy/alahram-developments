import { afterNextRender, ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, effect, ElementRef, inject, OnInit, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideChevronRight } from '@lucide/angular';
import { I18nService } from '@core/services';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { ProjectsApiService } from '@features/projects/services/projects-api.service';
import { ApiZone } from '@features/projects/models/project-api.models';

const SWIPER_CUSTOM_CSS = `
  .swiper-button-next, .swiper-button-prev {
    background: oklch(0.72 0.15 55) !important;
    border: none !important;
    border-radius: 50% !important;
    width: 2.75rem !important;
    height: 2.75rem !important;
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.15) !important;
    transition: opacity 0.2s;
    color: white !important;
  }
  .swiper-button-next:hover, .swiper-button-prev:hover {
    opacity: 0.85;
  }
  .swiper-button-next svg, .swiper-button-prev svg {
    width: auto !important;
    height: 0.875rem !important;
    fill: white !important;
  }
`;


@Component({
  selector: 'ahram-featured-projects',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, NgOptimizedImage, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, LucideChevronRight],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './featured-projects.component.html',
  styleUrl: './featured-projects.component.scss',
})
export class FeaturedProjectsComponent implements OnInit {
  protected readonly zones = signal<ApiZone[]>([]);

  private readonly hostRef = inject(ElementRef);
  private readonly i18n = inject(I18nService);
  private readonly projectsApi = inject(ProjectsApiService);
  private swiperInitialized = false;

  constructor() {
    afterNextRender(() => {
      if (this.zones().length > 0) {
        this.initSwiper();
      }
    });

    effect(() => {
      const dir = this.i18n.direction();
      if (!this.swiperInitialized) return;
      this.reinitSwiper(dir);
    });
  }

  ngOnInit(): void {
    this.projectsApi.getZones().subscribe(data => {
      this.zones.set(data);
      // Init swiper after data arrives (may be after afterNextRender)
      if (typeof window !== 'undefined') {
        setTimeout(() => this.initSwiper(), 0);
      }
    });
  }

  private initSwiper(): void {
    if (this.swiperInitialized) return;
    import('swiper/element/bundle').then((m) => {
      m.register();
      const swiperEl = this.hostRef.nativeElement.querySelector('swiper-container');
      if (!swiperEl) return;

      swiperEl.setAttribute('dir', this.i18n.direction());
      swiperEl.initialize();
      this.swiperInitialized = true;
      this.injectCustomCss(swiperEl);
    });
  }

  private reinitSwiper(dir: string): void {
    const swiperEl = this.hostRef.nativeElement.querySelector('swiper-container');
    if (!swiperEl?.swiper) return;

    swiperEl.swiper.destroy(true, true);
    swiperEl.setAttribute('dir', dir);
    swiperEl.initialize();
    this.injectCustomCss(swiperEl);
  }

  private injectCustomCss(swiperEl: HTMLElement): void {
    requestAnimationFrame(() => {
      if (!swiperEl.shadowRoot) return;
      if (swiperEl.shadowRoot.querySelector('style[data-custom]')) return;
      const style = document.createElement('style');
      style.setAttribute('data-custom', '');
      style.textContent = SWIPER_CUSTOM_CSS;
      swiperEl.shadowRoot.appendChild(style);
    });
  }
}
