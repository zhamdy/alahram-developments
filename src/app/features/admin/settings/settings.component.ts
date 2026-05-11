import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../services/admin-api.service';
import { SiteSettingsService } from '@core/services';

@Component({
  selector: 'ahram-admin-settings',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
})
export class AdminSettingsComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly siteSettings = inject(SiteSettingsService);

  protected projectsCount = signal(0);
  protected unitsCount = signal(0);
  protected clientsCount = signal(0);

  protected saving = signal(false);
  protected saved = signal(false);
  protected error = signal('');

  ngOnInit(): void {
    this.api.getSettings().subscribe(res => {
      if (res.success) {
        this.projectsCount.set(res.data.projectsCount);
        this.unitsCount.set(res.data.unitsCount);
        this.clientsCount.set(res.data.clientsCount);
      }
    });
  }

  protected save(): void {
    this.saving.set(true);
    this.saved.set(false);
    this.error.set('');

    this.api.updateSettings({
      projectsCount: this.projectsCount(),
      unitsCount: this.unitsCount(),
      clientsCount: this.clientsCount(),
    }).subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success) {
          this.saved.set(true);
          this.siteSettings.settings.set({
            projectsCount: this.projectsCount(),
            unitsCount: this.unitsCount(),
            clientsCount: this.clientsCount(),
          });
          setTimeout(() => this.saved.set(false), 3000);
        } else {
          this.error.set('Failed to save settings.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Network error. Please try again.');
      },
    });
  }
}
