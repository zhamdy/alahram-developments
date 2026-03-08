import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'ahram-gallery-preview',
  standalone: true,
  imports: [RouterLink, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery-preview.component.html',
  styleUrl: './gallery-preview.component.scss',
})
export class GalleryPreviewComponent {
  protected readonly placeholders = [
    { id: 1, from: 'oklch(0.72 0.15 55)', to: 'oklch(0.85 0.18 90)' },
    { id: 2, from: 'oklch(0.25 0.06 50)', to: 'oklch(0.40 0.08 55)' },
    { id: 3, from: 'oklch(0.60 0.12 40)', to: 'oklch(0.72 0.15 55)' },
    { id: 4, from: 'oklch(0.85 0.18 90)', to: 'oklch(0.72 0.15 55)' },
    { id: 5, from: 'oklch(0.35 0.08 55)', to: 'oklch(0.25 0.06 50)' },
    { id: 6, from: 'oklch(0.72 0.15 55)', to: 'oklch(0.60 0.12 40)' },
  ];
}
