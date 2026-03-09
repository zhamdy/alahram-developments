import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ImageFallbackDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { FEATURED_PROJECTS } from '../../data/home.data';

@Component({
  selector: 'ahram-featured-projects',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, NgOptimizedImage, ImageFallbackDirective, LocalizeRoutePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './featured-projects.component.html',
  styleUrl: './featured-projects.component.scss',
})
export class FeaturedProjectsComponent {
  protected readonly projects = FEATURED_PROJECTS;
}
