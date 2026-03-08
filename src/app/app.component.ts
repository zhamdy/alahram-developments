import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/layout/header/header.component';
import { FooterComponent } from './core/layout/footer/footer.component';
import { WhatsappButtonComponent } from '@shared/ui';
import { I18nService } from './core/services';
import { AppStore } from './core/state/app.store';

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

  ngOnInit(): void {
    this.i18n.initialize();
    this.appStore.initialize();
  }
}
