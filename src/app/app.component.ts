import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './core/layout/header/header.component';
import { FooterComponent } from './core/layout/footer/footer.component';
import { WhatsappButtonComponent } from '@shared/ui';
import { I18nService, PlatformService } from './core/services';
import { AppStore } from './core/state/app.store';

declare const gtag: (...args: unknown[]) => void;

@Component({
  selector: 'ahram-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, WhatsappButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly appStore = inject(AppStore);
  private readonly router = inject(Router);
  private readonly platform = inject(PlatformService);

  ngOnInit(): void {
    this.i18n.initialize();
    this.appStore.initialize();
    this.initAnalytics();
  }

  private initAnalytics(): void {
    this.platform.runInBrowser(() => {
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(event => {
          if (typeof gtag === 'function') {
            gtag('event', 'page_view', { page_path: event.urlAfterRedirects });
          }
        });
    });
  }
}
