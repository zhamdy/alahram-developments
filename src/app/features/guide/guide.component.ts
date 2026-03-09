import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { SeoService, I18nService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { ContactFormComponent } from '@shared/ui';
import { LocalizeRoutePipe } from '@shared/pipes';
import { environment } from '@env';

interface GuideSection {
  readonly id: string;
  readonly iconPath: string;
  readonly titleKey: string;
  readonly contentKey: string;
}

const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    id: 'infrastructure',
    iconPath: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    titleKey: 'sadatGuide.sections.infrastructure.title',
    contentKey: 'sadatGuide.sections.infrastructure.content',
  },
  {
    id: 'education',
    iconPath: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
    titleKey: 'sadatGuide.sections.education.title',
    contentKey: 'sadatGuide.sections.education.content',
  },
  {
    id: 'healthcare',
    iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    titleKey: 'sadatGuide.sections.healthcare.title',
    contentKey: 'sadatGuide.sections.healthcare.content',
  },
  {
    id: 'commercial',
    iconPath: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    titleKey: 'sadatGuide.sections.commercial.title',
    contentKey: 'sadatGuide.sections.commercial.content',
  },
];

interface PriceComparison {
  readonly cityKey: string;
  readonly priceKey: string;
  readonly highlight?: boolean;
}

const PRICE_COMPARISONS: readonly PriceComparison[] = [
  { cityKey: 'sadatGuide.priceComparison.sadatCity', priceKey: 'sadatGuide.priceComparison.sadatCityPrice', highlight: true },
  { cityKey: 'sadatGuide.priceComparison.october', priceKey: 'sadatGuide.priceComparison.octoberPrice' },
  { cityKey: 'sadatGuide.priceComparison.newCairo', priceKey: 'sadatGuide.priceComparison.newCairoPrice' },
  { cityKey: 'sadatGuide.priceComparison.newCapital', priceKey: 'sadatGuide.priceComparison.newCapitalPrice' },
];

@Component({
  selector: 'ahram-guide',
  standalone: true,
  imports: [TranslocoDirective, ContactFormComponent, RouterLink, LocalizeRoutePipe, ScrollAnimateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guide.component.html',
  styleUrl: './guide.component.scss',
})
export class GuideComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  protected readonly sections = GUIDE_SECTIONS;
  protected readonly priceComparisons = PRICE_COMPARISONS;

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('seo.sadatGuide.title'),
      description: this.transloco.translate('seo.sadatGuide.description'),
      keywords: this.transloco.translate('seo.sadatGuide.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/sadat-guide`,
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('header.sadatGuide'), url: `${environment.siteUrl}/${lang}/sadat-guide` },
    ]));
  }
}
