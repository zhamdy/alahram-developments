import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LucideDownload, LucideMapPin } from '@lucide/angular';
import { I18nService, SeoService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { buildBreadcrumbSchema, buildSadatMapsSchema } from '@shared/helpers';
import { BreadcrumbItem, BreadcrumbsComponent } from '@shared/ui/breadcrumbs/breadcrumbs.component';
import { environment } from '@env';

interface SadatMapZone {
  readonly label: string;
  readonly pdfFileName: string;
}

const SADAT_MAP_ZONES: readonly SadatMapZone[] = [
  { label: 'مدينة السادات (الخريطة العامة)', pdfFileName: 'sadat-city' },
  { label: 'المنطقة الـ 5', pdfFileName: 'area-05' },
  { label: 'المنطقة الـ 6', pdfFileName: 'area-06' },
  { label: 'المنطقة الـ 7', pdfFileName: 'area-07' },
  { label: 'الشريط المميز الـ 7', pdfFileName: 'strip-07' },
  { label: 'المنطقة الـ 9', pdfFileName: 'area-09' },
  { label: 'الشريط المميز الـ 9', pdfFileName: 'strip-09' },
  { label: 'المنطقة الـ 12', pdfFileName: 'area-12' },
  { label: 'المنطقة الـ 13', pdfFileName: 'area-13' },
  { label: 'المنطقة الـ 14', pdfFileName: 'area-14' },
  { label: 'المنطقة الـ 15', pdfFileName: 'area-15' },
  { label: 'الشريط المميز الـ 15', pdfFileName: 'strip-15' },
  { label: 'المنطقة الـ 20', pdfFileName: 'area-20' },
  { label: 'المنطقة الـ 21', pdfFileName: 'area-21' },
  { label: 'المنطقة الـ 22', pdfFileName: 'area-22' },
  { label: 'المنطقة الـ 23', pdfFileName: 'area-23' },
  { label: 'المنطقة الـ 24', pdfFileName: 'area-24' },
  { label: 'المنطقة الـ 25', pdfFileName: 'area-25' },
  { label: 'المنطقة الـ 26', pdfFileName: 'area-26' },
  { label: 'المنطقة الـ 27', pdfFileName: 'area-27' },
  { label: 'المنطقة الـ 28 أ', pdfFileName: 'area-28a' },
  { label: 'المنطقة الـ 28 ب', pdfFileName: 'area-28b' },
  { label: 'المنطقة الـ 29', pdfFileName: 'area-29' },
  { label: 'المنطقة الـ 31', pdfFileName: 'area-31' },
  { label: 'المنطقة الـ 33', pdfFileName: 'area-33' },
  { label: 'المنطقة الـ 34', pdfFileName: 'area-34' },
  { label: 'المنطقة الـ 35', pdfFileName: 'area-35' },
  { label: 'المنطقة الـ 36', pdfFileName: 'area-36' },
  { label: 'الحي المتميز', pdfFileName: 'distinguished-district' },
  { label: 'حي الفردوس', pdfFileName: 'al-ferdous' },
  { label: 'حي الكوثر', pdfFileName: 'al-kawthar' },
  { label: 'حي النخيل', pdfFileName: 'al-nakheel' },
  { label: 'حي النرجس', pdfFileName: 'al-narjis' },
  { label: 'حي الروضة', pdfFileName: 'al-rawda' },
  { label: 'حي الريحان', pdfFileName: 'al-rayhan' },
  { label: 'حي الزيتون', pdfFileName: 'al-zaytoun' },
];

@Component({
  selector: 'ahram-sadat-maps',
  imports: [
    TranslocoDirective,
    RouterLink,
    LocalizeRoutePipe,
    ScrollAnimateDirective,
    LucideMapPin,
    LucideDownload,
    BreadcrumbsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sadat-maps.component.html',
  styleUrl: './sadat-maps.component.scss',
})
export class SadatMapsComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  protected readonly zones = SADAT_MAP_ZONES;
  protected breadcrumbItems: BreadcrumbItem[] = [];

  ngOnInit(): void {
    const lang = this.i18n.locale();
    const canonicalPath = 'sadat-city-maps';

    this.seo.updateSeo({
      title: this.transloco.translate('seo.sadatMaps.title'),
      description: this.transloco.translate('seo.sadatMaps.description'),
      canonicalUrl: `${environment.siteUrl}/${lang}/${canonicalPath}/`,
    });

    this.breadcrumbItems = [
      { label: this.transloco.translate('header.home'), url: `/${lang}` },
      { label: this.transloco.translate('header.sadatMaps') },
    ];

    this.seo.addJsonLd(
      buildBreadcrumbSchema([
        { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
        {
          name: this.transloco.translate('header.sadatMaps'),
          url: `${environment.siteUrl}/${lang}/${canonicalPath}`,
        },
      ]),
    );

    this.seo.addJsonLd(
      buildSadatMapsSchema(
        SADAT_MAP_ZONES,
        `${environment.siteUrl}/${lang}/${canonicalPath}`,
        `${environment.siteUrl}/assets/maps-pdf`,
      ),
    );
  }

  protected pdfUrl(fileName: string): string {
    return `/assets/maps-pdf/${fileName}.pdf`;
  }
}
