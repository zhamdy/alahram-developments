import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService, PlatformService, I18nService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import { buildBreadcrumbSchema, buildLocalBusinessSchema } from '@shared/helpers';
import { ContactFormComponent } from '@shared/ui';
import { environment } from '@env';

@Component({
  selector: 'ahram-contact',
  standalone: true,
  imports: [TranslocoDirective, ContactFormComponent, ScrollAnimateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);
  protected readonly platform = inject(PlatformService);

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('seo.contact.title'),
      description: this.transloco.translate('seo.contact.description'),
      keywords: this.transloco.translate('seo.contact.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/contact`,
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('header.contact'), url: `${environment.siteUrl}/${lang}/contact` },
    ]));
    this.seo.addJsonLd(buildLocalBusinessSchema());
  }
}
