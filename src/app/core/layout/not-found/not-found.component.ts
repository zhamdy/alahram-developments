import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { SeoService } from '@core/services/seo.service';
import { LocalizeRoutePipe } from '@shared/pipes';

@Component({
  selector: 'ahram-not-found',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, LocalizeRoutePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.updateSeo({
      title: '404',
      robots: 'noindex, nofollow',
    });
  }
}
