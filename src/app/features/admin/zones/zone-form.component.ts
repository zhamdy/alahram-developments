import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../services/admin-api.service';
import { LucideArrowLeft, LucideUpload } from '@lucide/angular';

@Component({
  selector: 'ahram-zone-form',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideArrowLeft, LucideUpload],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zone-form.component.html',
  styleUrl: './zone-form.component.scss',
})
export class ZoneFormComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);

  id = input<string>();

  protected isEdit = signal(false);
  protected loading = signal(false);
  protected saving = signal(false);
  protected error = signal('');

  protected form = signal({
    slug: '',
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    imageUrl: '',
    sortOrder: 0,
  });

  protected imageFile: File | null = null;

  ngOnInit(): void {
    const zoneId = this.id();
    if (zoneId) {
      this.isEdit.set(true);
      this.loading.set(true);
      this.api.getZone(Number(zoneId)).subscribe({
        next: res => {
          if (res.success) {
            const z = res.data;
            this.form.set({
              slug: z.slug,
              nameAr: z.nameAr ?? (z as unknown as { name_ar: string }).name_ar ?? '',
              nameEn: z.nameEn ?? (z as unknown as { name_en: string }).name_en ?? '',
              descriptionAr: z.descriptionAr ?? (z as unknown as { description_ar: string }).description_ar ?? '',
              descriptionEn: z.descriptionEn ?? (z as unknown as { description_en: string }).description_en ?? '',
              imageUrl: z.imageUrl ?? (z as unknown as { image_url: string }).image_url ?? '',
              sortOrder: z.sortOrder ?? (z as unknown as { sort_order: number }).sort_order ?? 0,
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
    if (!f.slug || !f.nameAr || !f.nameEn) {
      this.error.set('Slug and names (AR/EN) are required');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const data = {
      slug: f.slug,
      nameAr: f.nameAr,
      nameEn: f.nameEn,
      descriptionAr: f.descriptionAr,
      descriptionEn: f.descriptionEn,
      sortOrder: f.sortOrder,
    };

    const zoneId = this.id();
    const request$ = zoneId
      ? this.api.updateZone(Number(zoneId), data)
      : this.api.createZone(data);

    request$.subscribe({
      next: res => {
        if (res.success && this.imageFile) {
          const id = zoneId ? Number(zoneId) : (res.data as { id: number }).id;
          this.api.uploadZoneImage(id, this.imageFile).subscribe({
            next: () => this.router.navigate(['/admin/zones']),
            error: () => this.router.navigate(['/admin/zones']),
          });
        } else {
          this.router.navigate(['/admin/zones']);
        }
      },
      error: err => {
        this.saving.set(false);
        this.error.set(err?.message || 'Failed to save zone');
      },
    });
  }
}
