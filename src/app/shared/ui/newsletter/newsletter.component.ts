import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'ahram-newsletter',
  standalone: true,
  imports: [FormsModule, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './newsletter.component.html',
  styleUrl: './newsletter.component.scss',
})
export class NewsletterComponent {
  protected email = signal('');
  protected submitted = signal(false);

  protected onSubmit(): void {
    const value = this.email().trim();
    if (!value || !value.includes('@')) return;
    this.submitted.set(true);
    this.email.set('');
  }

  protected reset(): void {
    this.submitted.set(false);
  }
}
