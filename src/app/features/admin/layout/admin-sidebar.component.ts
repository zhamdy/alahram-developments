import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services';
import { LucideLayoutDashboard, LucideBuilding2, LucideMap, LucideImage, LucideMessageSquare, LucideLogOut, LucideMenu, LucideX } from '@lucide/angular';

@Component({
  selector: 'ahram-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideLayoutDashboard, LucideBuilding2, LucideMap, LucideImage, LucideMessageSquare, LucideLogOut, LucideMenu, LucideX],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent {
  private readonly auth = inject(AuthService);

  protected mobileOpen = signal(false);

  protected readonly navItems = [
    { path: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
    { path: '/admin/projects', label: 'Projects', icon: 'projects', exact: false },
    { path: '/admin/zones', label: 'Zones', icon: 'zones', exact: false },
    { path: '/admin/gallery', label: 'Gallery', icon: 'gallery', exact: false },
    { path: '/admin/contacts', label: 'Contacts', icon: 'contacts', exact: false },
  ];

  protected toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }

  protected logout(): void {
    this.auth.logout();
  }
}
