import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ContactFormComponent } from '@shared/ui';

@Component({
  selector: 'ahram-cta-banner',
  standalone: true,
  imports: [TranslocoDirective, ContactFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cta-banner.component.html',
  styleUrl: './cta-banner.component.scss',
})
export class CtaBannerComponent {}
