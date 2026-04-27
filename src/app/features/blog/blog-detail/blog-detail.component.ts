import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService } from '@core/services/seo.service';
import { I18nService } from '@core/services';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { LocalizeRoutePipe } from '@shared/pipes';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { environment } from '@env';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LucideChevronLeft } from '@lucide/angular';
import { BLOG_POSTS } from '../data/blog.data';

@Component({
  selector: 'ahram-blog-detail',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, NgOptimizedImage, FormatDatePipe, ImageFallbackDirective, LocalizeRoutePipe, ScrollAnimateDirective, LucideChevronLeft],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);

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

    const lang = this.i18n.locale();
    const title = this.transloco.translate(post.titleKey);
    const excerpt = this.transloco.translate(post.excerptKey);
    const postUrl = `${environment.siteUrl}/${lang}/blog/${post.slug}`;

    this.seo.updateSeo({
      title,
      description: excerpt,
      ogType: 'article',
      canonicalUrl: postUrl,
      ogImage: `${environment.siteUrl}/${post.imageUrl}`,
    });

    const articleBody = post.contentKeys
      .map(key => this.transloco.translate(key))
      .join(' ');

    this.seo.addJsonLd({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description: excerpt,
      articleBody,
      wordCount: articleBody.split(/\s+/).length,
      inLanguage: this.transloco.getActiveLang() === 'ar' ? 'ar-EG' : 'en-US',
      keywords: post.tags.join(', '),
      image: `${environment.siteUrl}/${post.imageUrl}`,
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
        url: environment.siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${environment.siteUrl}/assets/images/logo-transparent.png`,
        },
      },
    });

    this.seo.addJsonLd(
      buildBreadcrumbSchema([
        { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
        {
          name: this.transloco.translate('header.blog'),
          url: `${environment.siteUrl}/${lang}/blog`,
        },
        { name: title, url: postUrl },
      ]),
    );
  }

  protected getWhatsAppShareUrl(titleKey: string, slug: string): string {
    const lang = this.i18n.locale();
    const title = this.transloco.translate(titleKey);
    const url = `${environment.siteUrl}/${lang}/blog/${slug}`;
    return `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
  }

  protected getFacebookShareUrl(slug: string): string {
    const lang = this.i18n.locale();
    const url = `${environment.siteUrl}/${lang}/blog/${slug}`;
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }
}
