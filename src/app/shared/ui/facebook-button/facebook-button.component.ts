import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { SOCIAL_LINKS } from '@core/config/social.config';

@Component({
  selector: 'ahram-facebook-button',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './facebook-button.component.html',
  styleUrl: './facebook-button.component.scss',
})
export class FacebookButtonComponent {
  protected readonly facebookHref = SOCIAL_LINKS.facebook;
}
