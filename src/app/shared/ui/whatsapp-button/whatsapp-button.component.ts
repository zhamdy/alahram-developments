import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { SiteSettingsService } from '@core/services/site-settings.service';

@Component({
  selector: 'ahram-whatsapp-button',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './whatsapp-button.component.html',
  styleUrl: './whatsapp-button.component.scss',
})
export class WhatsappButtonComponent {
  private readonly siteSettings = inject(SiteSettingsService);

  protected buildHref(message: string): string {
    return this.siteSettings.whatsappMessageHref()(message);
  }
}
