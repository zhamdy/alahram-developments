import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService, PlatformService, I18nService, SiteSettingsService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import { LucidePhone, LucideMail, LucideMapPin } from '@lucide/angular';
import { buildBreadcrumbSchema, buildLocalBusinessSchema } from '@shared/helpers';
import { BreadcrumbsComponent, BreadcrumbItem, ContactFormComponent } from '@shared/ui';
import { environment } from '@env';

@Component({
  selector: 'ahram-contact',
  standalone: true,
  imports: [TranslocoDirective, BreadcrumbsComponent, ContactFormComponent, ScrollAnimateDirective, LucidePhone, LucideMail, LucideMapPin],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);
  protected readonly platform = inject(PlatformService);
  protected readonly siteSettings = inject(SiteSettingsService);

  protected breadcrumbItems: BreadcrumbItem[] = [];

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('seo.contact.title'),
      description: this.transloco.translate('seo.contact.description'),
      keywords: this.transloco.translate('seo.contact.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/contact/`,
    });
    this.breadcrumbItems = [
      { label: this.transloco.translate('header.home'), url: `/${lang}` },
      { label: this.transloco.translate('header.contact') },
    ];
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('header.contact'), url: `${environment.siteUrl}/${lang}/contact` },
    ]));
    this.seo.addJsonLd(buildLocalBusinessSchema());
  }
}
