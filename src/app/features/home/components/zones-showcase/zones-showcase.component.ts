import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideChevronRight, LucideMapPin } from '@lucide/angular';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { ZONES } from '@features/projects/data/projects.data';

@Component({
  selector: 'ahram-zones-showcase',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, TranslocoDirective, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, LucideChevronRight, LucideMapPin],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zones-showcase.component.html',
  styleUrl: './zones-showcase.component.scss',
})
export class ZonesShowcaseComponent {
  protected readonly zones = ZONES;
}
