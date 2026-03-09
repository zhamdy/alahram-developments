import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService } from '@core/services';
import { buildBreadcrumbSchema } from '@shared/helpers';

@Component({
  selector: 'ahram-privacy',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);

  ngOnInit(): void {
    this.seo.updateSeo({
      title: this.transloco.translate('seo.privacy.title'),
      description: this.transloco.translate('seo.privacy.description'),
      keywords: this.transloco.translate('seo.privacy.keywords'),
      canonicalUrl: 'https://alahram-developments.com/privacy',
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: 'https://alahram-developments.com' },
      { name: this.transloco.translate('seo.privacy.title'), url: 'https://alahram-developments.com/privacy' },
    ]));
  }
}
