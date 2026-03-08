import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { SeoService } from '@core/services/seo.service';
import { ContactFormComponent, InstallmentCalculatorComponent } from '@shared/ui';
import { createJsonLd, buildProjectSchema, buildBreadcrumbSchema } from '@shared/helpers';
import { PROJECTS } from '../data/projects.data';

@Component({
  selector: 'ahram-project-detail',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, ContactFormComponent, InstallmentCalculatorComponent, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  slug = input.required<string>();

  project = computed(() => {
    return PROJECTS.find((p) => p.slug === this.slug());
  });

  ngOnInit(): void {
    const project = this.project();
    if (!project) {
      this.router.navigate(['/404'], { skipLocationChange: true });
      return;
    }

    this.seo.updateSeo({
      title: project.nameKey,
      description: project.descriptionKey,
      canonicalUrl: `https://alahram-developments.com/projects/${project.slug}`,
      ogImage: `https://alahram-developments.com/${project.imageUrl}`,
    });

    createJsonLd(this.document, buildProjectSchema(project));
    createJsonLd(this.document, buildBreadcrumbSchema([
      { name: 'الرئيسية', url: 'https://alahram-developments.com' },
      { name: 'مشاريعنا', url: 'https://alahram-developments.com/projects' },
      { name: project.nameKey, url: `https://alahram-developments.com/projects/${project.slug}` },
    ]));
  }
}
