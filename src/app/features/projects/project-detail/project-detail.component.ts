import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { SeoService } from '@core/services/seo.service';
import { ContactFormComponent } from '@shared/ui';
import { PROJECTS } from '../data/projects.data';

@Component({
  selector: 'ahram-project-detail',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, ContactFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);

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
    });
  }
}
