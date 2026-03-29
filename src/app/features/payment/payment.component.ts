import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  LucideIconData,
  LucideCircleDollarSign,
  LucideClipboardList,
  LucideBuilding2,
  LucideCheck,
  LucideChevronDown,
  LucideCreditCard,
  LucideDynamicIcon,
} from '@lucide/angular';
import { SeoService, I18nService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { InstallmentCalculatorComponent, ContactFormComponent } from '@shared/ui';
import { LocalizeRoutePipe } from '@shared/pipes';
import { RouterLink } from '@angular/router';
import { environment } from '@env';

interface PaymentPlan {
  readonly id: string;
  readonly icon: LucideIconData;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly features: readonly string[];
}

const PAYMENT_PLANS: readonly PaymentPlan[] = [
  {
    id: 'cash',
    icon: LucideCircleDollarSign.icon,
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
    icon: LucideClipboardList.icon,
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
    icon: LucideBuilding2.icon,
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
    LucideCheck,
    LucideChevronDown,
    LucideBuilding2,
    LucideCreditCard,
    LucideDynamicIcon,
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
