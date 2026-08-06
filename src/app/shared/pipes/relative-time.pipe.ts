import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services';

@Pipe({
  name: 'relativeTime',
  standalone: true,
  pure: false,
})
export class RelativeTimePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHours = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHours / 24);

    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, 'second');
    if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute');
    if (Math.abs(diffHours) < 24) return rtf.format(-diffHours, 'hour');
    if (Math.abs(diffDays) < 30) return rtf.format(-diffDays, 'day');

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
}
