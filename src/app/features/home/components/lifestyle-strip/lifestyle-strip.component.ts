import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideDynamicIcon } from '@lucide/angular';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LIFESTYLE_AMENITIES } from '../../data/home.data';

@Component({
  selector: 'ahram-lifestyle-strip',
  standalone: true,
  imports: [NgOptimizedImage, TranslocoDirective, ImageFallbackDirective, ScrollAnimateDirective, LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lifestyle-strip.component.html',
  styleUrl: './lifestyle-strip.component.scss',
})
export class LifestyleStripComponent {
  protected readonly amenities = LIFESTYLE_AMENITIES;
}
