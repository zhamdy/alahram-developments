import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService, AdminProject } from '../services/admin-api.service';
import { LucidePlus, LucideEdit, LucideTrash2 } from '@lucide/angular';

@Component({
  selector: 'ahram-project-list',
  standalone: true,
  imports: [RouterLink, LucidePlus, LucideEdit, LucideTrash2],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  protected projects = signal<AdminProject[]>([]);
  protected loading = signal(true);
  protected page = signal(1);
  protected totalPages = signal(1);

  ngOnInit(): void {
    this.loadProjects();
  }

  protected loadProjects(): void {
    this.loading.set(true);
    this.api.getProjects(this.page(), 50).subscribe({
      next: res => {
        this.projects.set(res.data);
        this.totalPages.set(res.meta.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected deleteProject(id: number, name: string): void {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    this.api.deleteProject(id).subscribe(() => this.loadProjects());
  }
}
