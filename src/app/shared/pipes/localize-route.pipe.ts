import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '@core/services';

@Pipe({
  name: 'localizeRoute',
  standalone: true,
  // Impure so the links follow a language switch. That means transform() runs on
  // every change detection pass, for every routerLink on the page — 26 of them on
  // the homepage — so it has to be cheap and, above all, return a stable
  // reference. Handing RouterLink a fresh array each pass made it rebuild its
  // UrlTree and re-serialize its href every time, on every interaction.
  pure: false,
})
export class LocalizeRoutePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  // One instance per binding, so this holds a single entry per locale.
  private readonly cache = new Map<string, string[]>();

  transform(path: string | string[]): string[] {
    const locale = this.i18n.locale();
    const key = `${locale}|${Array.isArray(path) ? path.join('/') : path}`;

    const cached = this.cache.get(key);
    if (cached) return cached;

    const segments = (typeof path === 'string' ? [path] : path).flatMap(segment =>
      segment.split('/').filter(Boolean),
    );
    const commands = ['/', locale, ...segments];

    this.cache.set(key, commands);
    return commands;
  }
}
