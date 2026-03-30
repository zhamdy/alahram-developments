import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './core/layout/header/header.component';
import { FooterComponent } from './core/layout/footer/footer.component';
import { WhatsappButtonComponent } from '@shared/ui';
import { PlatformService } from './core/services';
import { AppStore } from './core/state/app.store';
import { toSignal } from '@angular/core/rxjs-interop';

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
  private readonly appStore = inject(AppStore);
  private readonly router = inject(Router);
  private readonly platform = inject(PlatformService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly routerEvents = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    ),
  );

  protected readonly isAdminRoute = computed(() => {
    const event = this.routerEvents();
    return event?.urlAfterRedirects?.startsWith('/admin') ?? this.router.url.startsWith('/admin');
  });

  ngOnInit(): void {
    this.appStore.initialize();
    this.initAnalytics();
  }

  private initAnalytics(): void {
    this.platform.runInBrowser(() => {
      this.router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(event => {
          if (typeof gtag === 'function') {
            gtag('event', 'page_view', { page_path: event.urlAfterRedirects });
          }
        });
    });
  }
}
