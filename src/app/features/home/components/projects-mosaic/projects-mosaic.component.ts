import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideChevronRight } from '@lucide/angular';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { MOSAIC_TILES } from '../../data/home.data';

@Component({
  selector: 'ahram-projects-mosaic',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, TranslocoDirective, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, LucideChevronRight],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects-mosaic.component.html',
  styleUrl: './projects-mosaic.component.scss',
})
export class ProjectsMosaicComponent {
  protected readonly tiles = MOSAIC_TILES;
}
