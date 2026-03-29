import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  LucideIconData,
  LucideTrendingUp,
  LucideCircleDollarSign,
  LucideBuilding2,
  LucideShieldCheck,
  LucideMapPin,
  LucideCreditCard,
  LucideCheck,
  LucideDynamicIcon,
} from '@lucide/angular';
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
  readonly icon: LucideIconData;
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
    icon: LucideTrendingUp.icon,
    titleKey: 'investors.reasons.appreciation.title',
    descriptionKey: 'investors.reasons.appreciation.description',
  },
  {
    icon: LucideCircleDollarSign.icon,
    titleKey: 'investors.reasons.rentalIncome.title',
    descriptionKey: 'investors.reasons.rentalIncome.description',
  },
  {
    icon: LucideBuilding2.icon,
    titleKey: 'investors.reasons.infrastructure.title',
    descriptionKey: 'investors.reasons.infrastructure.description',
  },
  {
    icon: LucideShieldCheck.icon,
    titleKey: 'investors.reasons.security.title',
    descriptionKey: 'investors.reasons.security.description',
  },
  {
    icon: LucideMapPin.icon,
    titleKey: 'investors.reasons.location.title',
    descriptionKey: 'investors.reasons.location.description',
  },
  {
    icon: LucideCreditCard.icon,
    titleKey: 'investors.reasons.flexiblePayment.title',
    descriptionKey: 'investors.reasons.flexiblePayment.description',
  },
];

@Component({
  selector: 'ahram-investors',
  standalone: true,
  imports: [TranslocoDirective, RouterLink, ContactFormComponent, LocalizeRoutePipe, ScrollAnimateDirective, LucideCheck, LucideDynamicIcon],
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
