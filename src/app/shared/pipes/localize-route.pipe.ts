import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '@core/services';

@Pipe({
  name: 'localizeRoute',
  standalone: true,
  pure: false,
})
export class LocalizeRoutePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(path: string | string[]): string[] {
    const locale = this.i18n.locale();

    if (typeof path === 'string') {
      const segments = path.split('/').filter(Boolean);
      return ['/', locale, ...segments];
    }

    const segments = path.flatMap(segment =>
      segment.split('/').filter(Boolean),
    );
    return ['/', locale, ...segments];
  }
}
