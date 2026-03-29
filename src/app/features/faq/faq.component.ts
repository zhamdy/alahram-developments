import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  LucideIconData,
  LucideCircleHelp,
  LucideCircleDollarSign,
  LucideBuilding2,
  LucideFileText,
  LucideMapPin,
  LucideChevronDown,
  LucideDynamicIcon,
} from '@lucide/angular';
import { SeoService, I18nService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { ContactFormComponent } from '@shared/ui';
import { environment } from '@env';

interface FaqItem {
  readonly questionKey: string;
  readonly answerKey: string;
}

interface FaqCategory {
  readonly titleKey: string;
  readonly icon: LucideIconData;
  readonly items: readonly FaqItem[];
}

const FAQ_CATEGORIES: readonly FaqCategory[] = [
  {
    titleKey: 'faq.categories.general.title',
    icon: LucideCircleHelp.icon,
    items: [
      { questionKey: 'faq.categories.general.q1', answerKey: 'faq.categories.general.a1' },
      { questionKey: 'faq.categories.general.q2', answerKey: 'faq.categories.general.a2' },
      { questionKey: 'faq.categories.general.q3', answerKey: 'faq.categories.general.a3' },
      { questionKey: 'faq.categories.general.q4', answerKey: 'faq.categories.general.a4' },
    ],
  },
  {
    titleKey: 'faq.categories.payment.title',
    icon: LucideCircleDollarSign.icon,
    items: [
      { questionKey: 'faq.categories.payment.q1', answerKey: 'faq.categories.payment.a1' },
      { questionKey: 'faq.categories.payment.q2', answerKey: 'faq.categories.payment.a2' },
      { questionKey: 'faq.categories.payment.q3', answerKey: 'faq.categories.payment.a3' },
      { questionKey: 'faq.categories.payment.q4', answerKey: 'faq.categories.payment.a4' },
    ],
  },
  {
    titleKey: 'faq.categories.projects.title',
    icon: LucideBuilding2.icon,
    items: [
      { questionKey: 'faq.categories.projects.q1', answerKey: 'faq.categories.projects.a1' },
      { questionKey: 'faq.categories.projects.q2', answerKey: 'faq.categories.projects.a2' },
      { questionKey: 'faq.categories.projects.q3', answerKey: 'faq.categories.projects.a3' },
      { questionKey: 'faq.categories.projects.q4', answerKey: 'faq.categories.projects.a4' },
    ],
  },
  {
    titleKey: 'faq.categories.legal.title',
    icon: LucideFileText.icon,
    items: [
      { questionKey: 'faq.categories.legal.q1', answerKey: 'faq.categories.legal.a1' },
      { questionKey: 'faq.categories.legal.q2', answerKey: 'faq.categories.legal.a2' },
      { questionKey: 'faq.categories.legal.q3', answerKey: 'faq.categories.legal.a3' },
    ],
  },
  {
    titleKey: 'faq.categories.location.title',
    icon: LucideMapPin.icon,
    items: [
      { questionKey: 'faq.categories.location.q1', answerKey: 'faq.categories.location.a1' },
      { questionKey: 'faq.categories.location.q2', answerKey: 'faq.categories.location.a2' },
      { questionKey: 'faq.categories.location.q3', answerKey: 'faq.categories.location.a3' },
    ],
  },
];

@Component({
  selector: 'ahram-faq',
  standalone: true,
  imports: [TranslocoDirective, ContactFormComponent, ScrollAnimateDirective, LucideChevronDown, LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FaqComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  protected readonly categories = FAQ_CATEGORIES;
  protected readonly activeCategoryIndex = signal(0);

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('seo.faq.title'),
      description: this.transloco.translate('seo.faq.description'),
      keywords: this.transloco.translate('seo.faq.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/faq`,
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('header.faq'), url: `${environment.siteUrl}/${lang}/faq` },
    ]));

    this.addFaqSchema();
  }

  protected setCategory(index: number): void {
    this.activeCategoryIndex.set(index);
  }

  private addFaqSchema(): void {
    const allQuestions = FAQ_CATEGORIES.flatMap(cat =>
      cat.items.map(item => ({
        '@type': 'Question',
        name: this.transloco.translate(item.questionKey),
        acceptedAnswer: {
          '@type': 'Answer',
          text: this.transloco.translate(item.answerKey),
        },
      }))
    );

    this.seo.addJsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: allQuestions,
    });
  }
}
