import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services';

@Component({
  selector: 'ahram-admin-login',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss',
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected error = signal('');
  protected loading = signal(false);

  protected onSubmit(): void {
    this.error.set('');
    this.loading.set(true);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: response => {
        this.loading.set(false);
        if (response.success) {
          this.router.navigate(['/admin']);
        }
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.message || 'Invalid email or password');
      },
    });
  }
}
