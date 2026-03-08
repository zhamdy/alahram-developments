import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { SeoService } from '@core/services';
import { createJsonLd, buildOrganizationSchema } from '@shared/helpers';
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

  ngOnInit(): void {
    this.seo.updateSeo({
      title: 'الرئيسية',
      description: 'الأهرام للتطوير والاستثمار العقاري — مشاريع سكنية متميزة في المنطقة الذهبية بمدينة السادات',
      keywords: 'عقارات, مدينة السادات, الأهرام, تطوير عقاري, شقق, المنطقة الذهبية',
      canonicalUrl: 'https://alahram-developments.com',
    });
    createJsonLd(buildOrganizationSchema());
  }
}
