import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LocalizeRoutePipe } from '@shared/pipes';

@Component({
  selector: 'ahram-hero-section',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, NgOptimizedImage, LocalizeRoutePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent {}
