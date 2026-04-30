import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SeoService, I18nService } from '@core/services';
import { buildOrganizationSchema } from '@shared/helpers';
import { environment } from '@env';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { TrustBarComponent } from './components/trust-bar/trust-bar.component';
import { WhyUsComponent } from './components/why-us/why-us.component';
import { GalleryPreviewComponent } from './components/gallery-preview/gallery-preview.component';
import { CtaBannerComponent } from './components/cta-banner/cta-banner.component';
import { LocationMapComponent } from './components/location-map/location-map.component';
import { BrandStoryComponent } from './components/brand-story/brand-story.component';
import { ZonesShowcaseComponent } from './components/zones-showcase/zones-showcase.component';
import { ProjectsMosaicComponent } from './components/projects-mosaic/projects-mosaic.component';
import { LifestyleStripComponent } from './components/lifestyle-strip/lifestyle-strip.component';

@Component({
  selector: 'ahram-home',
  standalone: true,
  imports: [
    HeroSectionComponent,
    TrustBarComponent,
    BrandStoryComponent,
    WhyUsComponent,
    GalleryPreviewComponent,
    CtaBannerComponent,
    LocationMapComponent,
    ZonesShowcaseComponent,
    ProjectsMosaicComponent,
    LifestyleStripComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('seo.home.title'),
      description: this.transloco.translate('seo.home.description'),
      keywords: this.transloco.translate('seo.home.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}`,
    });
    this.seo.addJsonLd(buildOrganizationSchema());
  }
}
