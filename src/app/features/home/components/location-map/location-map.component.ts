import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideMapPin } from '@lucide/angular';
import { PlatformService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';

@Component({
  selector: 'ahram-location-map',
  standalone: true,
  imports: [TranslocoDirective, ScrollAnimateDirective, LucideMapPin],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './location-map.component.html',
  styleUrl: './location-map.component.scss',
})
export class LocationMapComponent {
  protected readonly platform = inject(PlatformService);
}
