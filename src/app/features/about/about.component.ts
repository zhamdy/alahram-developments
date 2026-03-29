import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  LucideIconData,
  LucideShieldCheck,
  LucideScale,
  LucideLightbulb,
  LucideUsers,
  LucideZap,
  LucideEye,
  LucidePhone,
  LucideDynamicIcon,
} from '@lucide/angular';
import { SeoService, I18nService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { ContactFormComponent } from '@shared/ui';
import { environment } from '@env';

interface ValueItem {
  readonly id: string;
  readonly icon: LucideIconData;
  readonly titleKey: string;
  readonly descriptionKey: string;
}

const VALUES: readonly ValueItem[] = [
  {
    id: 'quality',
    icon: LucideShieldCheck.icon,
    titleKey: 'about.values.quality.title',
    descriptionKey: 'about.values.quality.description',
  },
  {
    id: 'integrity',
    icon: LucideScale.icon,
    titleKey: 'about.values.integrity.title',
    descriptionKey: 'about.values.integrity.description',
  },
  {
    id: 'innovation',
    icon: LucideLightbulb.icon,
    titleKey: 'about.values.innovation.title',
    descriptionKey: 'about.values.innovation.description',
  },
  {
    id: 'customer',
    icon: LucideUsers.icon,
    titleKey: 'about.values.customer.title',
    descriptionKey: 'about.values.customer.description',
  },
];

@Component({
  selector: 'ahram-about',
  standalone: true,
  imports: [TranslocoDirective, ContactFormComponent, ScrollAnimateDirective, LucideZap, LucideEye, LucidePhone, LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  protected readonly values = VALUES;

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('seo.about.title'),
      description: this.transloco.translate('seo.about.description'),
      keywords: this.transloco.translate('seo.about.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/about`,
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('header.about'), url: `${environment.siteUrl}/${lang}/about` },
    ]));
  }
}
