import { Directive, ElementRef, inject, input, effect } from '@angular/core';
import { PlatformService } from '../../core/services';

@Directive({
  selector: 'img[ahramLazyImage]',
  standalone: true,
})
export class LazyImageDirective {
  private readonly el = inject(ElementRef<HTMLImageElement>);
  private readonly platform = inject(PlatformService);

  readonly ahramLazyImage = input.required<string>();
  readonly placeholder = input('/assets/images/placeholder.webp');

  constructor() {
    effect(() => {
      const src = this.ahramLazyImage();
      if (!this.platform.isBrowser) {
        this.el.nativeElement.src = src;
        return;
      }

      this.el.nativeElement.src = this.placeholder();

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.el.nativeElement.src = src;
              observer.unobserve(this.el.nativeElement);
            }
          });
        });
        observer.observe(this.el.nativeElement);
      } else {
        this.el.nativeElement.src = src;
      }
    });
  }
}
