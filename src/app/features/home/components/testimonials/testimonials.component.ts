import { afterNextRender, ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, ElementRef, inject, OnDestroy } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { I18nService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import { TESTIMONIALS } from '../../data/home.data';

const SWIPER_CUSTOM_CSS = `
  .swiper-pagination-bullet-active {
    background: oklch(0.62 0.16 55) !important;
  }
`;

@Component({
  selector: 'ahram-testimonials',
  standalone: true,
  imports: [TranslocoDirective, ScrollAnimateDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss',
})
export class TestimonialsComponent implements OnDestroy {
  private readonly i18n = inject(I18nService);
  private readonly hostRef = inject(ElementRef);
  private swiperInitialized = false;
  private isDestroyed = false;

  protected readonly testimonials = computed(() => {
    const isAr = this.i18n.locale() === 'ar';
    return TESTIMONIALS.map((t) => ({
      id: t.id,
      name: isAr ? t.nameAr : t.nameEn,
      quote: isAr ? t.quoteAr : t.quoteEn,
    }));
  });

  constructor() {
    afterNextRender(() => {
      this.initSwiper();
    });

    effect(() => {
      const dir = this.i18n.direction();
      if (!this.swiperInitialized) return;
      this.reinitSwiper(dir);
    });
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    const swiperEl = this.hostRef.nativeElement.querySelector('swiper-container');
    if (swiperEl?.swiper) {
      swiperEl.swiper.destroy(true, true);
    }
  }

  private initSwiper(): void {
    if (this.swiperInitialized) return;
    import('swiper/element/bundle').then((m) => {
      if (this.isDestroyed) return;
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
      if (this.isDestroyed || !swiperEl.shadowRoot) return;
      if (swiperEl.shadowRoot.querySelector('style[data-custom]')) return;
      const style = document.createElement('style');
      style.setAttribute('data-custom', '');
      style.textContent = SWIPER_CUSTOM_CSS;
      swiperEl.shadowRoot.appendChild(style);
    });
  }
}
