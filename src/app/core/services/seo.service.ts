import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';

export interface SeoArticleData {
  publishedTime: string;
  modifiedTime?: string;
  section?: string;
  tags?: readonly string[];
}

export interface SeoData {
  title: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageAlt?: string;
  ogUrl?: string;
  ogType?: string;
  canonicalUrl?: string;
  robots?: string;
  article?: SeoArticleData;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly transloco = inject(TranslocoService);

  updateSeo(data: SeoData): void {
    const isArabic = this.transloco.getActiveLang() === 'ar';
    const suffix = isArabic ? 'الأهرام للتطوير العقاري' : 'Al-Ahram Developments';
    const fullTitle = data.title ? `${data.title} | ${suffix}` : suffix;

    this.title.setTitle(fullTitle);

    // Clear stale JSON-LD before adding new ones
    this.clearJsonLd();

    if (data.description) {
      this.meta.updateTag({ name: 'description', content: data.description });
    }

    if (data.keywords) {
      this.meta.updateTag({ name: 'keywords', content: data.keywords });
    }

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: data.ogTitle ?? fullTitle });
    this.meta.updateTag({ property: 'og:type', content: data.ogType ?? 'website' });
    this.meta.updateTag({
      property: 'og:site_name',
      content: isArabic ? 'الأهرام للتطوير العقاري' : 'Al-Ahram Developments',
    });
    this.meta.updateTag({
      property: 'og:locale',
      content: isArabic ? 'ar_EG' : 'en_US',
    });

    if (data.ogDescription ?? data.description) {
      this.meta.updateTag({
        property: 'og:description',
        content: (data.ogDescription ?? data.description)!,
      });
    }

    if (data.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: data.ogImage });
      this.meta.updateTag({ property: 'og:image:width', content: String(data.ogImageWidth ?? 1200) });
      this.meta.updateTag({ property: 'og:image:height', content: String(data.ogImageHeight ?? 630) });
      if (data.ogImageAlt) {
        this.meta.updateTag({ property: 'og:image:alt', content: data.ogImageAlt });
      }
    }

    if (data.ogUrl ?? data.canonicalUrl) {
      this.meta.updateTag({ property: 'og:url', content: (data.ogUrl ?? data.canonicalUrl)! });
    }

    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    // TODO: Add twitter:site when a Twitter/X account is created
    // this.meta.updateTag({ name: 'twitter:site', content: '@YourHandle' });
    this.meta.updateTag({ name: 'twitter:title', content: data.ogTitle ?? fullTitle });

    if (data.ogDescription ?? data.description) {
      this.meta.updateTag({
        name: 'twitter:description',
        content: (data.ogDescription ?? data.description)!,
      });
    }

    if (data.ogImage) {
      this.meta.updateTag({ name: 'twitter:image', content: data.ogImage });
    }

    if (data.robots) {
      this.meta.updateTag({ name: 'robots', content: data.robots });
    }

    this.updateArticleTags(data.article);
    this.updateCanonicalUrl(data.canonicalUrl);
    this.updateHreflang(data.canonicalUrl);
  }

  clearJsonLd(): void {
    this.document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
  }

  addJsonLd(data: Record<string, unknown>): void {
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  private updateCanonicalUrl(url?: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');

    if (url) {
      if (!link) {
        link = this.document.createElement('link');
        link.setAttribute('rel', 'canonical');
        this.document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    } else if (link) {
      link.remove();
    }
  }

  private updateHreflang(canonicalUrl?: string): void {
    this.document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

    if (!canonicalUrl) return;

    // Derive alternate URL by swapping the locale segment
    const arUrl = canonicalUrl.replace(/\/(ar|en)(\/|$)/, '/ar$2');
    const enUrl = canonicalUrl.replace(/\/(ar|en)(\/|$)/, '/en$2');

    const hreflangs = [
      { lang: 'ar', href: arUrl },
      { lang: 'en', href: enUrl },
      { lang: 'x-default', href: arUrl },
    ];

    for (const { lang, href } of hreflangs) {
      const link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lang);
      link.setAttribute('href', href);
      this.document.head.appendChild(link);
    }
  }

  private updateArticleTags(article?: SeoArticleData): void {
    // Remove any previously set article tags first
    const articleProps = ['article:published_time', 'article:modified_time', 'article:section', 'article:tag'];
    for (const prop of articleProps) {
      this.meta.removeTag(`property="${prop}"`);
    }

    if (!article) return;

    this.meta.updateTag({ property: 'article:published_time', content: article.publishedTime });

    if (article.modifiedTime) {
      this.meta.updateTag({ property: 'article:modified_time', content: article.modifiedTime });
    }

    if (article.section) {
      this.meta.updateTag({ property: 'article:section', content: article.section });
    }

    for (const tag of article.tags ?? []) {
      this.meta.addTag({ property: 'article:tag', content: tag });
    }
  }

  resetSeo(): void {
    const isArabic = this.transloco.getActiveLang() === 'ar';
    const defaultTitle = isArabic ? 'الأهرام للتطوير العقاري' : 'Al-Ahram Developments';
    this.title.setTitle(defaultTitle);
    this.meta.removeTag('name="description"');
    this.meta.removeTag('name="keywords"');
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:image:width"');
    this.meta.removeTag('property="og:image:height"');
    this.meta.removeTag('property="og:image:alt"');
    this.meta.removeTag('property="og:url"');
    this.meta.removeTag('property="og:type"');
    this.meta.removeTag('property="og:site_name"');
    this.meta.removeTag('property="og:locale"');
    this.meta.removeTag('name="twitter:card"');
    this.meta.removeTag('name="twitter:title"');
    this.meta.removeTag('name="twitter:description"');
    this.meta.removeTag('name="twitter:image"');
    this.document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    this.updateArticleTags();
    this.clearJsonLd();
  }
}
