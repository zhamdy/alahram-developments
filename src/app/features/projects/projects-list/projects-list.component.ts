import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService } from '@core/services/seo.service';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { environment } from '@env';
import { ImageFallbackDirective } from '@shared/directives';
import { PROJECTS } from '../data/projects.data';

@Component({
  selector: 'ahram-projects-list',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, NgOptimizedImage, ImageFallbackDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss',
})
export class ProjectsListComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  protected readonly projects = PROJECTS;

  ngOnInit(): void {
    this.seo.updateSeo({
      title: this.transloco.translate('seo.projects.title'),
      description: this.transloco.translate('seo.projects.description'),
      keywords: this.transloco.translate('seo.projects.keywords'),
      canonicalUrl: `${environment.siteUrl}/projects`,
    });
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: environment.siteUrl },
      { name: this.transloco.translate('projects.title'), url: `${environment.siteUrl}/projects` },
    ]));
  }
}
