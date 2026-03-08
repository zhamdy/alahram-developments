import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'ahram-whatsapp-button',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './whatsapp-button.component.html',
  styleUrl: './whatsapp-button.component.scss',
})
export class WhatsappButtonComponent {
  protected encodeMessage(message: string): string {
    return encodeURIComponent(message);
  }
}
