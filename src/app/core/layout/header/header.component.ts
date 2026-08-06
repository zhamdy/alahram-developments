import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideSun, LucideMoon, LucideMenu, LucideX } from '@lucide/angular';
import { I18nService } from '../../services';
import { AppStore } from '../../state';
import { LocalizeRoutePipe } from '@shared/pipes';

@Component({
  selector: 'ahram-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoDirective, NgOptimizedImage, LocalizeRoutePipe, LucideSun, LucideMoon, LucideMenu, LucideX],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly appStore = inject(AppStore);
  private readonly router = inject(Router);

  protected readonly mobileMenuOpen = signal(false);

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected switchLocale(): void {
    const newUrl = this.i18n.switchLocaleUrl(this.router.url);
    this.router.navigateByUrl(newUrl);
  }
}
