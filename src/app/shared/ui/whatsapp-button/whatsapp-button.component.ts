import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { SOCIAL_LINKS } from '@core/config/social.config';

@Component({
  selector: 'ahram-whatsapp-button',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './whatsapp-button.component.html',
  styleUrl: './whatsapp-button.component.scss',
})
export class WhatsappButtonComponent {
  protected readonly whatsappBase = SOCIAL_LINKS.whatsappHref;

  protected buildHref(message: string): string {
    return `${this.whatsappBase}?text=${encodeURIComponent(message)}`;
  }
}
