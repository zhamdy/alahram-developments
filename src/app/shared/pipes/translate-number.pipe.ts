import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services';

@Pipe({
  name: 'translateNumber',
  standalone: true,
  pure: false,
})
export class TranslateNumberPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: number | string, format: 'decimal' | 'currency' | 'percent' = 'decimal'): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);

    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'EGP',
        }).format(num);
      case 'percent':
        return new Intl.NumberFormat(locale, {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(num);
      default:
        return new Intl.NumberFormat(locale).format(num);
    }
  }
}
