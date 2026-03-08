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
import { createJsonLd, buildBreadcrumbSchema } from '@shared/helpers';
import { BLOG_POSTS } from '../data/blog.data';

@Component({
  selector: 'ahram-blog-detail',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  slug = input.required<string>();

  post = computed(() => {
    return BLOG_POSTS.find((p) => p.slug === this.slug());
  });

  recentPosts = computed(() => {
    const current = this.slug();
    return BLOG_POSTS.filter((p) => p.slug !== current).slice(0, 3);
  });

  ngOnInit(): void {
    const post = this.post();
    if (!post) {
      this.router.navigate(['/404'], { skipLocationChange: true });
      return;
    }

    this.seo.updateSeo({
      title: post.titleKey,
      description: post.excerptKey,
      canonicalUrl: `https://alahram-developments.com/blog/${post.slug}`,
      ogImage: `https://alahram-developments.com/${post.imageUrl}`,
    });

    createJsonLd(this.document, {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.titleKey,
      image: `https://alahram-developments.com/${post.imageUrl}`,
      datePublished: post.date,
      author: {
        '@type': 'Organization',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'الأهرام للتطوير العقاري',
        url: 'https://alahram-developments.com',
      },
    });

    createJsonLd(this.document, buildBreadcrumbSchema([
      { name: 'الرئيسية', url: 'https://alahram-developments.com' },
      { name: 'المدونة', url: 'https://alahram-developments.com/blog' },
      { name: post.titleKey, url: `https://alahram-developments.com/blog/${post.slug}` },
    ]));
  }

  protected formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
