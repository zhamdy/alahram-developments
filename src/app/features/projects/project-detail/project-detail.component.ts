import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService } from '@core/services/seo.service';
import { ContactFormComponent, InstallmentCalculatorComponent } from '@shared/ui';
import { buildProjectSchema, buildBreadcrumbSchema } from '@shared/helpers';
import { environment } from '@env';
import { ImageFallbackDirective } from '@shared/directives';
import { PROJECTS } from '../data/projects.data';

@Component({
  selector: 'ahram-project-detail',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, ContactFormComponent, InstallmentCalculatorComponent, NgOptimizedImage, ImageFallbackDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

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

    const name = this.transloco.translate(project.nameKey);
    const description = this.transloco.translate(project.descriptionKey);

    this.seo.updateSeo({
      title: name,
      description: description,
      canonicalUrl: `${environment.siteUrl}/projects/${project.slug}`,
      ogImage: `${environment.siteUrl}/${project.imageUrl}`,
    });

    this.seo.addJsonLd(buildProjectSchema(project, name, description));
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: environment.siteUrl },
      { name: this.transloco.translate('projects.title'), url: `${environment.siteUrl}/projects` },
      { name, url: `${environment.siteUrl}/projects/${project.slug}` },
    ]));
  }
}
