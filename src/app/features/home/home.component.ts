import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SeoService } from '@core/services';
import { buildOrganizationSchema, buildBreadcrumbSchema } from '@shared/helpers';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { TrustBarComponent } from './components/trust-bar/trust-bar.component';
import { FeaturedProjectsComponent } from './components/featured-projects/featured-projects.component';
import { WhyUsComponent } from './components/why-us/why-us.component';
import { GalleryPreviewComponent } from './components/gallery-preview/gallery-preview.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { CtaBannerComponent } from './components/cta-banner/cta-banner.component';
import { LocationMapComponent } from './components/location-map/location-map.component';

@Component({
  selector: 'ahram-home',
  standalone: true,
  imports: [
    HeroSectionComponent,
    TrustBarComponent,
    FeaturedProjectsComponent,
    WhyUsComponent,
    GalleryPreviewComponent,
    TestimonialsComponent,
    CtaBannerComponent,
    LocationMapComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);

  ngOnInit(): void {
    this.seo.updateSeo({
      title: this.transloco.translate('seo.home.title'),
      description: this.transloco.translate('seo.home.description'),
      keywords: this.transloco.translate('seo.home.keywords'),
      canonicalUrl: 'https://alahram-developments.com',
    });
    this.seo.addJsonLd(buildOrganizationSchema());
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: 'https://alahram-developments.com' },
    ]));
  }
}
