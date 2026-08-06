import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideChevronRight } from '@lucide/angular';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { BRAND_STORY_HIGHLIGHTS } from '../../data/home.data';

@Component({
  selector: 'ahram-brand-story',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, TranslocoDirective, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, LucideChevronRight],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-story.component.html',
  styleUrl: './brand-story.component.scss',
})
export class BrandStoryComponent {
  protected readonly highlights = BRAND_STORY_HIGHLIGHTS;
}
