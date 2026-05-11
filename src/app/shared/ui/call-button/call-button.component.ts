import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { SOCIAL_LINKS } from '@core/config/social.config';

@Component({
  selector: 'ahram-call-button',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './call-button.component.html',
  styleUrl: './call-button.component.scss',
})
export class CallButtonComponent {
  protected readonly phoneHref = SOCIAL_LINKS.phoneHref;
}
