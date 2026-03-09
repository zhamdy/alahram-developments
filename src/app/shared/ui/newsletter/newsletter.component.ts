import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  private readonly http = inject(HttpClient);

  protected email = signal('');
  protected submitted = signal(false);
  protected loading = signal(false);
  protected error = signal('');

  protected onSubmit(): void {
    const value = this.email().trim();
    if (!value || !value.includes('@')) return;

    this.loading.set(true);
    this.error.set('');

    this.http.post<{ success: boolean }>('/api/newsletter', { email: value }).subscribe({
      next: () => {
        this.submitted.set(true);
        this.email.set('');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('error');
        this.loading.set(false);
      },
    });
  }

  protected reset(): void {
    this.submitted.set(false);
    this.error.set('');
  }
}
