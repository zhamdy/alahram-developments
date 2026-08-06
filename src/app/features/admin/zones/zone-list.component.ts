import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService, AdminZone } from '../services/admin-api.service';
import { LucidePlus, LucideEdit, LucideTrash2 } from '@lucide/angular';

@Component({
  selector: 'ahram-zone-list',
  standalone: true,
  imports: [RouterLink, LucidePlus, LucideEdit, LucideTrash2],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zone-list.component.html',
  styleUrl: './zone-list.component.scss',
})
export class ZoneListComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  protected zones = signal<AdminZone[]>([]);
  protected loading = signal(true);

  ngOnInit(): void {
    this.loadZones();
  }

  protected loadZones(): void {
    this.loading.set(true);
    this.api.getZones().subscribe({
      next: res => {
        if (res.success) this.zones.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected deleteZone(id: number, name: string): void {
    if (!confirm(`Delete zone "${name}"? All projects in this zone will also be deleted.`)) return;
    this.api.deleteZone(id).subscribe(() => this.loadZones());
  }
}
