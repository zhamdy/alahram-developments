import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideDynamicIcon } from '@lucide/angular';
import { ScrollAnimateDirective } from '@shared/directives';
import { VALUE_PILLARS } from '../../data/home.data';

@Component({
  selector: 'ahram-why-us',
  standalone: true,
  imports: [TranslocoDirective, ScrollAnimateDirective, LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './why-us.component.html',
  styleUrl: './why-us.component.scss',
})
export class WhyUsComponent {
  protected readonly pillars = VALUE_PILLARS;
}
