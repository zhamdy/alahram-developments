import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideCheck } from '@lucide/angular';
import { CustomValidators } from '@shared/validators/custom-validators';

@Component({
  selector: 'ahram-contact-form',
  standalone: true,
  imports: [TranslocoDirective, ReactiveFormsModule, LucideCheck],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.scss',
})
export class ContactFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  protected readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly contactForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required, CustomValidators.egyptianPhone]],
    message: ['', [Validators.required]],
  });

  protected onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.http.post<{ success: boolean }>('/api/contact', this.contactForm.getRawValue()).subscribe({
      next: () => {
        this.submitted.set(true);
        this.contactForm.reset();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('error');
        this.loading.set(false);
      },
    });
  }
}
