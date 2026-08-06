import { Directive, ElementRef, inject, output } from '@angular/core';
import { PlatformService } from '../../core/services';

@Directive({
  selector: '[ahramClickOutside]',
  standalone: true,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ClickOutsideDirective {
  private readonly el = inject(ElementRef);
  private readonly platform = inject(PlatformService);

  readonly ahramClickOutside = output<void>();

  protected onDocumentClick(event: Event): void {
    if (!this.platform.isBrowser) return;
    if (!this.el.nativeElement.contains(event.target)) {
      this.ahramClickOutside.emit();
    }
  }
}
