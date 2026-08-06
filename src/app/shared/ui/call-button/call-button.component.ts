import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { SiteSettingsService } from '@core/services/site-settings.service';

@Component({
  selector: 'ahram-call-button',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './call-button.component.html',
  styleUrl: './call-button.component.scss',
})
export class CallButtonComponent {
  protected readonly siteSettings = inject(SiteSettingsService);
}
