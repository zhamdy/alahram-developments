import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminGalleryImage } from '../services/admin-api.service';
import { LucideUpload, LucideTrash2 } from '@lucide/angular';

interface ProjectOption {
  id: number;
  nameEn: string;
  nameAr: string;
  slug: string;
}

@Component({
  selector: 'ahram-gallery-manage',
  standalone: true,
  imports: [FormsModule, LucideUpload, LucideTrash2],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery-manage.component.html',
  styleUrl: './gallery-manage.component.scss',
})
export class GalleryManageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  protected images = signal<AdminGalleryImage[]>([]);
  protected projects = signal<ProjectOption[]>([]);
  protected loading = signal(true);
  protected uploading = signal(false);

  protected selectedProjectId = 0;
  protected filterProjectId = 0;

  ngOnInit(): void {
    this.loadImages();
    this.loadProjects();
  }

  private loadProjects(): void {
    this.api.getProjects(1, 100).subscribe(res => {
      this.projects.set(res.data.map(p => ({ id: p.id, nameEn: p.nameEn, nameAr: p.nameAr, slug: p.slug })));
    });
  }

  protected loadImages(): void {
    this.loading.set(true);
    const projectId = this.filterProjectId || undefined;
    this.api.getGallery(projectId).subscribe({
      next: res => {
        this.images.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.selectedProjectId) return;

    this.uploading.set(true);
    const file = input.files[0];

    this.api.uploadGalleryImage(file, this.selectedProjectId).subscribe({
      next: () => {
        this.uploading.set(false);
        this.loadImages();
        input.value = '';
      },
      error: () => {
        this.uploading.set(false);
        input.value = '';
      },
    });
  }

  protected deleteImage(id: number): void {
    if (!confirm('Delete this image?')) return;
    this.api.deleteGalleryImage(id).subscribe(() => this.loadImages());
  }
}
