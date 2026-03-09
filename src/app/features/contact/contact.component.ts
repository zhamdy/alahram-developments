import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService, PlatformService } from '@core/services';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { ContactFormComponent } from '@shared/ui';

@Component({
  selector: 'ahram-contact',
  standalone: true,
  imports: [TranslocoDirective, ContactFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  protected readonly platform = inject(PlatformService);

  ngOnInit(): void {
    this.seo.updateSeo({
      title: this.transloco.translate('seo.contact.title'),
      description: this.transloco.translate('seo.contact.description'),
      keywords: this.transloco.translate('seo.contact.keywords'),
      canonicalUrl: 'https://alahram-developments.com/contact',
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: 'https://alahram-developments.com' },
      { name: this.transloco.translate('header.contact'), url: 'https://alahram-developments.com/contact' },
    ]));
  }
}
