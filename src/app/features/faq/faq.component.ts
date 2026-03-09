import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
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
  readonly iconPath: string;
  readonly items: readonly FaqItem[];
}

const FAQ_CATEGORIES: readonly FaqCategory[] = [
  {
    titleKey: 'faq.categories.general.title',
    iconPath: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    items: [
      { questionKey: 'faq.categories.general.q1', answerKey: 'faq.categories.general.a1' },
      { questionKey: 'faq.categories.general.q2', answerKey: 'faq.categories.general.a2' },
      { questionKey: 'faq.categories.general.q3', answerKey: 'faq.categories.general.a3' },
      { questionKey: 'faq.categories.general.q4', answerKey: 'faq.categories.general.a4' },
    ],
  },
  {
    titleKey: 'faq.categories.payment.title',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    items: [
      { questionKey: 'faq.categories.payment.q1', answerKey: 'faq.categories.payment.a1' },
      { questionKey: 'faq.categories.payment.q2', answerKey: 'faq.categories.payment.a2' },
      { questionKey: 'faq.categories.payment.q3', answerKey: 'faq.categories.payment.a3' },
      { questionKey: 'faq.categories.payment.q4', answerKey: 'faq.categories.payment.a4' },
    ],
  },
  {
    titleKey: 'faq.categories.projects.title',
    iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    items: [
      { questionKey: 'faq.categories.projects.q1', answerKey: 'faq.categories.projects.a1' },
      { questionKey: 'faq.categories.projects.q2', answerKey: 'faq.categories.projects.a2' },
      { questionKey: 'faq.categories.projects.q3', answerKey: 'faq.categories.projects.a3' },
      { questionKey: 'faq.categories.projects.q4', answerKey: 'faq.categories.projects.a4' },
    ],
  },
  {
    titleKey: 'faq.categories.legal.title',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    items: [
      { questionKey: 'faq.categories.legal.q1', answerKey: 'faq.categories.legal.a1' },
      { questionKey: 'faq.categories.legal.q2', answerKey: 'faq.categories.legal.a2' },
      { questionKey: 'faq.categories.legal.q3', answerKey: 'faq.categories.legal.a3' },
    ],
  },
  {
    titleKey: 'faq.categories.location.title',
    iconPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
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
  imports: [TranslocoDirective, ContactFormComponent, ScrollAnimateDirective],
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
