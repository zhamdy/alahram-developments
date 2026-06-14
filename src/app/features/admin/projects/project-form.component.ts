import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminApiService, AdminZone, AdminGalleryImage } from '../services/admin-api.service';
import { LucideArrowLeft, LucideUpload, LucideTrash2 } from '@lucide/angular';

const MAX_MASTER_PLAN = 2;

@Component({
  selector: 'ahram-project-form',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideArrowLeft, LucideUpload, LucideTrash2],
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

  // Master Plan images (stored as gallery_images with image_kind = 'design')
  protected readonly maxMasterPlan = MAX_MASTER_PLAN;
  protected masterPlanImages = signal<AdminGalleryImage[]>([]); // already saved (edit mode)
  protected pendingMasterPlanFiles = signal<File[]>([]); // queued before project exists (create mode)
  protected mpUploading = signal(false);
  protected masterPlanCount = computed(() => this.masterPlanImages().length + this.pendingMasterPlanFiles().length);
  protected canAddMasterPlan = computed(() => this.masterPlanCount() < MAX_MASTER_PLAN);

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
      this.loadMasterPlan(Number(projectId));
    }
  }

  protected onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.imageFile = input.files[0];
    }
  }

  private loadMasterPlan(projectId: number): void {
    this.api.getGallery(projectId, 'design').subscribe(res => {
      if (res.success) this.masterPlanImages.set(res.data);
    });
  }

  protected onMasterPlanSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file
    if (!file || !this.canAddMasterPlan()) return;

    const projectId = this.id();
    if (projectId) {
      // Edit mode: project exists, upload immediately
      this.mpUploading.set(true);
      this.api.uploadGalleryImage(file, Number(projectId), undefined, undefined, 'design').subscribe({
        next: () => {
          this.mpUploading.set(false);
          this.loadMasterPlan(Number(projectId));
        },
        error: () => this.mpUploading.set(false),
      });
    } else {
      // Create mode: queue until the project is created on submit
      this.pendingMasterPlanFiles.update(files => [...files, file]);
    }
  }

  protected removePendingMasterPlan(index: number): void {
    this.pendingMasterPlanFiles.update(files => files.filter((_, i) => i !== index));
  }

  protected deleteMasterPlan(id: number): void {
    if (!confirm('Delete this master plan image?')) return;
    this.api.deleteGalleryImage(id).subscribe(() => {
      const projectId = this.id();
      if (projectId) this.loadMasterPlan(Number(projectId));
    });
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
        if (!res.success) {
          this.saving.set(false);
          this.error.set('Failed to save project');
          return;
        }

        const id = projectId ? Number(projectId) : (res.data as { id: number }).id;
        const uploads = [];
        if (this.imageFile) uploads.push(this.api.uploadProjectImage(id, this.imageFile));
        for (const file of this.pendingMasterPlanFiles()) {
          uploads.push(this.api.uploadGalleryImage(file, id, undefined, undefined, 'design'));
        }

        if (uploads.length === 0) {
          this.router.navigate(['/admin/projects']);
          return;
        }
        forkJoin(uploads).subscribe({
          next: () => this.router.navigate(['/admin/projects']),
          error: () => this.router.navigate(['/admin/projects']),
        });
      },
      error: err => {
        this.saving.set(false);
        this.error.set(err?.message || 'Failed to save project');
      },
    });
  }
}
