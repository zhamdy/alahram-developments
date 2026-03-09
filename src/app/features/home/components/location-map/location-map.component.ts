import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { PlatformService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';

@Component({
  selector: 'ahram-location-map',
  standalone: true,
  imports: [TranslocoDirective, ScrollAnimateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './location-map.component.html',
  styleUrl: './location-map.component.scss',
})
export class LocationMapComponent {
  protected readonly platform = inject(PlatformService);
}
