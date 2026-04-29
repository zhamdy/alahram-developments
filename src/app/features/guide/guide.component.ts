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
  LucideMapPin,
  LucideArrowRight,
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

interface ZoneCard {
  readonly slug: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly highlight?: boolean;
}

const ZONES: readonly ZoneCard[] = [
  { slug: 'zone-21', nameKey: 'zones.zone21.name', descriptionKey: 'zones.zone21.description', highlight: true },
  { slug: 'zone-7-strip', nameKey: 'zones.zone7Strip.name', descriptionKey: 'zones.zone7Strip.description' },
  { slug: 'zone-7-homeland', nameKey: 'zones.zone7Homeland.name', descriptionKey: 'zones.zone7Homeland.description' },
  { slug: 'zone-14', nameKey: 'zones.zone14.name', descriptionKey: 'zones.zone14.description' },
  { slug: 'zone-22', nameKey: 'zones.zone22.name', descriptionKey: 'zones.zone22.description' },
  { slug: 'zone-29', nameKey: 'zones.zone29.name', descriptionKey: 'zones.zone29.description' },
  { slug: 'al-rawda', nameKey: 'zones.alRawda.name', descriptionKey: 'zones.alRawda.description' },
  { slug: 'zone-35', nameKey: 'zones.zone35.name', descriptionKey: 'zones.zone35.description' },
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
  imports: [TranslocoDirective, ContactFormComponent, RouterLink, LocalizeRoutePipe, ScrollAnimateDirective, LucideCheck, LucideDynamicIcon, LucideMapPin, LucideArrowRight],
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
  protected readonly zones = ZONES;

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
