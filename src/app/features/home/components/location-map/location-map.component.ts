import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideMapPin, LucideNavigation, LucidePhone } from '@lucide/angular';
import { PlatformService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';

@Component({
  selector: 'ahram-location-map',
  standalone: true,
  imports: [TranslocoDirective, ScrollAnimateDirective, LucideMapPin, LucideNavigation, LucidePhone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './location-map.component.html',
  styleUrl: './location-map.component.scss',
})
export class LocationMapComponent {
  protected readonly platform = inject(PlatformService);
}
