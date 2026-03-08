import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { I18nService } from '../../services';
import { AppStore } from '../../state';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';

@Component({
  selector: 'ahram-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoDirective, ClickOutsideDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly appStore = inject(AppStore);

  protected readonly mobileMenuOpen = signal(false);

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
