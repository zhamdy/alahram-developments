import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService, I18nService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { ContactFormComponent } from '@shared/ui';
import { LocalizeRoutePipe } from '@shared/pipes';
import { environment } from '@env';

interface InvestmentStat {
  readonly value: string;
  readonly labelKey: string;
}

interface InvestmentReason {
  readonly iconPath: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
}

const STATS: readonly InvestmentStat[] = [
  { value: '33%', labelKey: 'investors.stats.annualGrowth' },
  { value: '15-20%', labelKey: 'investors.stats.rentalYield' },
  { value: '75%', labelKey: 'investors.stats.priceDifference' },
  { value: '5B+', labelKey: 'investors.stats.privateInvestment' },
];

const REASONS: readonly InvestmentReason[] = [
  {
    iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    titleKey: 'investors.reasons.appreciation.title',
    descriptionKey: 'investors.reasons.appreciation.description',
  },
  {
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    titleKey: 'investors.reasons.rentalIncome.title',
    descriptionKey: 'investors.reasons.rentalIncome.description',
  },
  {
    iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    titleKey: 'investors.reasons.infrastructure.title',
    descriptionKey: 'investors.reasons.infrastructure.description',
  },
  {
    iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    titleKey: 'investors.reasons.security.title',
    descriptionKey: 'investors.reasons.security.description',
  },
  {
    iconPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    titleKey: 'investors.reasons.location.title',
    descriptionKey: 'investors.reasons.location.description',
  },
  {
    iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    titleKey: 'investors.reasons.flexiblePayment.title',
    descriptionKey: 'investors.reasons.flexiblePayment.description',
  },
];

@Component({
  selector: 'ahram-investors',
  standalone: true,
  imports: [TranslocoDirective, RouterLink, ContactFormComponent, LocalizeRoutePipe, ScrollAnimateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './investors.component.html',
  styleUrl: './investors.component.scss',
})
export class InvestorsComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  protected readonly stats = STATS;
  protected readonly reasons = REASONS;

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('seo.investors.title'),
      description: this.transloco.translate('seo.investors.description'),
      keywords: this.transloco.translate('seo.investors.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/investors`,
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('header.investors'), url: `${environment.siteUrl}/${lang}/investors` },
    ]));
  }
}
