import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService, I18nService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { InstallmentCalculatorComponent, ContactFormComponent } from '@shared/ui';
import { LocalizeRoutePipe } from '@shared/pipes';
import { RouterLink } from '@angular/router';
import { environment } from '@env';

interface PaymentPlan {
  readonly id: string;
  readonly iconPath: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly features: readonly string[];
}

const PAYMENT_PLANS: readonly PaymentPlan[] = [
  {
    id: 'cash',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    titleKey: 'paymentPlans.plans.cash.title',
    descriptionKey: 'paymentPlans.plans.cash.description',
    features: [
      'paymentPlans.plans.cash.feature1',
      'paymentPlans.plans.cash.feature2',
      'paymentPlans.plans.cash.feature3',
    ],
  },
  {
    id: 'installment',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    titleKey: 'paymentPlans.plans.installment.title',
    descriptionKey: 'paymentPlans.plans.installment.description',
    features: [
      'paymentPlans.plans.installment.feature1',
      'paymentPlans.plans.installment.feature2',
      'paymentPlans.plans.installment.feature3',
    ],
  },
  {
    id: 'bank',
    iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    titleKey: 'paymentPlans.plans.bank.title',
    descriptionKey: 'paymentPlans.plans.bank.description',
    features: [
      'paymentPlans.plans.bank.feature1',
      'paymentPlans.plans.bank.feature2',
      'paymentPlans.plans.bank.feature3',
    ],
  },
];

@Component({
  selector: 'ahram-payment',
  standalone: true,
  imports: [
    TranslocoDirective,
    InstallmentCalculatorComponent,
    ContactFormComponent,
    LocalizeRoutePipe,
    RouterLink,
    ScrollAnimateDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  protected readonly plans = PAYMENT_PLANS;

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('seo.paymentPlans.title'),
      description: this.transloco.translate('seo.paymentPlans.description'),
      keywords: this.transloco.translate('seo.paymentPlans.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/payment-plans`,
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('header.paymentPlans'), url: `${environment.siteUrl}/${lang}/payment-plans` },
    ]));
  }
}
