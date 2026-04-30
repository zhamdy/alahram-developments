import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LucideDownload, LucideMapPin } from '@lucide/angular';
import { I18nService, SeoService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { environment } from '@env';

interface SadatMapZone {
  readonly label: string;
  readonly pdfFileName: string;
}

const SADAT_MAP_ZONES: readonly SadatMapZone[] = [
  { label: 'مدينة السادات', pdfFileName: 'خريطة-مدينة-السادات' },
  { label: 'المنطقة الـ 21', pdfFileName: 'خريطة-المنطقة-21' },
  { label: 'المنطقة الـ 22', pdfFileName: 'خريطة-المنطقة-22' },
  { label: 'المنطقة الـ 24', pdfFileName: 'خريطة-المنطقة-24' },
  { label: 'المنطقة الـ 25', pdfFileName: 'خريطة-المنطقة-25' },
  { label: 'المنطقة الـ 25 (إسكان إجتماعي)', pdfFileName: 'خريطة-المنطقة-25-إسكان-إجتماعي' },
  { label: 'المنطقة الـ 26', pdfFileName: 'خريطة-المنطقة-26' },
  { label: 'المنطقة الـ 27', pdfFileName: 'خريطة-المنطقة-27' },
  { label: 'المنطقة الـ 28 أ', pdfFileName: 'خريطة-المنطقة-28أ' },
  { label: 'المنطقة الـ 28 ب', pdfFileName: 'خريطة-المنطقة-28ب' },
  { label: 'المنطقة الـ 29', pdfFileName: 'خريطة-المنطقة-29' },
  { label: 'المنطقة الـ 31', pdfFileName: 'خريطة-المنطقة-31' },
  { label: 'المنطقة الـ 32', pdfFileName: 'خريطة-المنطقة-32' },
  { label: 'المنطقة الـ 33', pdfFileName: 'خريطة-المنطقة-33' },
  { label: 'المنطقة الـ 34', pdfFileName: 'خريطة-المنطقة-34' },
  { label: 'المنطقة الـ 35', pdfFileName: 'خريطة-المنطقة-35' },
  { label: 'المنطقة الـ 36', pdfFileName: 'خريطة-المنطقة-36' },
  { label: 'الحي المتميز', pdfFileName: 'خريطة-الحي-المتميز' },
  { label: 'حي الروضة والريحان', pdfFileName: 'خريطة-الروضة-الريحان' },
  { label: 'حي الروضة', pdfFileName: 'خريطة-الروضة' },
  { label: 'حي الريحان', pdfFileName: 'خريطة-حي-الريحان' },
  { label: 'حي الزيتون', pdfFileName: 'خريطة-حي-الزيتون' },
  { label: 'الشريط المميز الـ 7', pdfFileName: 'خريطة-الشريط-المميز-الـ-7' },
  { label: 'الشريط المميز الـ 9', pdfFileName: 'خريطة-الشريط-المميز-الـ-9' },
  { label: 'حي الفردوس', pdfFileName: 'خريطة-حي-الفردوس' },
  { label: 'حي النخيل', pdfFileName: 'خريطة-حي-النخيل' },
  { label: 'حي النرجس والكوثر', pdfFileName: 'خريطة-حي-النرجس-والكوثر' },
];

@Component({
  selector: 'ahram-sadat-maps',
  imports: [TranslocoDirective, RouterLink, LocalizeRoutePipe, ScrollAnimateDirective, LucideMapPin, LucideDownload],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sadat-maps.component.html',
  styleUrl: './sadat-maps.component.scss',
})
export class SadatMapsComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

  protected readonly zones = SADAT_MAP_ZONES;

  ngOnInit(): void {
    const lang = this.i18n.locale();
    const canonicalPath = 'sadat-city-maps';

    this.seo.updateSeo({
      title: this.transloco.translate('seo.sadatMaps.title'),
      description: this.transloco.translate('seo.sadatMaps.description'),
      keywords: this.transloco.translate('seo.sadatMaps.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/${canonicalPath}`,
    });

    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      {
        name: this.transloco.translate('header.sadatMaps'),
        url: `${environment.siteUrl}/${lang}/${canonicalPath}`,
      },
    ]));
  }

  protected pdfUrl(fileName: string): string {
    return `/assets/maps-pdf/${fileName}.pdf`;
  }
}
