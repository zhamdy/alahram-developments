import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ImageFallbackDirective } from '@shared/directives';

@Component({
  selector: 'ahram-gallery-preview',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, NgOptimizedImage, ImageFallbackDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery-preview.component.html',
  styleUrl: './gallery-preview.component.scss',
})
export class GalleryPreviewComponent {
  protected readonly galleryImages = [
    { id: 1, src: 'assets/images/projects/project-865-gallery-1.jpg', alt: 'gallery.alt.project865' },
    { id: 2, src: 'assets/images/projects/project-865-gallery-2.jpg', alt: 'gallery.alt.project865' },
    { id: 3, src: 'assets/images/projects/project-868-gallery-1.jpg', alt: 'gallery.alt.project868' },
    { id: 4, src: 'assets/images/projects/project-868-gallery-2.jpg', alt: 'gallery.alt.project868' },
    { id: 5, src: 'assets/images/projects/project-76-gallery-1.jpg', alt: 'gallery.alt.project76' },
    { id: 6, src: 'assets/images/projects/project-76-gallery-2.jpg', alt: 'gallery.alt.project76' },
  ];
}
