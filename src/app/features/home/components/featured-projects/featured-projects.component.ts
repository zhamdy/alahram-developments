import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { FEATURED_PROJECTS } from '../../data/home.data';

@Component({
  selector: 'ahram-featured-projects',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './featured-projects.component.html',
  styleUrl: './featured-projects.component.scss',
})
export class FeaturedProjectsComponent {
  protected readonly projects = FEATURED_PROJECTS;
}
