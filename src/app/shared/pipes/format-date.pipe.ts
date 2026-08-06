import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '@core/services';

@Pipe({ name: 'formatDate', standalone: true })
export class FormatDatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(dateStr: string): string {
    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
