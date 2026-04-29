import { Directive, HostListener, input } from '@angular/core';

@Directive({
  selector: 'img[ahramFallback]',
  standalone: true,
})
export class ImageFallbackDirective {
  ahramFallback = input<string>('assets/images/logo-transparent.png');

  @HostListener('error', ['$event'])
  onError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const fallback = this.ahramFallback();
    if (img.src !== fallback && !img.src.endsWith(fallback)) {
      img.src = fallback;
    }
  }
}
