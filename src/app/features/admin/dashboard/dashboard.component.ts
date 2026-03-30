import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService, DashboardStats } from '../services/admin-api.service';
import { LucideBuilding2, LucideImage, LucideMessageSquare, LucideUsers, LucideMap, LucideMailOpen } from '@lucide/angular';

@Component({
  selector: 'ahram-dashboard',
  standalone: true,
  imports: [RouterLink, LucideBuilding2, LucideImage, LucideMessageSquare, LucideUsers, LucideMap, LucideMailOpen],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  protected stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.api.getDashboard().subscribe(res => {
      if (res.success) this.stats.set(res.data);
    });
  }
}
