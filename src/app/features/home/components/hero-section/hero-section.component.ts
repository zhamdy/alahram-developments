import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';

@Component({
  selector: 'ahram-hero-section',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, LocalizeRoutePipe, ScrollAnimateDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent {}
