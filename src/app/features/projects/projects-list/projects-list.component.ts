import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { SeoService } from '@core/services/seo.service';
import { PROJECTS } from '../data/projects.data';

@Component({
  selector: 'ahram-projects-list',
  standalone: true,
  imports: [RouterLink, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss',
})
export class ProjectsListComponent implements OnInit {
  private readonly seo = inject(SeoService);
  protected readonly projects = PROJECTS;

  ngOnInit(): void {
    this.seo.updateSeo({
      title: 'مشاريعنا',
      description:
        'استكشف مشاريع الأهرام للتطوير العقاري — وحدات سكنية متميزة في المنطقة الذهبية بمدينة السادات',
      keywords:
        'مشاريع, الأهرام, مدينة السادات, وحدات سكنية, المنطقة الذهبية, شقق للبيع',
      canonicalUrl: 'https://alahram-developments.com/projects',
    });
  }
}
