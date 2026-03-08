import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { I18nService } from '@core/services';
import { TESTIMONIALS } from '../../data/home.data';

@Component({
  selector: 'ahram-testimonials',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss',
})
export class TestimonialsComponent {
  private readonly i18n = inject(I18nService);

  protected readonly testimonials = computed(() => {
    const isAr = this.i18n.locale() === 'ar';
    return TESTIMONIALS.map((t) => ({
      id: t.id,
      name: isAr ? t.nameAr : t.nameEn,
      quote: isAr ? t.quoteAr : t.quoteEn,
    }));
  });
}
