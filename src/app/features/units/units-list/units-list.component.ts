import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService } from '@core/services/seo.service';
import { I18nService } from '@core/services';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { BreadcrumbsComponent, BreadcrumbItem, LoadingSpinnerComponent } from '@shared/ui';
import { environment } from '@env';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { UnitsApiService } from '../services/units-api.service';
import { ApiUnit } from '../models/unit-api.models';

const MAX_PRICE_CEILING = 2000000;
const MIN_PRICE_FLOOR = 500000;
const ROOM_OPTIONS = [0, 2, 3, 4];

@Component({
  selector: 'ahram-units-list',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoDirective,
    CurrencyPipe,
    BreadcrumbsComponent,
    LoadingSpinnerComponent,
    ImageFallbackDirective,
    LocalizeRoutePipe,
    ScrollAnimateDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './units-list.component.html',
  styleUrl: './units-list.component.scss',
})
export class UnitsListComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);
  private readonly unitsApi = inject(UnitsApiService);

  protected breadcrumbItems: BreadcrumbItem[] = [];
  protected readonly units = signal<ApiUnit[]>([]);
  protected readonly loading = signal(true);

  protected readonly roomOptions = ROOM_OPTIONS;
  protected readonly priceFloor = MIN_PRICE_FLOOR;
  protected readonly priceCeiling = MAX_PRICE_CEILING;

  protected readonly maxPrice = signal(MAX_PRICE_CEILING);
  protected readonly minRooms = signal(0);

  constructor() {
    // Re-fetch whenever the locale or a filter changes
    effect(() => {
      this.i18n.locale(); // track locale signal
      const maxPrice = this.maxPrice();
      const minRooms = this.minRooms();

      this.loading.set(true);
      this.unitsApi
        .getUnits({
          maxPrice,
          minRooms: minRooms || undefined,
        })
        .subscribe(data => {
          this.units.set(data);
          this.loading.set(false);
        });
    });
  }

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('units.seo.title'),
      description: this.transloco.translate('units.seo.description'),
      keywords: this.transloco.translate('units.seo.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/units/`,
    });
    this.breadcrumbItems = [
      { label: this.transloco.translate('header.home'), url: `/${lang}` },
      { label: this.transloco.translate('units.title') },
    ];
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('units.title'), url: `${environment.siteUrl}/${lang}/units` },
    ]));
  }

  protected onMaxPriceInput(value: string): void {
    this.maxPrice.set(Number(value));
  }

  protected setMinRooms(rooms: number): void {
    this.minRooms.set(rooms);
  }

  protected statusLabel(status: string): string {
    return this.transloco.translate(`units.status.${status}`);
  }
}
