import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService } from '@core/services/seo.service';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { BLOG_POSTS } from '../data/blog.data';

@Component({
  selector: 'ahram-blog-detail',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, NgOptimizedImage, FormatDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  slug = input.required<string>();

  post = computed(() => {
    return BLOG_POSTS.find(p => p.slug === this.slug());
  });

  recentPosts = computed(() => {
    const current = this.slug();
    return BLOG_POSTS.filter(p => p.slug !== current).slice(0, 3);
  });

  ngOnInit(): void {
    const post = this.post();
    if (!post) {
      this.router.navigate(['/404'], { skipLocationChange: true });
      return;
    }

    const title = this.transloco.translate(post.titleKey);
    const excerpt = this.transloco.translate(post.excerptKey);
    const postUrl = `https://alahram-developments.com/blog/${post.slug}`;

    this.seo.updateSeo({
      title,
      description: excerpt,
      ogType: 'article',
      canonicalUrl: postUrl,
      ogImage: `https://alahram-developments.com/${post.imageUrl}`,
    });

    this.seo.addJsonLd({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description: excerpt,
      image: `https://alahram-developments.com/${post.imageUrl}`,
      datePublished: post.date,
      dateModified: post.date,
      url: postUrl,
      mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
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

    this.seo.addJsonLd(
      buildBreadcrumbSchema([
        { name: this.transloco.translate('header.home'), url: 'https://alahram-developments.com' },
        {
          name: this.transloco.translate('header.blog'),
          url: 'https://alahram-developments.com/blog',
        },
        { name: title, url: postUrl },
      ]),
    );
  }

  protected getWhatsAppShareUrl(titleKey: string, slug: string): string {
    const title = this.transloco.translate(titleKey);
    const url = `https://alahram-developments.com/blog/${slug}`;
    return `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
  }

  protected getFacebookShareUrl(slug: string): string {
    const url = `https://alahram-developments.com/blog/${slug}`;
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }
}
