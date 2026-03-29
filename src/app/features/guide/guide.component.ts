import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import {
  LucideIconData,
  LucideMap,
  LucideGraduationCap,
  LucideHeart,
  LucideShoppingBag,
  LucideCheck,
  LucideDynamicIcon,
} from '@lucide/angular';
import { SeoService, I18nService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { ContactFormComponent } from '@shared/ui';
import { LocalizeRoutePipe } from '@shared/pipes';
import { environment } from '@env';

interface GuideSection {
  readonly id: string;
  readonly icon: LucideIconData;
  readonly titleKey: string;
  readonly contentKey: string;
}

const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    id: 'infrastructure',
    icon: LucideMap.icon,
    titleKey: 'sadatGuide.sections.infrastructure.title',
    contentKey: 'sadatGuide.sections.infrastructure.content',
  },
  {
    id: 'education',
    icon: LucideGraduationCap.icon,
    titleKey: 'sadatGuide.sections.education.title',
    contentKey: 'sadatGuide.sections.education.content',
  },
  {
    id: 'healthcare',
    icon: LucideHeart.icon,
    titleKey: 'sadatGuide.sections.healthcare.title',
    contentKey: 'sadatGuide.sections.healthcare.content',
  },
  {
    id: 'commercial',
    icon: LucideShoppingBag.icon,
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
  imports: [TranslocoDirective, ContactFormComponent, RouterLink, LocalizeRoutePipe, ScrollAnimateDirective, LucideCheck, LucideDynamicIcon],
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
