import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminApiService, AdminZone } from '../services/admin-api.service';
import { LucideArrowLeft, LucideUpload } from '@lucide/angular';

@Component({
  selector: 'ahram-project-form',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideArrowLeft, LucideUpload],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.scss',
})
export class ProjectFormComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);

  id = input<string>();

  protected isEdit = signal(false);
  protected loading = signal(false);
  protected saving = signal(false);
  protected zones = signal<AdminZone[]>([]);
  protected error = signal('');

  // Form fields
  protected form = signal({
    slug: '',
    zoneId: 0,
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    statusDescriptionAr: '',
    statusDescriptionEn: '',
    locationAr: '',
    locationEn: '',
    statusAr: '',
    statusEn: '',
    imageUrl: '',
    progress: 0,
    mapEmbedUrl: '',
    isFeatured: false,
    sortOrder: 0,
    lastUpdatedAt: new Date().toISOString().split('T')[0],
  });

  protected imageFile: File | null = null;

  ngOnInit(): void {
    this.api.getZones().subscribe(res => {
      if (res.success) this.zones.set(res.data);
    });

    const projectId = this.id();
    if (projectId) {
      this.isEdit.set(true);
      this.loading.set(true);
      this.api.getProject(Number(projectId)).subscribe({
        next: res => {
          if (res.success) {
            const p = res.data;
            this.form.set({
              slug: p.slug,
              zoneId: p.zoneId ?? (p as unknown as { zone_id: number }).zone_id,
              nameAr: p.nameAr ?? (p as unknown as { name_ar: string }).name_ar,
              nameEn: p.nameEn ?? (p as unknown as { name_en: string }).name_en,
              descriptionAr: p.descriptionAr ?? (p as unknown as { description_ar: string }).description_ar ?? '',
              descriptionEn: p.descriptionEn ?? (p as unknown as { description_en: string }).description_en ?? '',
              statusDescriptionAr: p.statusDescriptionAr ?? (p as unknown as { status_description_ar: string }).status_description_ar ?? '',
              statusDescriptionEn: p.statusDescriptionEn ?? (p as unknown as { status_description_en: string }).status_description_en ?? '',
              locationAr: p.locationAr ?? (p as unknown as { location_ar: string }).location_ar ?? '',
              locationEn: p.locationEn ?? (p as unknown as { location_en: string }).location_en ?? '',
              statusAr: p.statusAr ?? (p as unknown as { status_ar: string }).status_ar ?? '',
              statusEn: p.statusEn ?? (p as unknown as { status_en: string }).status_en ?? '',
              imageUrl: p.imageUrl ?? (p as unknown as { image_url: string }).image_url ?? '',
              progress: p.progress ?? 0,
              mapEmbedUrl: p.mapEmbedUrl ?? (p as unknown as { map_embed_url: string }).map_embed_url ?? '',
              isFeatured: !!(p.isFeatured ?? (p as unknown as { is_featured: number }).is_featured),
              sortOrder: p.sortOrder ?? (p as unknown as { sort_order: number }).sort_order ?? 0,
              lastUpdatedAt: p.lastUpdatedAt ?? (p as unknown as { last_updated_at: string }).last_updated_at ?? '',
            });
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  protected onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.imageFile = input.files[0];
    }
  }

  protected onSubmit(): void {
    const f = this.form();
    if (!f.slug || !f.nameAr || !f.nameEn || !f.zoneId) {
      this.error.set('Slug, zone, and names (AR/EN) are required');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const data = {
      slug: f.slug,
      zoneId: f.zoneId,
      nameAr: f.nameAr,
      nameEn: f.nameEn,
      descriptionAr: f.descriptionAr,
      descriptionEn: f.descriptionEn,
      statusDescriptionAr: f.statusDescriptionAr,
      statusDescriptionEn: f.statusDescriptionEn,
      locationAr: f.locationAr,
      locationEn: f.locationEn,
      statusAr: f.statusAr,
      statusEn: f.statusEn,
      imageUrl: f.imageUrl,
      progress: f.progress,
      mapEmbedUrl: f.mapEmbedUrl,
      isFeatured: f.isFeatured ? 1 : 0,
      sortOrder: f.sortOrder,
      lastUpdatedAt: f.lastUpdatedAt,
    };

    const projectId = this.id();
    const request$ = projectId
      ? this.api.updateProject(Number(projectId), data)
      : this.api.createProject(data);

    request$.subscribe({
      next: res => {
        if (res.success && this.imageFile) {
          const id = projectId ? Number(projectId) : (res.data as { id: number }).id;
          this.api.uploadProjectImage(id, this.imageFile).subscribe({
            next: () => this.router.navigate(['/admin/projects']),
            error: () => this.router.navigate(['/admin/projects']),
          });
        } else {
          this.router.navigate(['/admin/projects']);
        }
      },
      error: err => {
        this.saving.set(false);
        this.error.set(err?.message || 'Failed to save project');
      },
    });
  }
}
